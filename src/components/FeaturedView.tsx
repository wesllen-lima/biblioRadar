'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { BookResult } from '@/lib/types'
import {
  Sparkles,
  BookOpen,
  Atom,
  Cpu,
  Fingerprint,
  Globe,
  Heart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import BookDetailModal from './BookDetailModal'
import CoverImage from './CoverImage'
import { getCache, setCache, makeKey } from '@/lib/searchCache'
import { useI18n } from './I18nProvider'
import { useLibrary } from '@/lib/useLibrary'
import { toast } from 'sonner'

type Topic = {
  id: string
  labelKey: string
  queries: Record<string, string[]>
  icon: React.ElementType
}

// Each topic has multiple short queries — results are merged for a fuller carousel
const TOPICS: Topic[] = [
  {
    id: 'classics',
    labelKey: 'featured.topic.br-classics',
    queries: {
      'pt-BR': ['Machado de Assis', 'Clarice Lispector', 'José de Alencar'],
      en: ['Shakespeare', 'Jane Austen', 'Mark Twain'],
      es: ['Cervantes', 'García Márquez', 'Borges'],
    },
    icon: BookOpen,
  },
  {
    id: 'scifi',
    labelKey: 'featured.topic.scifi',
    queries: {
      'pt-BR': ['ficção científica', 'inteligência artificial futuro'],
      en: ['science fiction', 'artificial intelligence'],
      es: ['ciencia ficción', 'inteligencia artificial'],
    },
    icon: Atom,
  },
  {
    id: 'tech',
    labelKey: 'featured.topic.tech',
    queries: {
      'pt-BR': ['programação software', 'engenharia algoritmos'],
      en: ['software engineering', 'programming algorithms'],
      es: ['ingeniería de software', 'programación algoritmos'],
    },
    icon: Cpu,
  },
  {
    id: 'mystery',
    labelKey: 'featured.topic.mystery',
    queries: {
      'pt-BR': ['mistério detetive', 'thriller crime'],
      en: ['mystery detective', 'thriller crime'],
      es: ['misterio detective', 'thriller crimen'],
    },
    icon: Fingerprint,
  },
  {
    id: 'history',
    labelKey: 'featured.topic.history',
    queries: {
      'pt-BR': ['história civilização', 'guerra mundial história'],
      en: ['history civilization', 'world history'],
      es: ['historia civilización', 'historia mundial'],
    },
    icon: Globe,
  },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const CACHE_TTL = 10 * 60 * 1000
const MAX_BOOKS = 16

/** Fetch results for a single query, with a timeout */
async function fetchQuery(query: string): Promise<BookResult[]> {
  const ctrl = new AbortController()
  const tid = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: ctrl.signal,
    })
    const data = await res.json()
    return (data.results ?? []) as BookResult[]
  } catch {
    return []
  } finally {
    clearTimeout(tid)
  }
}

/** Merge results from multiple queries, dedupe by id, prefer books with covers */
function buildCarousel(allResults: BookResult[][]): BookResult[] {
  const seen = new Set<string>()
  const merged: BookResult[] = []
  for (const results of allResults) {
    for (const b of results) {
      if (!seen.has(b.id)) {
        seen.add(b.id)
        merged.push(b)
      }
    }
  }
  const withCover = shuffle(merged.filter((b) => b.cover))
  const withoutCover = shuffle(merged.filter((b) => !b.cover))
  // Fill: as many covers as possible, then pad with no-cover books to reach MAX_BOOKS
  return [...withCover, ...withoutCover].slice(0, MAX_BOOKS)
}

function FeaturedBookCard({ book }: { book: BookResult }) {
  const { t } = useI18n()
  const { isSaved, toggleBook } = useLibrary()
  const [showDetail, setShowDetail] = useState(false)
  const saved = isSaved(book.id)
  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleBook(book)
    toast.success(saved ? t('library.removed') : t('library.saved'), {
      icon: saved ? '🗑️' : '❤️',
    })
  }

  const sourceName = book.source
    ?.replace('open_library', 'Open Library')
    .replace('internet_archive', 'Archive')
    .replace('gutenberg', 'Gutenberg')
    .replace('arxiv', 'arXiv')
    .replace(/_/g, ' ')

  return (
    <>
      <div
        className="group relative flex h-[284px] w-36 shrink-0 cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1"
        style={{ boxShadow: 'var(--shadow-card)' }}
        onClick={() => setShowDetail(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setShowDetail(true)}
        aria-label={book.title}
      >
        {/* Cover — fills available space (flex-1), info section has fixed height */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <CoverImage
            src={book.cover}
            title={book.title}
            imgClassName="object-cover"
            hoverClassName="transition-transform duration-500 group-hover:scale-105"
            fallbackSize="md"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {sourceName && (
            <div className="absolute top-1.5 left-1.5">
              <span className="rounded-full bg-black/50 px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-white/90 uppercase backdrop-blur-sm">
                {sourceName}
              </span>
            </div>
          )}

          <button
            onClick={handleSave}
            className={`heart-btn absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full shadow-md backdrop-blur-sm transition-all ${
              saved
                ? 'bg-red-500 text-white'
                : 'bg-black/30 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-red-500'
            }`}
            aria-label={saved ? t('common.remove') : t('library.saved')}
          >
            <Heart
              size={11}
              fill={saved ? 'currentColor' : 'none'}
              strokeWidth={saved ? 0 : 2}
            />
          </button>

          {book.year && (
            <span className="absolute right-1.5 bottom-1.5 rounded bg-black/40 px-1.5 py-0.5 font-mono text-[9px] text-white/70 backdrop-blur-sm">
              {book.year}
            </span>
          )}
        </div>

        <div className="flex h-[68px] min-w-0 shrink-0 flex-col gap-0.5 overflow-hidden p-2">
          <h3 className="line-clamp-2 text-xs leading-snug font-semibold text-foreground transition-colors group-hover:text-primary">
            {book.title}
          </h3>
          <p className="line-clamp-1 text-[10px] text-muted-foreground">
            {book.authors?.join(', ') || '—'}
          </p>
        </div>
      </div>

      {showDetail && (
        <BookDetailModal book={book} onClose={() => setShowDetail(false)} />
      )}
    </>
  )
}

export default function FeaturedView() {
  const { t, locale } = useI18n()
  const [books, setBooks] = useState<BookResult[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTopic, setActiveTopic] = useState(TOPICS[0])
  const scrollRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  const loadTopic = useCallback(
    async (topic: Topic) => {
      setActiveTopic(topic)
      const cacheKey = makeKey(['featured2', topic.id, locale])
      const cached = await getCache<BookResult[]>(cacheKey, CACHE_TTL)
      if (cached && cached.length > 0) {
        setBooks(cached)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const queries = topic.queries[locale] ?? topic.queries.en
        const allResults = await Promise.all(queries.map(fetchQuery))
        const picked = buildCarousel(allResults)
        await setCache(cacheKey, picked)
        setBooks(picked)
      } catch {
        setBooks([])
      } finally {
        setLoading(false)
      }
    },
    [locale]
  )

  // Mark visible once element enters viewport
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Load (or reload) whenever the element is visible and locale is settled
  useEffect(() => {
    if (visible) loadTopic(TOPICS[0])
    // loadTopic already captures locale; re-run when either changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, locale])

  // Preload remaining topics in background
  useEffect(() => {
    const handle = requestIdleCallback(async () => {
      for (const topic of TOPICS.slice(1)) {
        const cacheKey = makeKey(['featured2', topic.id, locale])
        const cached = await getCache<BookResult[]>(cacheKey, CACHE_TTL)
        if (!cached || cached.length === 0) {
          try {
            const queries = topic.queries[locale] ?? topic.queries.en
            const allResults = await Promise.all(queries.map(fetchQuery))
            const picked = buildCarousel(allResults)
            await setCache(cacheKey, picked)
          } catch {}
        }
      }
    })
    return () => cancelIdleCallback(handle)
  }, [locale])

  const scrollBy = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' })
  }

  return (
    <div ref={rootRef} className="fade-blur-in flex flex-col gap-4 py-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-purple-600 text-white shadow-lg shadow-brand/25">
            <Sparkles size={18} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              {t('featured.title')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t('featured.subtitle')}
            </p>
          </div>
        </div>

        <div className="mt-1 flex shrink-0 items-center gap-1">
          <button
            onClick={() => scrollBy(-1)}
            className="btn-icon h-8 w-8"
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scrollBy(1)}
            className="btn-icon h-8 w-8"
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Topic tabs */}
      <div
        className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
        role="tablist"
        aria-label={t('featured.title')}
      >
        {TOPICS.map((topic) => {
          const Icon = topic.icon
          const isActive = activeTopic.id === topic.id
          return (
            <button
              key={topic.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => loadTopic(topic)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'border-brand bg-brand text-white shadow-md shadow-brand/25'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon size={13} aria-hidden="true" />
              {t(topic.labelKey)}
            </button>
          )
        })}
      </div>

      {/* Horizontal carousel */}
      <div role="tabpanel">
        {loading ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex h-[284px] w-36 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card"
              >
                <div className="skeleton min-h-0 flex-1" />
                <div className="h-[68px] shrink-0 space-y-1.5 p-2">
                  <div className="skeleton h-2.5 w-3/4 rounded" />
                  <div className="skeleton h-2 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="flex h-36 items-center justify-center text-sm text-muted-foreground">
            {t('results.none_title')}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="no-scrollbar flex gap-3 overflow-x-auto pb-2"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {books.map((book) => (
              <div key={book.id} style={{ scrollSnapAlign: 'start' }}>
                <FeaturedBookCard book={book} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
