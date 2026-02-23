'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { BookResult } from '@/lib/types'
import { useLibrary } from '@/lib/useLibrary'
import CoverImage from '@/components/CoverImage'
import CitationModal from './CitationModal'
import { useFocusTrap } from '@/lib/useFocusTrap'
import {
  X,
  Download,
  Globe,
  Quote,
  Heart,
  ShieldAlert,
  Calendar,
  Languages,
  FileText,
  Tag,
  Hash,
  BookText,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from './I18nProvider'
import { sourceLabel, sourceBadgeClass } from '@/lib/sourceUtils'

const LANG_FLAG: Record<string, string> = {
  pt: '🇧🇷',
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  ru: '🇷🇺',
  zh: '🇨🇳',
  ja: '🇯🇵',
  ar: '🇸🇦',
}


export default function BookDetailModal({
  book,
  onClose,
}: {
  book: BookResult
  onClose: () => void
}) {
  const { t } = useI18n()
  const { isSaved, toggleBook, updateBook, items } = useLibrary()
  const [showCitation, setShowCitation] = useState(false)
  const saved = isSaved(book.id)
  const liveBook = saved ? (items.find((b) => b.id === book.id) ?? book) : book
  const [notes, setNotes] = useState(liveBook.notes ?? '')
  const notesDebounce = useRef<number | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const handleNotesChange = useCallback(
    (value: string) => {
      setNotes(value)
      if (notesDebounce.current) clearTimeout(notesDebounce.current)
      notesDebounce.current = window.setTimeout(() => {
        updateBook(book.id, { notes: value })
      }, 500)
    },
    [book.id, updateBook]
  )

  const proxyHref = book.pdfUrl
    ? `/api/download?url=${encodeURIComponent(book.pdfUrl)}&src=${encodeURIComponent(book.source ?? '')}`
    : undefined

  const sourceUrl =
    book.readUrl || (book.id.startsWith('http') ? book.id : null)

  const externalQuery = encodeURIComponent(
    [book.title, book.authors?.[0]].filter(Boolean).join(' ')
  )

  const FIND_ELSEWHERE = [
    {
      name: "Anna's Archive",
      url: `https://annas-archive.org/search?q=${externalQuery}`,
      color: 'hover:border-amber-400/50 hover:text-amber-600 dark:hover:text-amber-400',
    },
    {
      name: 'Google Scholar',
      url: `https://scholar.google.com/scholar?q=${externalQuery}`,
      color: 'hover:border-blue-400/50 hover:text-blue-600 dark:hover:text-blue-400',
    },
    {
      name: 'Semantic Scholar',
      url: `https://www.semanticscholar.org/search?q=${externalQuery}`,
      color: 'hover:border-emerald-400/50 hover:text-emerald-600 dark:hover:text-emerald-400',
    },
    {
      name: 'WorldCat',
      url: `https://search.worldcat.org/search?q=${externalQuery}`,
      color: 'hover:border-purple-400/50 hover:text-purple-600 dark:hover:text-purple-400',
    },
  ]

  useFocusTrap(modalRef)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleToggle = () => {
    toggleBook(book)
    toast.success(saved ? t('library.removed') : t('library.saved'), {
      icon: saved ? '🗑️' : '❤️',
    })
  }

  if (showCitation) {
    return <CitationModal book={book} onClose={() => setShowCitation(false)} />
  }

  const langFlag = book.language ? LANG_FLAG[book.language.toLowerCase()] : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={modalRef}
        className="scale-in max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-border bg-card sm:max-h-[90vh] sm:rounded-2xl"
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-4">
          <span
            className={`rounded border px-2 py-0.5 text-xs font-bold tracking-wider uppercase ${sourceBadgeClass(book.source || '')}`}
          >
            {sourceLabel(book.source || '')}
          </span>
          <button
            ref={closeRef}
            onClick={onClose}
            className="btn-icon h-8 w-8"
            aria-label={t('action.close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body — 2-column on desktop, stack on mobile */}
        <div className="p-4 sm:p-5 md:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:gap-6 md:flex-row">
            {/* Cover — responsive sizes */}
            <div className="relative mx-auto h-[180px] w-[120px] shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted shadow-lg sm:h-[240px] sm:w-[160px] md:mx-0 md:h-[300px] md:w-[200px]">
              <CoverImage
                src={book.cover}
                title={book.title}
                fallbackSize="lg"
              />
            </div>

            {/* Title + meta + actions */}
            <div className="flex min-w-0 flex-1 flex-col">
              <h2
                id="detail-modal-title"
                className="mb-2 text-xl leading-tight font-bold text-foreground md:text-2xl"
              >
                {book.title || t('book.untitled')}
              </h2>

              <p className="mb-4 text-sm font-medium text-muted-foreground">
                {book.authors?.length
                  ? book.authors.join(', ')
                  : t('book.unknownAuthor')}
              </p>

              <div className="mb-6 flex flex-wrap gap-2">
                {book.year && (
                  <span className="flex items-center gap-1 rounded-lg bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                    <Calendar size={11} /> {book.year}
                  </span>
                )}
                {book.language && (
                  <span className="flex items-center gap-1 rounded-lg bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                    <Languages size={11} />
                    {langFlag && <span>{langFlag}</span>}
                    {book.language.toUpperCase()}
                  </span>
                )}
                {book.format && book.format !== 'unknown' && (
                  <span className="flex items-center gap-1 rounded-lg bg-muted/50 px-2 py-1 text-xs text-muted-foreground uppercase">
                    <FileText size={11} /> {book.format}
                  </span>
                )}
                {book.isbn && (
                  <span className="flex items-center gap-1 rounded-lg bg-muted/50 px-2 py-1 font-mono text-xs text-muted-foreground">
                    <Hash size={11} /> {book.isbn}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-auto flex flex-wrap gap-2">
                <button
                  onClick={handleToggle}
                  className={`btn-sm gap-2 font-semibold ${
                    saved ? 'btn-danger' : 'btn-brand'
                  } heart-btn`}
                >
                  <Heart size={14} fill={saved ? 'currentColor' : 'none'} />
                  {saved ? t('common.remove') : t('library.saved')}
                </button>

                {book.pdfUrl && (
                  <a
                    href={book.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="btn-outline btn-sm gap-2"
                  >
                    <Download size={14} /> PDF
                  </a>
                )}

                {book.epubUrl && (
                  <a
                    href={book.epubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="btn-outline btn-sm gap-2"
                    title={t('book.downloadEpub')}
                  >
                    <BookText size={14} /> EPUB
                  </a>
                )}

                {sourceUrl && (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline btn-sm gap-2"
                  >
                    <Globe size={14} /> {t('book.source')}
                  </a>
                )}

                {proxyHref && book.pdfUrl && (
                  <a
                    href={proxyHref}
                    className="btn-outline btn-sm gap-2 border-warning/30 text-warning hover:bg-warning/10"
                    title={t('book.serverTooltip')}
                  >
                    <ShieldAlert size={14} /> Proxy
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {book.description && (
            <div className="surface mb-5 rounded-xl p-4">
              <h3 className="label mb-2">{t('book.synopsis')}</h3>
              <p className="text-sm leading-relaxed text-foreground">
                {book.description}
              </p>
            </div>
          )}

          {/* Subjects */}
          {book.subject && book.subject.length > 0 && (
            <div className="mb-5">
              <h3 className="label mb-2 flex items-center gap-1.5">
                <Tag size={11} /> {t('book.subjects')}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {book.subject.slice(0, 12).map((s) => (
                  <span
                    key={s}
                    className="cursor-default rounded-full border border-primary/20 bg-primary/8 px-2.5 py-0.5 text-[11px] text-primary/80 transition-colors hover:bg-primary/15"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes — only when saved */}
          {saved && (
            <div className="mb-5">
              <h3 className="label mb-2">{t('book.notes')}</h3>
              <textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder={t('book.notes.placeholder')}
                rows={3}
                className="field h-auto resize-none py-2.5 text-sm leading-relaxed"
              />
            </div>
          )}

          {/* Citation + Find elsewhere */}
          <div className="space-y-4 border-t border-border pt-4">
            <button
              onClick={() => setShowCitation(true)}
              className="btn-outline gap-2 text-sm"
            >
              <Quote size={15} /> {t('citation.title')}
            </button>

            <div>
              <p className="label mb-2 flex items-center gap-1.5">
                <Search size={11} /> {t('book.findElsewhere')}
              </p>
              <div className="flex flex-wrap gap-2">
                {FIND_ELSEWHERE.map((site) => (
                  <a
                    key={site.name}
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all ${site.color}`}
                  >
                    <Globe size={11} />
                    {site.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
