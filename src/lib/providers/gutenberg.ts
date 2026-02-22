import type { Provider } from './base'
import type { BookResult } from '../types'

type GutendexAuthor = {
  name: string
  birth_year?: number | null
  death_year?: number | null
}

type GutendexBook = {
  id: number
  title: string
  authors: GutendexAuthor[]
  formats: Record<string, string>
  languages?: string[]
  download_count?: number
}

type GutendexResponse = {
  count: number
  next: string | null
  previous: string | null
  results: GutendexBook[]
}

const uniq = <T>(a: T[]) => Array.from(new Set(a))

export const gutenberg: Provider = {
  id: 'gutenberg',
  label: 'Project Gutenberg',
  async search(q: string): Promise<BookResult[]> {
    const url = `https://gutendex.com/books?search=${encodeURIComponent(q)}&languages=en,pt,es,fr,it,de`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = (await res.json()) as GutendexResponse

    return data.results.map((b) => {
      const fmts = b.formats || {}
      // Gutenberg does not offer PDFs via API — application/octet-stream is a ZIP (HTML book)
      const pdf = fmts['application/pdf'] || undefined
      const epub = fmts['application/epub+zip'] || undefined
      const cover = fmts['image/jpeg'] ?? undefined
      return {
        id: `gutenberg:${b.id}`,
        source: 'gutenberg',
        title: b.title,
        authors: uniq((b.authors || []).map((a) => a.name).filter(Boolean)),
        cover,
        pdfUrl: pdf,
        epubUrl: epub,
        readUrl: `https://www.gutenberg.org/ebooks/${b.id}`,
      }
    })
  },
}
