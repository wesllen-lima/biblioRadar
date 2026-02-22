import type { Provider } from './base'

type IADoc = {
  identifier: string
  title?: string
  creator?: string | string[]
  year?: string | number
  mediatype?: string
}

type IAResponse = {
  response?: {
    docs?: IADoc[]
  }
}

/**
 * Attempt to resolve the best PDF URL for an IA item without an extra API call.
 * IA items follow predictable patterns:
 *  1. {id}.pdf           — direct PDF upload
 *  2. {id}_text.pdf      — text/OCR layer derived from a scanned book (most common for books)
 *  3. {id}_djvu.pdf      — DjVu-derived PDF
 *
 * We check the item's file list endpoint (lightweight JSON) and pick the first
 * Text PDF or regular PDF we find. Results are cached by Next.js revalidation.
 */
async function resolvePdfUrl(id: string): Promise<string | undefined> {
  const guesses = [
    `https://archive.org/download/${id}/${id}.pdf`,
    `https://archive.org/download/${id}/${id}_text.pdf`,
    `https://archive.org/download/${id}/${id}_djvu.pdf`,
  ]

  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 4_000)
    const res = await fetch(
      `https://archive.org/metadata/${id}/files`,
      { signal: ctrl.signal, next: { revalidate: 86_400 } } // cache 24h
    )
    clearTimeout(timer)

    if (!res.ok) return guesses[0]

    type IAFile = { name: string; format?: string }
    const data = (await res.json()) as { result?: IAFile[] }
    const files: IAFile[] = data.result ?? []

    const ENCRYPTED_FORMATS = new Set([
      'ACS Encrypted PDF',
      'LCP Encrypted PDF',
    ])
    const isFreePdf = (f: IAFile) =>
      !ENCRYPTED_FORMATS.has(f.format ?? '') &&
      !f.name.includes('_encrypted') &&
      !f.name.endsWith('.lcpdf')

    // Prefer "Text PDF" (searchable OCR), then any non-encrypted PDF
    const textPdf = files.find((f) => f.format === 'Text PDF' && isFreePdf(f))
    if (textPdf) return `https://archive.org/download/${id}/${textPdf.name}`

    const anyPdf = files.find(
      (f) => (f.name.endsWith('.pdf') || f.format === 'PDF') && isFreePdf(f)
    )
    if (anyPdf) return `https://archive.org/download/${id}/${anyPdf.name}`

    return undefined // no free PDF available
  } catch {
    return guesses[0] // fallback to guessed URL on timeout/error
  }
}

export const internetArchive: Provider = {
  id: 'internet_archive',
  label: 'Internet Archive',
  async search(q: string) {
    const fields = ['identifier', 'title', 'creator', 'year', 'mediatype'].join(
      ','
    )
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
      `${q} AND mediatype:texts`
    )}&fl[]=${fields}&rows=25&page=1&output=json`

    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8_000)
    let res: Response
    try {
      res = await fetch(url, {
        signal: ctrl.signal,
        next: { revalidate: 3600 },
      })
    } catch {
      return []
    } finally {
      clearTimeout(timer)
    }
    if (!res.ok) return []
    const data = (await res.json()) as IAResponse
    const docs: IADoc[] = data.response?.docs ?? []

    // Resolve PDF URLs in parallel (each result hits the metadata endpoint)
    const results = await Promise.all(
      docs.map(async (d) => {
        const id = d.identifier
        const creators = d.creator
        const authors = Array.isArray(creators)
          ? creators
          : creators
            ? [creators]
            : []
        const pdfUrl = await resolvePdfUrl(id)
        return {
          id: `ia:${id}`,
          source: 'internet_archive' as const,
          title: d.title ?? '',
          authors,
          year: d.year !== undefined ? Number(d.year) : undefined,
          cover: `https://archive.org/services/img/${id}`,
          pdfUrl,
          readUrl: `https://archive.org/details/${id}`,
        }
      })
    )

    return results
  },
}
