'use client'

import { useRef, useState } from 'react'
import type { BookResult } from '@/lib/types'
import CoverImage from '@/components/CoverImage'
import { useLibrary } from '@/lib/useLibrary'
import { useI18n } from '@/components/I18nProvider'
import BookDetailModal from '@/components/BookDetailModal'
import { toast } from 'sonner'
import {
  Heart,
  Trash2,
  X,
  CheckSquare,
  BookMarked,
  CheckCircle2,
} from 'lucide-react'

interface GridCardProps {
  book: BookResult
  bulkMode: boolean
  selected: boolean
  onToggleSelect: () => void
}

export default function GridCard({
  book,
  bulkMode,
  selected,
  onToggleSelect,
}: GridCardProps) {
  const { t } = useI18n()
  const { isSaved, toggleBook } = useLibrary()
  const [showDetail, setShowDetail] = useState(false)
  const [swipeRevealed, setSwipeRevealed] = useState(false)
  const saved = isSaved(book.id)
  const touchStartX = useRef(0)

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleBook(book)
    toast.success(saved ? t('library.removed') : t('library.saved'), {
      icon: saved ? '🗑️' : '❤️',
    })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -60) setSwipeRevealed(true)
    else if (dx > 30) setSwipeRevealed(false)
  }

  return (
    <>
      <div
        className="relative overflow-hidden rounded-xl"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {swipeRevealed && (
          <div className="scale-in absolute inset-0 z-20 flex items-center justify-end gap-2 bg-destructive/90 px-3 backdrop-blur-sm">
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleBook(book)
                toast.success(t('library.removed'), {
                  icon: '🗑️',
                  action: {
                    label: t('action.undo'),
                    onClick: () => toggleBook(book),
                  },
                  duration: 4000,
                })
                setSwipeRevealed(false)
              }}
              className="flex flex-col items-center gap-1 text-white"
              aria-label={t('common.remove')}
            >
              <Trash2 size={22} />
              <span className="text-[10px] font-medium">
                {t('common.remove')}
              </span>
            </button>
            <button
              onClick={() => setSwipeRevealed(false)}
              className="absolute top-2 right-2 text-white/70"
              aria-label={t('action.close')}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div
          className={`group relative cursor-pointer overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:-translate-y-1 ${
            selected
              ? 'border-primary/40 ring-2 ring-primary'
              : 'border-border hover:border-primary/30'
          }`}
          style={{ boxShadow: 'var(--shadow-card)' }}
          onClick={() => {
            if (swipeRevealed) {
              setSwipeRevealed(false)
              return
            }
            bulkMode ? onToggleSelect() : setShowDetail(true)
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === 'Enter' &&
            (bulkMode ? onToggleSelect() : setShowDetail(true))
          }
          aria-label={book.title}
        >
          {bulkMode && (
            <div
              className={`scale-in absolute top-2 left-2 z-10 flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                selected
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-card/80 backdrop-blur-sm'
              }`}
            >
              {selected && <CheckSquare size={12} />}
            </div>
          )}

          <div
            className="relative overflow-hidden"
            style={{ aspectRatio: '2/3' }}
          >
            <CoverImage
              src={book.cover}
              title={book.title}
              imgClassName="object-cover"
              hoverClassName="transition-transform duration-500 group-hover:scale-105"
              fallbackSize="md"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {!bulkMode && (
              <button
                onClick={handleSave}
                className={`heart-btn absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full shadow-md backdrop-blur-sm transition-all ${
                  saved
                    ? 'bg-red-500 text-white'
                    : 'bg-black/30 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-red-500'
                }`}
                aria-label={saved ? t('common.remove') : t('library.saved')}
              >
                <Heart
                  size={12}
                  fill={saved ? 'currentColor' : 'none'}
                  strokeWidth={saved ? 0 : 2}
                />
              </button>
            )}

            {book.readingStatus && book.readingStatus !== 'unread' && (
              <div
                className={`absolute bottom-2 left-2 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold backdrop-blur-sm ${
                  book.readingStatus === 'reading'
                    ? 'bg-amber-500/80 text-white'
                    : 'bg-emerald-500/80 text-white'
                }`}
              >
                {book.readingStatus === 'reading' ? (
                  <BookMarked size={9} />
                ) : (
                  <CheckCircle2 size={9} />
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-0.5 p-2.5">
            <h3 className="line-clamp-2 text-xs leading-snug font-semibold text-foreground transition-colors group-hover:text-primary">
              {book.title}
            </h3>
            <p className="line-clamp-1 text-[10px] text-muted-foreground">
              {book.authors?.join(', ') || '—'}
            </p>
          </div>
        </div>
      </div>

      {showDetail && (
        <BookDetailModal book={book} onClose={() => setShowDetail(false)} />
      )}
    </>
  )
}
