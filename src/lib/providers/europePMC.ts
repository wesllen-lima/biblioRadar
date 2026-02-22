import type { Provider } from './base'
import type { BookResult } from '../types'

type FullTextUrl = {
  documentStyle: string
  url: string
  availability?: string
}

type PMCResult = {
  id?: string
  pmcid?: string
  doi?: string
  title?: string
  authorString?: string
  pubYear?: string
  abstractText?: string
  isOpenAccess?: string
  fullTextUrlList?: {
    fullTextUrl?: FullTextUrl[]
  }
}

type PMCResponse = {
  hitCount?: number
  resultList?: {
    result?: PMCResult[]
  }
}

export const europePMC: Provider = {
  id: 'europe_pmc',
  label: 'Europe PMC',
  async search(q: string): Promise<BookResult[]> {
    // OPEN_ACCESS:Y ensures only freely available papers are returned
    const query = `${q} OPEN_ACCESS:Y`
    const url =
      `https://www.ebi.ac.uk/europepmc/webservices/rest/search` +
      `?query=${encodeURIComponent(query)}&format=json&pageSize=20&resultType=core`

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
    const data = (await res.json()) as PMCResponse
    const results: PMCResult[] = data.resultList?.result ?? []

    return results
      .map((r) => {
        const pmcid = r.pmcid
        const pdfEntry = r.fullTextUrlList?.fullTextUrl?.find(
          (u) => u.documentStyle === 'pdf'
        )
        const pdfUrl = pdfEntry?.url || undefined

        const authors = r.authorString
          ? r.authorString
              .split(',')
              .map((a) => a.trim())
              .filter(Boolean)
          : []

        const year = r.pubYear ? parseInt(r.pubYear) : undefined
        const id = pmcid ?? r.doi ?? r.id ?? ''

        return {
          id: `epmc:${id}`,
          source: 'europe_pmc' as const,
          title: r.title ?? '',
          authors,
          year,
          description: r.abstractText?.slice(0, 600) || undefined,
          pdfUrl,
          readUrl: pmcid
            ? `https://europepmc.org/article/PMC/${pmcid.replace(/^PMC/, '')}`
            : undefined,
          format: pdfUrl ? ('pdf' as const) : undefined,
        }
      })
      .filter((r) => r.title)
  },
}
