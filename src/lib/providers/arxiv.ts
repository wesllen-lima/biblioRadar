import type { Provider } from './base'
import type { BookResult } from '../types'

function getText(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : ''
}

// Modern arXiv IDs: YYMM.NNNNN or legacy subject/YYYYNNNN
const ARXIV_ID_RE = /^\d{4}\.\d{4,5}$|^[a-z-]+(\.[A-Z]{2})?\/\d{7}$/

function parseEntry(entry: string): BookResult | null {
  const rawId = getText(entry, 'id')
  const arxivId = rawId
    .replace(/^https?:\/\/arxiv\.org\/abs\//, '')
    .replace(/v\d+$/, '')
  if (!arxivId || !ARXIV_ID_RE.test(arxivId)) return null

  const title = getText(entry, 'title').replace(/\s+/g, ' ')
  if (!title) return null

  const authors: string[] = []
  const authorRe =
    /<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/gi
  let m: RegExpExecArray | null
  while ((m = authorRe.exec(entry)) !== null) authors.push(m[1].trim())

  const published = getText(entry, 'published')
  const year = published ? parseInt(published.slice(0, 4)) : undefined

  const summary = getText(entry, 'summary').replace(/\s+/g, ' ')

  const pdfLinkMatch =
    entry.match(
      /href="(https?:\/\/arxiv\.org\/pdf\/[^"]+)"[^>]*title="pdf"/i
    ) ??
    entry.match(/title="pdf"[^>]*href="(https?:\/\/arxiv\.org\/pdf\/[^"]+)"/i)
  // Ensure the URL ends with .pdf — arXiv redirects bare IDs to .pdf but it's slower
  const rawPdf = pdfLinkMatch
    ? pdfLinkMatch[1]
    : `https://arxiv.org/pdf/${arxivId}`
  const pdfUrl = rawPdf.endsWith('.pdf') ? rawPdf : `${rawPdf}.pdf`

  const categoryMatch = entry.match(/<category[^>]*term="([^"]+)"/i)
  const category = categoryMatch ? categoryMatch[1] : undefined

  return {
    id: `arxiv:${arxivId}`,
    source: 'arxiv',
    title,
    authors,
    year,
    description: summary || undefined,
    pdfUrl,
    readUrl: `https://arxiv.org/abs/${arxivId}`,
    format: 'pdf',
    subject: category ? [category] : undefined,
  }
}

export const arxiv: Provider = {
  id: 'arxiv',
  label: 'arXiv',
  async search(q: string): Promise<BookResult[]> {
    // max_results=12 keeps Atom XML under ~1.5MB (full abstracts make each entry ~120KB)
    // cache:'no-store' avoids the Next.js data cache which has a 2MB per-entry limit;
    // the /api/search route already sends s-maxage=3600 for HTTP-level caching.
    const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(q)}&start=0&max_results=12&sortBy=relevance`

    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8_000)
    let res: Response
    try {
      res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' })
    } catch {
      return []
    } finally {
      clearTimeout(timer)
    }

    if (!res.ok) return []
    const xml = await res.text()

    const results: BookResult[] = []
    const entryRe = /<entry>([\s\S]*?)<\/entry>/gi
    let m: RegExpExecArray | null
    while ((m = entryRe.exec(xml)) !== null) {
      const parsed = parseEntry(m[1])
      if (parsed) results.push(parsed)
    }

    return results
  },
}
