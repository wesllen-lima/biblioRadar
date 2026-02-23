import type { Provider } from './base'

type OLDoc = {
  key?: string
  title?: string
  author_name?: string[]
  first_publish_year?: number
  cover_i?: number
  ia?: string[]
  public_scan_b?: boolean
  has_fulltext?: boolean
}

type OLResponse = {
  docs?: OLDoc[]
}

const OL_FIELDS =
  'key,title,author_name,first_publish_year,cover_i,ia,public_scan_b,has_fulltext'

export const openLibrary: Provider = {
  id: 'open_library',
  label: 'Open Library',
  async search(q: string) {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=25&fields=${OL_FIELDS}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = (await res.json()) as OLResponse
    const works: OLDoc[] = data?.docs ?? []

    return works.map((w) => {
      // public_scan_b=true: free public-domain scan, PDF available via Internet Archive
      const iaId = w.public_scan_b && w.ia?.[0] ? w.ia[0] : undefined
      const pdfUrl = iaId
        ? `https://archive.org/download/${iaId}/${iaId}.pdf`
        : undefined

      return {
        id: `ol:${w.key || w.title || ''}`,
        source: 'open_library',
        title: w.title ?? '',
        authors: Array.isArray(w.author_name) ? w.author_name : [],
        year:
          w.first_publish_year !== undefined
            ? Number(w.first_publish_year)
            : undefined,
        cover: w.cover_i
          ? `https://covers.openlibrary.org/b/id/${w.cover_i}-L.jpg`
          : undefined,
        pdfUrl,
        readUrl: w.key ? `https://openlibrary.org${w.key}` : undefined,
      }
    })
  },
}
