'use client'

import { useState, useEffect, useRef } from 'react'
import type { BookResult } from '@/lib/types'
import BookCard from '@/components/BookCard'
import SkeletonCard from '@/components/SkeletonCard'
import { useI18n } from '@/components/I18nProvider'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 12

function getPages(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

export default function ResultsList({
  items,
  pageSize = PAGE_SIZE,
}: {
  items: BookResult[]
  pageSize?: number
}) {
  const { t } = useI18n()
  const [page, setPage] = useState(1)
  const [fading, setFading] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  // Reset to page 1 when results change (new search)
  useEffect(() => {
    setPage(1)
  }, [items])

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize)

  const goTo = (p: number) => {
    if (p === page || p < 1 || p > totalPages) return
    setFading(true)
    setTimeout(() => {
      setPage(p)
      setFading(false)
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)
  }

  const pages = getPages(page, totalPages)

  return (
    <div className="space-y-6">
      {/* Anchor for scroll-to-top on page change */}
      <div ref={topRef} className="-mt-4" />

      {/* Cards grid */}
      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
        {fading
          ? Array.from({ length: pageItems.length || pageSize }).map((_, i) => (
              <SkeletonCard key={i} />
            ))
          : pageItems.map((b) => (
              <div
                key={b.id}
                className="animate-in fade-in slide-in-from-bottom-2 h-full duration-300"
              >
                <BookCard book={b} />
              </div>
            ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="flex items-center gap-1">
            {/* Prev */}
            <button
              onClick={() => goTo(page - 1)}
              disabled={page === 1}
              className="btn-icon h-8 w-8 disabled:pointer-events-none disabled:opacity-30"
              aria-label={t('library.prev_page')}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page numbers */}
            {pages.map((p, i) =>
              p === '...' ? (
                <span
                  key={`ellipsis-${i}`}
                  className="flex h-8 w-6 items-center justify-center text-xs text-muted-foreground"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => goTo(p as number)}
                  className={`h-8 min-w-8 rounded-lg px-2 text-sm font-medium transition-all ${
                    p === page
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  aria-label={`Página ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              )
            )}

            {/* Next */}
            <button
              onClick={() => goTo(page + 1)}
              disabled={page === totalPages}
              className="btn-icon h-8 w-8 disabled:pointer-events-none disabled:opacity-30"
              aria-label={t('library.next_page')}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Page info */}
          <p className="text-xs text-muted-foreground">
            {t('library.page_of', { page, total: totalPages })}
          </p>
        </div>
      )}
    </div>
  )
}
