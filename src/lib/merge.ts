import type { BookResult } from './types'

const norm = (s: string) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

function richness(r: BookResult): number {
  return (
    (r.pdfUrl ? 8 : 0) +
    (r.epubUrl ? 4 : 0) +
    (r.cover ? 2 : 0) +
    (r.description ? 1 : 0)
  )
}

export function mergeResults(
  results: BookResult[],
  sortByPdf = false
): BookResult[] {
  const map = new Map<string, BookResult>()

  for (const r of results) {
    const key = norm(r.title)
    if (!key) continue
    const existing = map.get(key)
    if (!existing || richness(r) > richness(existing)) {
      map.set(key, r)
    }
  }

  const merged = Array.from(map.values())
  return sortByPdf
    ? merged.sort((a, b) => Number(!!b.pdfUrl) - Number(!!a.pdfUrl))
    : merged
}
