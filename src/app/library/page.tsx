'use client'

import { useLibrary } from '@/lib/useLibrary'
import BookCard from '@/components/BookCard'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import {
  ArrowLeft,
  BookHeart,
  Search,
  Heart,
  ChevronLeft,
  ChevronRight,
  X,
  Circle,
  BookMarked,
  CheckCircle2,
  Network,
  CheckSquare,
  Square,
  Trash2,
  Tag,
  LayoutGrid,
  List,
  Download,
} from 'lucide-react'
import { useI18n } from '@/components/I18nProvider'
import type { BookResult } from '@/lib/types'
import { toast } from 'sonner'
import GridCard from '@/components/GridCard'

type SortKey =
  | 'saved_desc'
  | 'saved_asc'
  | 'title_az'
  | 'year_desc'
  | 'year_asc'
type StatusFilter = 'all' | 'unread' | 'reading' | 'done'
type ViewMode = 'list' | 'grid'

const PAGE_SIZE = 12

const STATUS_ICONS: Record<StatusFilter, React.ReactNode> = {
  all: null,
  unread: <Circle size={12} />,
  reading: <BookMarked size={12} />,
  done: <CheckCircle2 size={12} />,
}

const STATUS_COLORS: Record<StatusFilter, string> = {
  all: '',
  unread: 'text-muted-foreground',
  reading: 'text-amber-500 dark:text-amber-400',
  done: 'text-emerald-600 dark:text-emerald-400',
}

export default function LibraryPage() {
  const { items, isLoaded, toggleBook, updateBook } = useLibrary()
  const { t } = useI18n()
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('saved_desc')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [bulkMode, setBulkMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showBulkTagMenu, setShowBulkTagMenu] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  useEffect(() => {
    setMounted(true)
    const params = new URLSearchParams(window.location.search)
    const pre = params.get('author') ?? params.get('search')
    if (pre) setSearch(pre)
    const savedSort = params.get('sort') as SortKey | null
    if (savedSort) setSort(savedSort)
    const savedView = params.get('view') as ViewMode | null
    if (savedView) setViewMode(savedView)
  }, [])

  useEffect(() => {
    setPage(1)
  }, [search, sort, activeTag, statusFilter])
  useEffect(() => {
    if (!bulkMode) setSelected(new Set())
  }, [bulkMode])

  // Persist sort + view to URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (sort !== 'saved_desc') params.set('sort', sort)
    else params.delete('sort')
    if (viewMode !== 'list') params.set('view', viewMode)
    else params.delete('view')
    const qs = params.toString()
    window.history.replaceState(
      {},
      '',
      qs ? `?${qs}` : window.location.pathname
    )
  }, [sort, viewMode])

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const batchDelete = () => {
    const deletedBooks = [...selected]
      .map((id) => items.find((b) => b.id === id))
      .filter(Boolean) as BookResult[]
    for (const book of deletedBooks) toggleBook(book)
    const count = deletedBooks.length
    setSelected(new Set())
    setBulkMode(false)
    toast.success(
      `${count} ${count === 1 ? t('library.count_one') : t('library.count_other')} ${t('library.removed')}`,
      {
        icon: '🗑️',
        action: {
          label: t('action.undo'),
          onClick: () => {
            for (const book of deletedBooks) toggleBook(book)
          },
        },
        duration: 5000,
      }
    )
  }

  const batchAddTag = (tagLabel: string) => {
    for (const id of selected) {
      const book = items.find((b) => b.id === id)
      if (book && !(book.tags ?? []).includes(tagLabel))
        updateBook(id, { tags: [...(book.tags ?? []), tagLabel] })
    }
    setShowBulkTagMenu(false)
  }

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    items.forEach((b) => b.tags?.forEach((tag) => tagSet.add(tag)))
    return Array.from(tagSet)
  }, [items])

  const filtered = useMemo(() => {
    let result: BookResult[] = [...items]

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.authors?.some((a) => a.toLowerCase().includes(q))
      )
    }

    if (activeTag) {
      result = result.filter((b) => b.tags?.includes(activeTag))
    }

    if (statusFilter !== 'all') {
      result = result.filter(
        (b) => (b.readingStatus ?? 'unread') === statusFilter
      )
    }

    switch (sort) {
      case 'title_az':
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'year_desc':
        result.sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
        break
      case 'year_asc':
        result.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999))
        break
      case 'saved_asc':
        result.reverse()
        break
    }

    return result
  }, [items, search, sort, activeTag, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (!mounted || !isLoaded) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-12">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-32 w-full" />
      </div>
    )
  }

  const countLabel =
    items.length === 1 ? t('library.count_one') : t('library.count_other')
  const hasActiveFilters = search.trim() || activeTag || statusFilter !== 'all'

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 mx-auto max-w-5xl px-4 py-8 duration-300">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground md:text-3xl">
            <BookHeart className="text-primary" size={32} />
            {t('library.title')}
          </h1>
          <p className="mt-1 ml-1 text-sm text-muted-foreground">
            {items.length} {countLabel}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* View toggle */}
          {items.length > 0 && (
            <div className="flex items-center overflow-hidden rounded-lg border border-border">
              <button
                onClick={() => setViewMode('list')}
                className={`flex h-8 w-8 items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
              >
                <List size={15} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex h-8 w-8 items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
              >
                <LayoutGrid size={15} />
              </button>
            </div>
          )}

          {items.length > 0 && (
            <button
              onClick={() => setBulkMode((v) => !v)}
              className={`btn-ghost h-9 gap-2 px-3 ${bulkMode ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {bulkMode ? <CheckSquare size={16} /> : <Square size={16} />}
              <span className="hidden sm:inline">
                {bulkMode ? t('library.bulk.cancel') : t('library.bulk.toggle')}
              </span>
            </button>
          )}
          <Link
            href="/graph"
            className="btn-ghost h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
            aria-label={t('graph.title')}
          >
            <Network size={16} />
          </Link>
          <Link
            href="/"
            className="btn-ghost h-9 gap-2 px-3 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">{t('library.back')}</span>
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/10 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm">
            <BookHeart size={32} strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-lg font-medium text-foreground">
            {t('library.empty')}
          </h2>
          <p className="mb-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t('library.emptyDesc')}{' '}
            <Heart
              size={14}
              className="mx-1 inline fill-red-500 text-red-500"
            />
          </p>
          <Link href="/" className="btn-brand gap-2">
            <Search size={16} /> {t('search.placeholder.clean')}
          </Link>
        </div>
      ) : (
        <>
          {/* Search + Sort */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('library.search.placeholder')}
                className="field h-9 w-full rounded-lg pr-9 pl-9 text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:ring-1 focus:ring-primary/40 focus:outline-none"
            >
              <option value="saved_desc">{t('library.sort.newest')}</option>
              <option value="saved_asc">{t('library.sort.oldest')}</option>
              <option value="title_az">{t('library.sort.title')}</option>
              <option value="year_desc">{t('library.sort.year_desc')}</option>
              <option value="year_asc">{t('library.sort.year_asc')}</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {(['all', 'unread', 'reading', 'done'] as StatusFilter[]).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all ${
                    statusFilter === s
                      ? `border-primary/30 bg-primary/10 font-medium text-primary ${STATUS_COLORS[s]}`
                      : `border-border text-muted-foreground hover:border-primary/20 hover:text-foreground ${STATUS_COLORS[s]}`
                  }`}
                >
                  {STATUS_ICONS[s]}
                  {s === 'all' ? t('library.filter.all') : t(`status.${s}`)}
                </button>
              )
            )}

            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`rounded-full border px-2.5 py-1 text-xs transition-all ${
                  activeTag === tag
                    ? 'border-primary/30 bg-primary/10 font-medium text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/20 hover:text-foreground'
                }`}
              >
                {tag}
              </button>
            ))}

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearch('')
                  setActiveTag(null)
                  setStatusFilter('all')
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X size={11} /> {t('library.clearFilters')}
              </button>
            )}
          </div>

          {/* Count */}
          <p className="mb-4 text-xs text-muted-foreground">
            {hasActiveFilters
              ? t('library.showing_of', {
                  shown: filtered.length,
                  total: items.length,
                })
              : t('library.books_total', { total: items.length })}
            {totalPages > 1 &&
              ` · ${t('library.page_of', { page, total: totalPages })}`}
          </p>

          {/* Bulk action bar */}
          {bulkMode && (
            <div className="slide-in-bottom mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <button
                onClick={() => setSelected(new Set(filtered.map((b) => b.id)))}
                className="btn-ghost btn-sm gap-1.5 text-xs"
              >
                <CheckSquare size={13} /> {t('library.bulk.selectAll')}
              </button>
              <span className="text-xs text-muted-foreground">
                {t('library.bulk.selected', { n: selected.size })}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setShowBulkTagMenu((v) => !v)}
                    disabled={selected.size === 0}
                    className="btn-secondary btn-sm gap-1.5 disabled:opacity-40"
                  >
                    <Tag size={13} /> {t('library.bulk.tag')}
                  </button>
                  {showBulkTagMenu && (
                    <div className="scale-in absolute top-full right-0 z-30 mt-1 min-w-[140px] rounded-lg border border-border bg-card p-2 shadow-lg">
                      {allTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => batchAddTag(tag)}
                          className="w-full rounded-md px-3 py-1.5 text-left text-xs hover:bg-muted"
                        >
                          {tag}
                        </button>
                      ))}
                      {allTags.length === 0 && (
                        <p className="px-3 py-1.5 text-xs text-muted-foreground">
                          {t('tag.add')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={batchDelete}
                  disabled={selected.size === 0}
                  className="btn-danger btn-sm gap-1.5 disabled:opacity-40"
                >
                  <Trash2 size={13} /> {t('library.bulk.delete')}
                </button>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-muted/10 py-16 text-center text-muted-foreground">
              <Search size={32} strokeWidth={1.5} className="mb-3 opacity-50" />
              <p className="text-sm">{t('library.emptyFilter')}</p>
              <button
                onClick={() => {
                  setSearch('')
                  setActiveTag(null)
                  setStatusFilter('all')
                }}
                className="mt-3 text-xs text-primary hover:underline"
              >
                {t('library.clearFilters')}
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <>
              <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {paginated.map((book) => (
                  <GridCard
                    key={book.id}
                    book={book}
                    bulkMode={bulkMode}
                    selected={selected.has(book.id)}
                    onToggleSelect={() => toggleSelect(book.id)}
                  />
                ))}
              </div>
              {/* Export hint */}
              <div className="mt-4 flex items-center justify-end gap-2">
                <Link
                  href="/settings"
                  className="btn-ghost btn-sm gap-1.5 text-xs text-muted-foreground"
                >
                  <Download size={12} /> {t('data.export.title')}
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
                {paginated.map((book) => (
                  <div key={book.id} className="relative h-full">
                    {bulkMode && (
                      <button
                        onClick={() => toggleSelect(book.id)}
                        className={`scale-in absolute top-2 left-2 z-10 flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                          selected.has(book.id)
                            ? 'border-primary bg-primary text-white'
                            : 'border-border bg-card hover:border-primary/60'
                        }`}
                        aria-label={
                          selected.has(book.id)
                            ? t('library.deselect')
                            : t('library.select')
                        }
                      >
                        {selected.has(book.id) && <CheckSquare size={12} />}
                      </button>
                    )}
                    <div
                      className={
                        bulkMode && selected.has(book.id)
                          ? 'rounded-xl ring-2 ring-primary/40'
                          : ''
                      }
                    >
                      <BookCard book={book} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost h-9 w-9 disabled:opacity-40"
                aria-label={t('library.prev_page')}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 || p === totalPages || Math.abs(p - page) <= 2
                  )
                  .reduce<(number | '...')[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1)
                      acc.push('...')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span
                        key={`el-${i}`}
                        className="px-1 text-sm text-muted-foreground"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                      >
                        {p}
                      </button>
                    )
                  )}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-ghost h-9 w-9 disabled:opacity-40"
                aria-label={t('library.next_page')}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
