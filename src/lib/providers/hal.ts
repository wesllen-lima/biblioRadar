import type { Provider } from './base'
import type { BookResult } from '../types'

type HALDoc = {
  title_s?: string[]
  authFullName_s?: string[]
  producedDate_s?: string
  fileMain_s?: string
  uri_s?: string
  abstract_s?: string[]
  language_s?: string[]
  halId_s?: string
}

type HALResponse = {
  response?: {
    numFound: number
    docs: HALDoc[]
  }
}

const FIELDS =
  'title_s,authFullName_s,producedDate_s,fileMain_s,uri_s,abstract_s,language_s,halId_s'

export const hal: Provider = {
  id: 'hal',
  label: 'HAL Open Archive',
  async search(q: string): Promise<BookResult[]> {
    const url =
      `https://api.archives-ouvertes.fr/search/?q=${encodeURIComponent(q)}` +
      `&fq=openAccess_bool:true&rows=20&fl=${FIELDS}&wt=json&sort=score+desc`

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
    const data = (await res.json()) as HALResponse
    const docs: HALDoc[] = data.response?.docs ?? []

    return docs
      .map((d) => {
        const pdfUrl = d.fileMain_s || undefined
        const year = d.producedDate_s
          ? parseInt(d.producedDate_s.slice(0, 4))
          : undefined
        const id = d.halId_s ?? d.uri_s ?? d.title_s?.[0] ?? ''

        return {
          id: `hal:${id}`,
          source: 'hal' as const,
          title: d.title_s?.[0] ?? '',
          authors: d.authFullName_s ?? [],
          year,
          description: d.abstract_s?.[0]?.slice(0, 600) || undefined,
          language: d.language_s?.[0] || undefined,
          pdfUrl,
          readUrl: d.uri_s || undefined,
          format: pdfUrl ? ('pdf' as const) : undefined,
        }
      })
      .filter((r) => r.title)
  },
}
