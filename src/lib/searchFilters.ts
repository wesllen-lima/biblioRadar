import type { BookResult } from '@/lib/types'
import type { SearchFilters } from '@/components/FilterPanel'

export function applyFilters(
  items: BookResult[],
  filters: SearchFilters
): BookResult[] {
  let result = [...items]

  if (filters.sources.length > 0) {
    result = result.filter((b) => {
      const srcKey = b.source || ''
      return filters.sources.some(
        (s) =>
          srcKey === s || srcKey.includes(s.replace(/^(opds:|scrape:)/, ''))
      )
    })
  }

  if (filters.format !== 'all') {
    result = result.filter((b) => {
      if (filters.format === 'pdf')
        return Boolean(b.pdfUrl) || b.format === 'pdf'
      if (filters.format === 'epub') return b.format === 'epub'
      if (filters.format === 'html') return b.format === 'html'
      return true
    })
  }

  if (filters.yearMin !== null) {
    result = result.filter(
      (b) => b.year === undefined || b.year >= filters.yearMin!
    )
  }
  if (filters.yearMax !== null) {
    result = result.filter(
      (b) => b.year === undefined || b.year <= filters.yearMax!
    )
  }

  return result
}

export function applySort(
  items: BookResult[],
  sort: SearchFilters['sort']
): BookResult[] {
  if (sort === 'relevance') return items
  const copy = [...items]
  if (sort === 'year_desc')
    return copy.sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
  if (sort === 'year_asc')
    return copy.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999))
  if (sort === 'title_az')
    return copy.sort((a, b) => a.title.localeCompare(b.title))
  return copy
}
