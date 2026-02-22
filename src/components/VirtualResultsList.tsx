'use client'

import { VirtuosoGrid } from 'react-virtuoso'
import type { BookResult } from '@/lib/types'
import BookCard from '@/components/BookCard'

export default function VirtualResultsList({ items }: { items: BookResult[] }) {
  return (
    <VirtuosoGrid
      data={items}
      useWindowScroll
      overscan={400}
      listClassName="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch"
      itemClassName="h-full"
      itemContent={(_, item) => <BookCard book={item} />}
    />
  )
}
