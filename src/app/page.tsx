'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BookResult } from '@/lib/types'
import SkeletonCard from '@/components/SkeletonCard'
import ExternalSites from '@/components/ExternalSites'
import ResultsList from '@/components/ResultsList'
import FeaturedView from '@/components/FeaturedView'
import SearchHistory from '@/components/SearchHistory'
import FilterPanel, {
  DEFAULT_FILTERS,
  type SearchFilters,
} from '@/components/FilterPanel'
import ProviderStatus, {
  type ProviderStatusEntry,
} from '@/components/ProviderStatus'
import { addToHistory } from '@/lib/history'
import { mergeClient } from '@/lib/clientMerge'
import { rankResults } from '@/lib/rank'
import { useI18n } from '@/components/I18nProvider'
import { getCache, setCache, makeKey } from '@/lib/searchCache'
import { Search, Share2, Languages, Loader2, X, BookOpen, BookText, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useCustomProviders } from '@/lib/useCustomProviders'
import { useSettings } from '@/lib/useSettings'
import { applyFilters, applySort } from '@/lib/searchFilters'

type CacheData = {
  baseResults: BookResult[]
  byProvider: Record<string, BookResult[]>
}

const LANG_MAP: Record<string, string> = {
  pt: 'portuguese',
  en: 'english',
  es: 'spanish',
}

export default function HomePage() {
  const { t } = useI18n()
  const { providers: customProviders } = useCustomProviders()
  const { settings } = useSettings()

  const [q, setQ] = useState('')
  const [searchMode, setSearchMode] = useState<'books' | 'articles'>('books')
  const [onlyPdf, setOnlyPdf] = useState(() => false)
  const [loading, setLoading] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [baseResults, setBaseResults] = useState<BookResult[]>([])
  const [byProvider, setByProvider] = useState<Record<string, BookResult[]>>({})
  const [historyOpen, setHistoryOpen] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [providerStatuses, setProviderStatuses] = useState<
    ProviderStatusEntry[]
  >([])

  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<number | null>(null)

  const hasSearch = q.trim().length > 0

  // Restore state from URL params on mount
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.has('q')) setQ(p.get('q')!)
    if (p.has('pdf')) setOnlyPdf(p.get('pdf') === '1')
    const sort = p.get('sort') as SearchFilters['sort'] | null
    const format = p.get('fmt') as SearchFilters['format'] | null
    const yearMin = p.get('ymin') ? parseInt(p.get('ymin')!) : null
    const yearMax = p.get('ymax') ? parseInt(p.get('ymax')!) : null
    const sources = p.get('src') ? p.get('src')!.split(',') : []
    if (sort || format || yearMin || yearMax || sources.length) {
      setFilters({
        sort: sort ?? DEFAULT_FILTERS.sort,
        format: format ?? DEFAULT_FILTERS.format,
        yearMin: yearMin && !isNaN(yearMin) ? yearMin : null,
        yearMax: yearMax && !isNaN(yearMax) ? yearMax : null,
        sources,
      })
    }
    const mode = p.get('mode')
    if (mode === 'articles') setSearchMode('articles')
  }, [])

  // Persist search state to URL
  useEffect(() => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (onlyPdf) p.set('pdf', '1')
    if (searchMode !== 'books') p.set('mode', searchMode)
    if (filters.sort !== DEFAULT_FILTERS.sort) p.set('sort', filters.sort)
    if (filters.format !== DEFAULT_FILTERS.format) p.set('fmt', filters.format)
    if (filters.yearMin !== null) p.set('ymin', String(filters.yearMin))
    if (filters.yearMax !== null) p.set('ymax', String(filters.yearMax))
    if (filters.sources.length) p.set('src', filters.sources.join(','))
    const qs = p.toString()
    window.history.replaceState(
      {},
      '',
      qs ? `?${qs}` : window.location.pathname
    )
  }, [q, onlyPdf, searchMode, filters])

  // Sync onlyPdf from settings on first load
  useEffect(() => {
    if (!settingsLoaded && settings.searchLanguage !== undefined) {
      const hasUrlPdf = new URLSearchParams(window.location.search).has('pdf')
      if (!hasUrlPdf) setOnlyPdf(settings.onlyPdf)
      setSettingsLoaded(true)
    }
  }, [settings.onlyPdf, settings.searchLanguage, settingsLoaded])

  // Handle ?sync= URL param — auto-import a shared library link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const syncData = params.get('sync')
    if (!syncData) return
    const url = new URL(window.location.href)
    url.searchParams.delete('sync')
    window.history.replaceState({}, '', url.toString())
    import('@/lib/db').then(async ({ putBook }) => {
      try {
        const b64 = syncData.replace(/-/g, '+').replace(/_/g, '/')
        const binary = atob(b64)
        const bytes = new Uint8Array(binary.length).map((_, i) =>
          binary.charCodeAt(i)
        )
        const stream = new Blob([bytes])
          .stream()
          .pipeThrough(new DecompressionStream('gzip'))
        const json = await new Response(stream).text()
        const books = JSON.parse(json)
        let count = 0
        for (const b of books) {
          await putBook({
            ...b,
            savedAt: (b as { savedAt?: number }).savedAt ?? Date.now(),
          })
          count++
        }
        toast.success(t('sync.imported', { count }), {
          icon: '📚',
          duration: 5000,
        })
      } catch {
        toast.error(t('sync.error'), { duration: 4000 })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.key === '/' &&
          !e.metaKey &&
          !e.ctrlKey &&
          document.activeElement?.tagName !== 'INPUT') ||
        (e.key === 'k' && (e.metaKey || e.ctrlKey))
      ) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const ARTICLE_SOURCES = new Set(['arxiv', 'zenodo', 'hal', 'europe_pmc'])

  const mergedRanked = useMemo(() => {
    const all = [...baseResults, ...Object.values(byProvider).flat()]
    const merged = mergeClient(all)
    const modeFiltered = merged.filter((b) => {
      const src = b.source || ''
      return searchMode === 'books' ? !ARTICLE_SOURCES.has(src) : ARTICLE_SOURCES.has(src)
    })
    const ranked = q.trim()
      ? rankResults(q, modeFiltered, settings.searchLanguage)
      : modeFiltered
    const filtered = applyFilters(ranked, filters)
    return applySort(filtered, filters.sort)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseResults, byProvider, q, settings.searchLanguage, filters, searchMode])

  const availableSources = useMemo(() => {
    const all = [...baseResults, ...Object.values(byProvider).flat()]
    const srcSet = new Set<string>()
    all.forEach((b) => {
      if (b.source) {
        const src = b.source
        const visible = searchMode === 'books' ? !ARTICLE_SOURCES.has(src) : ARTICLE_SOURCES.has(src)
        if (visible) srcSet.add(src)
      }
    })
    return Array.from(srcSet)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseResults, byProvider, searchMode])

  const BUILTIN_PROVIDERS: ProviderStatusEntry[] = [
    { key: 'gutenberg', label: 'Gutenberg', state: 'loading', count: 0 },
    { key: 'internet_archive', label: 'Archive', state: 'loading', count: 0 },
    { key: 'open_library', label: 'Open Library', state: 'loading', count: 0 },
    { key: 'arxiv', label: 'arXiv', state: 'loading', count: 0 },
    { key: 'zenodo', label: 'Zenodo', state: 'loading', count: 0 },
    { key: 'hal', label: 'HAL', state: 'loading', count: 0 },
    { key: 'europe_pmc', label: 'EuropePMC', state: 'loading', count: 0 },
  ]

  const runSearch = useCallback(
    async (query: string, pdfOnly: boolean) => {
      if (!query.trim()) {
        setBaseResults([])
        setByProvider({})
        setProviderStatuses([])
        return
      }

      let nativeQuery = query
      if (settings.searchLanguage !== 'all') {
        const langTerm =
          LANG_MAP[settings.searchLanguage] || settings.searchLanguage
        nativeQuery += ` language:${langTerm}`
      }

      const sig = customProviders
        .map((p) => (p.type === 'opds' ? p.url : p.name))
        .sort()
        .join(',')
      const cacheKey = makeKey([
        'search',
        `q:${nativeQuery.toLowerCase()}`,
        `pdf:${pdfOnly}`,
        `prov:${sig}`,
      ])
      const cached = await getCache<CacheData>(cacheKey)

      if (cached) {
        setBaseResults(cached.baseResults)
        setByProvider(cached.byProvider)
        setProviderStatuses([
          ...BUILTIN_PROVIDERS.map((p) => ({
            ...p,
            state: 'done' as const,
            count:
              p.key === 'open_library'
                ? cached.baseResults.length
                : 0,
          })),
          ...customProviders.map((p) => {
            const key = p.type === 'opds' ? `opds:${p.url}` : `scrape:${p.name}`
            const label = p.type === 'opds' ? new URL(p.url).hostname : p.name
            return {
              key,
              label,
              state: 'done' as const,
              count: (cached.byProvider[key] || []).length,
            }
          }),
        ])
        return
      }

      abortRef.current?.abort()
      abortRef.current = new AbortController()
      const signal = abortRef.current.signal

      setLoading(true)
      setBaseResults([])
      setByProvider({})

      setProviderStatuses([
        ...BUILTIN_PROVIDERS,
        ...customProviders.map((p) => {
          const key = p.type === 'opds' ? `opds:${p.url}` : `scrape:${p.name}`
          let label = p.name || key
          try {
            if (p.type === 'opds') label = new URL(p.url).hostname
          } catch {}
          return { key, label, state: 'loading' as const, count: 0 }
        }),
      ])

      const updateStatus = (
        key: string,
        state: 'done' | 'error',
        count: number
      ) => {
        setProviderStatuses((prev) => {
          const entry = prev.find((s) => s.key === key)
          if (state === 'error' && entry) {
            toast.error(`${t('providers.title')}: ${entry.label}`, {
              duration: 4000,
            })
          }
          return prev.map((s) => (s.key === key ? { ...s, state, count } : s))
        })
      }

      const allBase: BookResult[] = []

      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(nativeQuery)}`,
          { signal }
        )

        if (res.ok && res.body) {
          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let buf = ''

          outer: while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buf += decoder.decode(value, { stream: true })
            const lines = buf.split('\n')
            buf = lines.pop() ?? ''

            for (const line of lines) {
              if (!line.trim() || signal.aborted) break outer
              try {
                const chunk = JSON.parse(line) as {
                  done?: boolean
                  source?: string
                  results?: BookResult[]
                }
                if (chunk.done) break outer
                if (chunk.source && chunk.results) {
                  allBase.push(...chunk.results)
                  const filtered = pdfOnly
                    ? allBase.filter((r) => r.pdfUrl)
                    : allBase
                  if (!signal.aborted) setBaseResults([...filtered])
                  updateStatus(chunk.source, 'done', chunk.results.length)
                }
              } catch {}
            }
          }
        } else {
          BUILTIN_PROVIDERS.forEach((p) => updateStatus(p.key, 'error', 0))
        }

        const customPromises = customProviders.map(async (p) => {
          const key = p.type === 'opds' ? `opds:${p.url}` : `scrape:${p.name}`
          if (signal.aborted) return []
          try {
            const r = await fetch(
              p.type === 'opds'
                ? `/api/search-by-provider?provider=opds&feed=${encodeURIComponent(p.url)}&q=${encodeURIComponent(query)}`
                : `/api/scrape`,
              {
                method: p.type === 'opds' ? 'GET' : 'POST',
                headers:
                  p.type === 'opds'
                    ? {}
                    : { 'Content-Type': 'application/json' },
                body:
                  p.type === 'opds'
                    ? undefined
                    : JSON.stringify({ q: query, config: p }),
                signal,
              }
            )
            const data = await r.json()
            if (!signal.aborted) {
              const list = (data.results || []).filter(
                (x: BookResult) => !pdfOnly || x.pdfUrl
              )
              setByProvider((prev) => ({ ...prev, [key]: list }))
              updateStatus(key, 'done', list.length)
              return list
            }
            return []
          } catch {
            if (!signal.aborted) updateStatus(key, 'error', 0)
            return []
          }
        })

        const customRes = await Promise.all(customPromises)

        if (!signal.aborted) {
          const resultByProv: Record<string, BookResult[]> = {}
          customProviders.forEach((p, i) => {
            const key =
              p.type === 'opds' ? `opds:${p.url}` : `scrape:${p.name}`
            resultByProv[key] = customRes[i] || []
          })
          const filteredBase = pdfOnly
            ? allBase.filter((r) => r.pdfUrl)
            : allBase
          await setCache(cacheKey, {
            baseResults: filteredBase,
            byProvider: resultByProv,
          })
        }
      } finally {
        if (!signal.aborted) setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customProviders, settings.searchLanguage, t]
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const delay = q.trim().length >= 3 ? 400 : 800
    debounceRef.current = window.setTimeout(() => {
      runSearch(q, onlyPdf)
      if (q.trim().length > 2) addToHistory(q.trim())
    }, delay)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [q, onlyPdf, runSearch])

  const handleRetry = useCallback(
    async (key: string) => {
      if (!q.trim()) return

      setProviderStatuses((prev) =>
        prev.map((s) =>
          s.key === key ? { ...s, state: 'loading', count: 0 } : s
        )
      )

      let nativeQuery = q
      if (settings.searchLanguage !== 'all') {
        nativeQuery += ` language:${LANG_MAP[settings.searchLanguage] || settings.searchLanguage}`
      }

      const updateStatus = (
        k: string,
        state: 'done' | 'error',
        count: number
      ) => {
        setProviderStatuses((prev) =>
          prev.map((s) => (s.key === k ? { ...s, state, count } : s))
        )
      }

      if (key === 'base') {
        try {
          const r = await fetch(
            `/api/search?q=${encodeURIComponent(nativeQuery)}&onlyPdf=${onlyPdf ? 1 : 0}`
          )
          const d = await r.json()
          const results = d.results || []
          setBaseResults(results)
          updateStatus('base', 'done', results.length)
        } catch {
          updateStatus('base', 'error', 0)
        }
        return
      }

      const provider = customProviders.find((p) => {
        const k = p.type === 'opds' ? `opds:${p.url}` : `scrape:${p.name}`
        return k === key
      })
      if (!provider) return

      try {
        const res = await fetch(
          provider.type === 'opds'
            ? `/api/search-by-provider?provider=opds&feed=${encodeURIComponent(provider.url)}&q=${encodeURIComponent(q)}`
            : `/api/scrape`,
          {
            method: provider.type === 'opds' ? 'GET' : 'POST',
            headers:
              provider.type === 'opds'
                ? {}
                : { 'Content-Type': 'application/json' },
            body:
              provider.type === 'opds'
                ? undefined
                : JSON.stringify({ q, config: provider }),
          }
        )
        const data = await res.json()
        const list = (data.results || []).filter(
          (x: BookResult) => !onlyPdf || x.pdfUrl
        )
        setByProvider((prev) => ({ ...prev, [key]: list }))
        updateStatus(key, 'done', list.length)
      } catch {
        updateStatus(key, 'error', 0)
      }
    },
    [q, onlyPdf, settings.searchLanguage, customProviders]
  )

  const shareSearch = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success(t('action.share.copied'), { icon: '🔗' })
  }

  const handleHistorySelect = (term: string) => {
    setQ(term)
    setHistoryOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div className="relative mx-auto max-w-5xl px-4 pb-4">
      {/* Hero section — centered when idle, compact when searching */}
      <div
        className={`transition-all duration-500 ${hasSearch ? 'pt-3 md:pt-4' : 'pt-5 md:pt-8'}`}
      >
        <div
          className={`mx-auto transition-all duration-500 ${hasSearch ? 'max-w-none text-left' : 'max-w-2xl text-center'}`}
        >
          {!hasSearch && (
            <div className="animate-in fade-in slide-in-from-bottom-2 mb-5 space-y-2 duration-500">
              <div className="inline-flex items-center rounded border border-border/60 bg-muted/50 px-2.5 py-1 text-[11px] font-medium tracking-wide text-muted-foreground">
                {t('home.badge')}
              </div>
              <h1 className="text-2xl leading-tight font-bold tracking-tight text-foreground md:text-4xl">
                {t('home.title')}
              </h1>
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground">
                {t('home.tagline')}
              </p>
            </div>
          )}

          {/* Search bar */}
          <div
            className={`group sticky top-20 z-30 ${hasSearch ? '' : 'mx-auto max-w-2xl'} mb-4`}
          >
            <div className="absolute -inset-0.5 rounded-2xl bg-primary/20 opacity-0 blur transition duration-500 group-focus-within:opacity-60" />
            <div className="relative rounded-2xl border border-border/60 bg-background/80 p-2 shadow-xl backdrop-blur-xl transition-all">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  inputRef.current?.blur()
                }}
                className="relative flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <div className="relative flex-1">
                  {loading ? (
                    <Loader2 className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 animate-spin text-primary" />
                  ) : (
                    <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  )}
                  <input
                    ref={inputRef}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onFocus={() => setHistoryOpen(true)}
                    onBlur={() => setTimeout(() => setHistoryOpen(false), 200)}
                    placeholder={t('search.placeholder.clean')}
                    aria-label={t('search.aria')}
                    className="field h-12 w-full rounded-xl border-transparent bg-transparent pr-12 pl-12 text-lg shadow-none placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-0"
                    autoComplete="off"
                  />
                  {q && (
                    <button
                      type="button"
                      onClick={() => {
                        setQ('')
                        inputRef.current?.focus()
                      }}
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={t('action.close')}
                    >
                      <X size={16} />
                    </button>
                  )}
                  {!q && (
                    <kbd className="absolute top-1/2 right-4 hidden h-6 -translate-y-1/2 items-center gap-1 rounded border border-border bg-muted/50 px-2 font-mono text-xs font-medium text-muted-foreground opacity-60 select-none sm:flex">
                      /
                    </kbd>
                  )}
                  <SearchHistory
                    visible={historyOpen && q === ''}
                    onSelect={handleHistorySelect}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-border/50 px-2 pt-2 pb-2 sm:justify-end sm:border-t-0 sm:pt-0 sm:pb-0">
                  {settings.searchLanguage !== 'all' && (
                    <span
                      className="hidden cursor-help items-center gap-1 rounded border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-bold tracking-wider text-primary uppercase sm:flex"
                      title={t('settings.lang.desc')}
                    >
                      <Languages size={10} />
                      {settings.searchLanguage.toUpperCase()}
                    </span>
                  )}

                  <label className="chip h-9 cursor-pointer border-border/50 bg-muted/30 px-3 transition-colors select-none hover:bg-muted/80">
                    <input
                      type="checkbox"
                      checked={onlyPdf}
                      onChange={(e) => setOnlyPdf(e.target.checked)}
                      className="mr-2 h-4 w-4 accent-primary"
                    />
                    {t('search.onlyPdf')}
                  </label>

                  {q.trim() && (
                    <button
                      onClick={shareSearch}
                      className="btn-icon h-9 w-9 bg-muted/30 transition-colors hover:bg-primary/10 hover:text-primary"
                      title={t('action.share')}
                      type="button"
                      aria-label={t('action.share')}
                    >
                      <Share2 size={18} />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div>
        {hasSearch ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Books / Articles mode toggle */}
            <div className="mb-3 flex items-center gap-2">
              <div className="flex gap-0.5 rounded-lg bg-muted p-0.5">
                <button
                  onClick={() => setSearchMode('books')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    searchMode === 'books'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <BookText size={12} aria-hidden="true" />
                  {t('search.mode.books')}
                </button>
                <button
                  onClick={() => setSearchMode('articles')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    searchMode === 'articles'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText size={12} aria-hidden="true" />
                  {t('search.mode.articles')}
                </button>
              </div>
            </div>

            {/* Provider Status */}
            <ProviderStatus
              providers={providerStatuses}
              onRetry={handleRetry}
            />

            {/* Filter Panel */}
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              availableSources={availableSources}
            />

            {/* Result count */}
            {mergedRanked.length > 0 && (
              <p className="mb-4 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {mergedRanked.length}
                </span>{' '}
                {t('results.count', { count: mergedRanked.length })}
                {filters.sort !== 'relevance' && (
                  <span className="ml-2 text-primary">
                    ·{' '}
                    {filters.sort === 'year_desc'
                      ? t('library.sort.year_desc')
                      : filters.sort === 'year_asc'
                        ? t('library.sort.year_asc')
                        : t('library.sort.title')}
                  </span>
                )}
              </p>
            )}

            {loading && mergedRanked.length === 0 ? (
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : mergedRanked.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/5 py-24 text-center text-muted-foreground">
                <div className="mb-4 rounded-full bg-muted/50 p-6 shadow-inner">
                  <BookOpen
                    size={40}
                    strokeWidth={1}
                    className="text-primary/50"
                  />
                </div>
                <h3 className="mb-1 text-lg font-medium text-foreground">
                  {t('results.none_title')}
                </h3>
                <p className="mx-auto max-w-xs text-center text-sm text-muted-foreground">
                  {t('results.check_spelling')}
                  {settings.searchLanguage !== 'all' && (
                    <span className="mt-2 block font-medium text-primary">
                      {t('results.lang_filter_active', {
                        lang: settings.searchLanguage.toUpperCase(),
                      })}
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <ResultsList key={`${q}-${searchMode}`} items={mergedRanked} />
            )}

            <ExternalSites currentQuery={q} />
          </div>
        ) : (
          <FeaturedView />
        )}
      </div>

      <footer className="mt-4 border-t border-border/40 py-3 text-center text-xs text-muted-foreground/50">
        {t('footer.disclaimer')}
      </footer>
    </div>
  )
}
