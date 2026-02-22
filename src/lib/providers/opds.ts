import { createHash } from 'node:crypto'
import * as cheerio from 'cheerio'
import type { Provider } from './base'
import type { BookResult } from '../types'

const MAX_FEED_BYTES = 5 * 1024 * 1024 // 5 MB

function stableId(feedUrl: string, title: string, linkKey: string): string {
  return createHash('sha256')
    .update(`${feedUrl}\0${title}\0${linkKey}`)
    .digest('hex')
    .slice(0, 16)
}

export function makeOpdsProvider(feedUrl: string): Provider {
  const label = `OPDS: ${feedUrl}`
  return {
    id: `opds:${feedUrl}`,
    label,
    async search(q: string): Promise<BookResult[]> {
      const url = feedUrl.includes('?')
        ? `${feedUrl}&search=${encodeURIComponent(q)}`
        : `${feedUrl}?search=${encodeURIComponent(q)}`

      const res = await fetch(url, { next: { revalidate: 300 } })
      if (!res.ok) return []

      const contentLength = res.headers.get('content-length')
      if (contentLength && Number(contentLength) > MAX_FEED_BYTES) return []

      const xml = await res.text()
      if (xml.length > MAX_FEED_BYTES) return []

      const $ = cheerio.load(xml, { xmlMode: true })
      const items: BookResult[] = []

      $('entry').each((_, entry) => {
        const $e = $(entry)
        const title = $e.find('title').first().text().trim() || 'Sem título'
        const authors = $e
          .find('author > name')
          .map((_, a) => $(a).text().trim())
          .get()
          .filter(Boolean)

        const pdfLink =
          $e.find('link[type="application/pdf"]').attr('href') || undefined
        const cover =
          $e.find('link[rel*="image"]').first().attr('href') || undefined
        const altRead =
          $e.find('link[rel="alternate"]').attr('href') || undefined

        const linkKey = pdfLink || altRead || ''

        items.push({
          id: `opds:${stableId(feedUrl, title, linkKey)}`,
          source: 'opds',
          title,
          authors,
          cover,
          pdfUrl: pdfLink,
          readUrl: altRead || pdfLink,
        })
      })

      return items
    },
  }
}
