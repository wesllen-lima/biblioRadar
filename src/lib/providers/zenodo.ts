import type { Provider } from './base'
import type { BookResult } from '../types'

type ZenodoCreator = { name: string }

type ZenodoFile = {
  key: string
  type?: string
  links: { self: string }
}

type ZenodoHit = {
  id: number
  metadata: {
    title?: string
    creators?: ZenodoCreator[]
    publication_date?: string
    description?: string
    doi?: string
    language?: string
    access_right?: string
  }
  files?: ZenodoFile[]
  links: { html: string }
}

type ZenodoResponse = {
  hits: {
    total: { value: number }
    hits: ZenodoHit[]
  }
}

export const zenodo: Provider = {
  id: 'zenodo',
  label: 'Zenodo',
  async search(q: string): Promise<BookResult[]> {
    const url =
      `https://zenodo.org/api/records?q=${encodeURIComponent(q)}` +
      `&type=publication&size=20&sort=bestmatch`

    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8_000)
    let res: Response
    try {
      res = await fetch(url, { signal: ctrl.signal, next: { revalidate: 3600 } })
    } catch {
      return []
    } finally {
      clearTimeout(timer)
    }

    if (!res.ok) return []
    const data = (await res.json()) as ZenodoResponse
    const hits: ZenodoHit[] = data.hits?.hits ?? []

    return hits.map((h) => {
      const meta = h.metadata
      const year = meta.publication_date
        ? parseInt(meta.publication_date.slice(0, 4))
        : undefined
      const authors = (meta.creators ?? []).map((c) => c.name).filter(Boolean)

      const pdfFile = (h.files ?? []).find(
        (f) => f.type === 'pdf' || f.key?.toLowerCase().endsWith('.pdf')
      )
      const pdfUrl = pdfFile?.links.self

      // Strip HTML tags from description (Zenodo allows HTML in abstracts)
      const rawDesc = meta.description ?? ''
      const description = rawDesc.replace(/<[^>]+>/g, '').trim().slice(0, 600) || undefined

      return {
        id: `zenodo:${h.id}`,
        source: 'zenodo' as const,
        title: meta.title ?? '',
        authors,
        year,
        description,
        pdfUrl,
        readUrl: h.links.html,
        format: pdfUrl ? ('pdf' as const) : undefined,
      }
    })
  },
}
