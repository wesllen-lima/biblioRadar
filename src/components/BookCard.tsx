'use client'
import { useEffect, useRef, useState } from 'react'
import type { BookResult } from '@/lib/types'
import { useLibrary } from '@/lib/useLibrary'
import CitationModal from './CitationModal'
import BookDetailModal from './BookDetailModal'
import {
  Download,
  Heart,
  Quote,
  ShieldAlert,
  Globe,
  HelpCircle,
  Loader2,
  Clock,
  Tag,
  Plus,
  X,
  BookMarked,
  CheckCircle2,
  Circle,
  BookText,
} from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from './I18nProvider'
import CoverImage from '@/components/CoverImage'

type HeadInfo = { ok: boolean; status: number; contentType?: string }
type PdfStatus = 'pending' | 'checking' | 'ok' | 'unknown' | 'dead'
type ReadingStatus = 'unread' | 'reading' | 'done'

function formatRelativeDate(ts: number, locale: string): string {
  const diff = Date.now() - ts
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return rtf.format(0, 'day')
  if (days < 30) return rtf.format(-days, 'day')
  const months = Math.floor(days / 30)
  if (months < 12) return rtf.format(-months, 'month')
  return rtf.format(-Math.floor(months / 12), 'year')
}

const PREDEFINED_TAGS = [
  'tag.favorites',
  'tag.reading',
  'tag.toread',
  'tag.done',
  'tag.reference',
] as const

const STATUS_CONFIG: Record<
  ReadingStatus,
  { icon: React.ReactNode; label: string; color: string; next: ReadingStatus }
> = {
  unread: {
    icon: <Circle size={13} />,
    label: 'status.unread',
    color: 'text-muted-foreground',
    next: 'reading',
  },
  reading: {
    icon: <BookMarked size={13} />,
    label: 'status.reading',
    color: 'text-amber-500 dark:text-amber-400',
    next: 'done',
  },
  done: {
    icon: <CheckCircle2 size={13} />,
    label: 'status.done',
    color: 'text-emerald-600 dark:text-emerald-400',
    next: 'unread',
  },
}

export default function BookCard({ book }: { book: BookResult }) {
  const { t, locale } = useI18n()
  const { isSaved, toggleBook, updateBook, items } = useLibrary()
  const [showCitation, setShowCitation] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showTagMenu, setShowTagMenu] = useState(false)
  const saved = isSaved(book.id)

  // Use library's copy when saved (reflects user-added tags/readingStatus)
  const liveBook = saved ? (items.find((b) => b.id === book.id) ?? book) : book

  const tt = (key: string, fallback: string) => {
    const v = t(key)
    return v === key ? fallback : v
  }

  const [pdfStatus, setPdfStatus] = useState<PdfStatus>(
    book.pdfUrl ? 'pending' : 'dead'
  )
  const cardRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!book.pdfUrl) return
    const el = cardRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [book.pdfUrl])

  useEffect(() => {
    if (!inView || !book.pdfUrl) return
    let cancelled = false
    setPdfStatus('checking')
    ;(async () => {
      try {
        const ctrl = new AbortController()
        const id = setTimeout(() => ctrl.abort(), 3000)
        const r = await fetch(
          `/api/head?${new URLSearchParams({ u: book.pdfUrl! })}`,
          { signal: ctrl.signal }
        )
        clearTimeout(id)
        const info = (await r.json()) as HeadInfo
        const looksPdf = !!info.contentType && /pdf/i.test(info.contentType)
        const okish = info.ok || looksPdf || info.status === 405
        if (!cancelled)
          setPdfStatus(okish && looksPdf ? 'ok' : okish ? 'unknown' : 'dead')
      } catch {
        if (!cancelled) setPdfStatus('unknown')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [inView, book.pdfUrl])

  const handleToggle = () => {
    if (saved) {
      // Optimistic removal with undo action
      toggleBook(book)
      toast.success(t('library.removed'), {
        icon: '🗑️',
        action: {
          label: t('action.undo') || 'Undo',
          onClick: () => toggleBook(book),
        },
        duration: 4000,
      })
    } else {
      toggleBook(book)
      toast.success(t('library.saved'), { icon: '❤️', duration: 2000 })
    }
  }

  const handleStatusCycle = () => {
    if (!saved) return
    const current =
      (liveBook.readingStatus as ReadingStatus | undefined) ?? 'unread'
    const next = STATUS_CONFIG[current].next
    updateBook(book.id, { readingStatus: next })
  }

  const handleTagToggle = (tagKey: string) => {
    if (!saved) return
    const label = t(tagKey)
    const tags = liveBook.tags ?? []
    const next = tags.includes(label)
      ? tags.filter((tg) => tg !== label)
      : [...tags, label]
    updateBook(book.id, { tags: next })
  }

  const proxyHref = book.pdfUrl
    ? `/api/download?url=${encodeURIComponent(book.pdfUrl)}`
    : undefined

  const renderEpubButton = () => {
    if (!book.epubUrl) return null
    return (
      <a
        href={book.epubUrl}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="btn-outline flex h-8 items-center gap-1.5 px-3 text-xs font-semibold shadow-sm"
        title={tt('book.downloadEpub', 'Download EPUB')}
      >
        <BookText size={13} strokeWidth={2.5} />
        <span className="hidden sm:inline">EPUB</span>
      </a>
    )
  }
  const sourceUrl =
    book.readUrl || (book.id.startsWith('http') ? book.id : null)

  const getSourceColor = (src: string) => {
    if (src.includes('gutenberg')) return 'badge-source-gutenberg'
    if (src.includes('archive')) return 'badge-source-archive'
    if (src.includes('open_library')) return 'badge-source-openlibrary'
    if (src.includes('arxiv')) return 'badge-source-arxiv'
    if (src === 'zenodo') return 'badge-source-zenodo'
    if (src === 'hal') return 'badge-source-hal'
    if (src === 'europe_pmc') return 'badge-source-europepmc'
    return 'badge-source-default'
  }

  const renderPdfButton = () => {
    if (!book.pdfUrl || pdfStatus === 'dead') return null
    if (pdfStatus === 'pending' || pdfStatus === 'checking') {
      return (
        <span className="btn-outline flex h-8 cursor-default items-center gap-1.5 px-3 text-xs opacity-60 select-none">
          <Loader2 size={13} className="animate-spin" />
          <span className="hidden sm:inline">PDF</span>
        </span>
      )
    }

    const isVerified = pdfStatus === 'ok'

    return (
      <div className="flex items-center gap-1">
        {/* Direct download */}
        <a
          href={book.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
          className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold shadow-sm transition-all ${
            isVerified
              ? 'btn-danger'
              : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/40'
          }`}
          title={
            isVerified
              ? tt('book.download', 'Baixar PDF')
              : tt('book.notVerified', 'Link não verificado — tente o proxy')
          }
        >
          <Download size={13} strokeWidth={2.5} />
          <span className="hidden sm:inline">PDF</span>
          {!isVerified && <HelpCircle size={11} className="opacity-70" />}
        </a>

        {/* Proxy download — shown when direct link exists; primary when unverified */}
        {proxyHref && (
          <a
            href={proxyHref}
            download
            className={`flex h-8 items-center gap-1 rounded-lg border px-2 text-xs font-medium transition-all ${
              isVerified
                ? 'btn-icon w-8 border-border text-muted-foreground hover:bg-muted'
                : 'border-primary/30 bg-primary/5 px-2.5 text-primary hover:bg-primary/10'
            }`}
            title={tt(
              'book.serverTooltip',
              'Proxy Seguro — download via servidor'
            )}
          >
            <ShieldAlert size={13} />
            {!isVerified && (
              <span className="hidden text-[11px] sm:inline">Proxy</span>
            )}
          </a>
        )}
      </div>
    )
  }

  const readingStatus =
    (liveBook.readingStatus as ReadingStatus | undefined) ?? 'unread'
  const statusCfg = STATUS_CONFIG[readingStatus]
  const tags = liveBook.tags ?? []

  return (
    <>
      <article
        ref={cardRef}
        className="card group relative flex h-full flex-col overflow-hidden bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
      >
        <div className="flex h-full gap-4 sm:gap-5">
          {/* Capa */}
          <button
            onClick={() => setShowDetail(true)}
            className="relative h-[130px] w-[90px] shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted shadow-sm transition-all group-hover:shadow-md hover:ring-2 hover:ring-primary/40"
            aria-label={t('book.details')}
          >
            <CoverImage
              src={book.cover}
              title={book.title}
              imgClassName="object-cover"
              hoverClassName="transition-transform duration-500 group-hover:scale-105"
              fallbackSize="sm"
            />
          </button>

          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              <button
                onClick={() => setShowDetail(true)}
                className="line-clamp-2 text-left text-base leading-snug font-bold text-foreground underline-offset-2 transition-colors group-hover:text-primary hover:underline"
                title={book.title}
              >
                {book.title || tt('book.untitled', 'Sem título')}
              </button>

              <p className="mt-1.5 line-clamp-1 text-sm font-medium text-muted-foreground">
                {book.authors?.length
                  ? book.authors.join(', ')
                  : tt('book.unknownAuthor', 'Autor desconhecido')}
              </p>

              {book.description && (
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
                  {book.description}
                </p>
              )}

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {book.savedAt && (
                  <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground/60">
                    <Clock size={9} />
                    {formatRelativeDate(book.savedAt, locale)}
                  </span>
                )}
                {book.source && (
                  <span
                    className={`rounded border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${getSourceColor(book.source)}`}
                  >
                    {book.source.replace(/_/g, ' ')}
                  </span>
                )}
                {book.year && (
                  <span className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-xs text-muted-foreground/60">
                    {book.year}
                  </span>
                )}
              </div>

              {/* Tags (só quando salvo) */}
              {saved && (
                <div className="relative mt-2 flex flex-wrap items-center gap-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-0.5 rounded-full border border-primary/20 bg-primary/8 px-1.5 py-0.5 text-[10px] text-primary/80"
                    >
                      {tag}
                      <button
                        onClick={() =>
                          handleTagToggle(
                            PREDEFINED_TAGS.find((k) => t(k) === tag) ?? tag
                          )
                        }
                        className="ml-0.5 hover:text-destructive"
                        title={t('tag.remove')}
                      >
                        <X size={9} />
                      </button>
                    </span>
                  ))}
                  <div className="relative">
                    <button
                      onClick={() => setShowTagMenu((v) => !v)}
                      className="flex items-center gap-0.5 rounded-full border border-dashed border-border px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                      title={t('tag.add')}
                    >
                      <Plus size={9} />
                      <Tag size={9} />
                    </button>
                    {showTagMenu && (
                      <div className="animate-in fade-in slide-in-from-top-1 absolute top-full left-0 z-20 mt-1 flex min-w-[130px] flex-col gap-0.5 rounded-lg border border-border bg-card p-1.5 shadow-lg duration-150">
                        {PREDEFINED_TAGS.map((key) => {
                          const label = t(key)
                          const active = tags.includes(label)
                          return (
                            <button
                              key={key}
                              onClick={() => {
                                handleTagToggle(key)
                                setShowTagMenu(false)
                              }}
                              className={`flex items-center justify-between rounded px-2 py-1 text-left text-xs transition-colors hover:bg-muted ${active ? 'font-medium text-primary' : 'text-foreground'}`}
                            >
                              {label}
                              {active && <X size={10} className="opacity-60" />}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Barra de Ações */}
            <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-border/40 pt-3">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                {renderPdfButton()}
                {renderEpubButton()}
                {sourceUrl && (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline h-8 gap-1.5 px-3 text-xs shadow-sm"
                    title="Abrir no site original"
                  >
                    <Globe size={13} />
                    <span className="hidden sm:inline">
                      {tt('book.source', 'Ver Fonte')}
                    </span>
                    <span className="sm:hidden">Web</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-1">
                {/* Reading status (só quando salvo) */}
                {saved && (
                  <button
                    onClick={handleStatusCycle}
                    className={`btn-icon h-8 w-8 transition-all ${statusCfg.color}`}
                    title={t(statusCfg.label)}
                    aria-label={t(statusCfg.label)}
                  >
                    {statusCfg.icon}
                  </button>
                )}

                <button
                  onClick={() => setShowCitation(true)}
                  className="btn-icon h-8 w-8 hover:bg-primary/10 hover:text-primary"
                  title={tt('citation.title', 'Citar')}
                  aria-label={tt('citation.title', 'Citar')}
                >
                  <Quote size={16} />
                </button>

                <button
                  onClick={handleToggle}
                  className={`btn-icon heart-btn h-8 w-8 transition-all ${saved ? 'border border-red-100 bg-red-50 text-red-500 hover:bg-red-100' : 'hover:bg-red-50 hover:text-red-500'}`}
                  title={saved ? t('common.remove') : t('library.saved')}
                  aria-label={saved ? t('common.remove') : t('library.saved')}
                >
                  <Heart
                    size={16}
                    fill={saved ? 'currentColor' : 'none'}
                    strokeWidth={saved ? 0 : 2}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>

      {showCitation && (
        <CitationModal book={book} onClose={() => setShowCitation(false)} />
      )}
      {showDetail && (
        <BookDetailModal book={book} onClose={() => setShowDetail(false)} />
      )}
    </>
  )
}
