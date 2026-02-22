import type { BookResult } from './types'

const norm = (s: string) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

export function mergeResults(
  results: BookResult[],
  sortByPdf = false
): BookResult[] {
  const map = new Map<string, BookResult>()

  for (const r of results) {
    const key = `${norm(r.title)}::${norm(r.authors[0] ?? '')}`
    const existing = map.get(key)

    if (!existing) {
      map.set(key, r)
    } else {
      const preferred =
        existing.pdfUrl && !r.pdfUrl
          ? existing
          : r.pdfUrl && !existing.pdfUrl
            ? r
            : existing
      map.set(key, preferred)
    }
  }

  const merged = Array.from(map.values())
  return sortByPdf
    ? merged.sort((a, b) => Number(!!b.pdfUrl) - Number(!!a.pdfUrl))
    : merged
}
