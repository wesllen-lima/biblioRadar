'use client'

import { useState } from 'react'
import type { BookResult } from '@/lib/types'
import BookCard from '@/components/BookCard'
import { useI18n } from '@/components/I18nProvider'
import { ArrowDown } from 'lucide-react'

export default function ResultsList({
  items,
  pageSize = 8,
}: {
  items: BookResult[]
  pageSize?: number
}) {
  const { t } = useI18n()
  const [page, setPage] = useState(1)

  const visible = items.slice(0, page * pageSize)
  const hasMore = visible.length < items.length

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8 duration-500">
      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
        {visible.map((b) => (
          <div key={b.id} className="h-full">
            <BookCard book={b} />
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            className="btn-ghost h-10 gap-2 px-6 text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground active:scale-95"
            onClick={() => setPage((p) => p + 1)}
            aria-label={t('results.loadMore')}
          >
            <ArrowDown size={16} />
            {t('results.loadMore')}
          </button>
        </div>
      )}
    </div>
  )
}
