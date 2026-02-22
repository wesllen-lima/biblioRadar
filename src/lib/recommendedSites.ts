export type RecommendedSite = {
  name: string
  url: string
  category: 'academic' | 'books' | 'legal' | 'science'
  desc?: string
}

/** Sites that open in a new tab (no API / anti-scraping). */
export const RECOMMENDED_SITES: RecommendedSite[] = [
  {
    name: 'Google Scholar',
    url: 'https://scholar.google.com/scholar?q={query}',
    category: 'academic',
  },
  {
    name: 'SciELO',
    url: 'https://search.scielo.org/?q={query}&lang=pt',
    category: 'academic',
  },
  {
    name: 'BDTD (Teses Brasil)',
    url: 'https://bdtd.ibict.br/vufind/Search/Results?lookfor={query}&type=AllFields',
    category: 'academic',
  },
  {
    name: 'PubMed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/?term={query}',
    category: 'science',
  },
  {
    name: 'Semantic Scholar',
    url: 'https://www.semanticscholar.org/search?q={query}&sort=Relevance',
    category: 'science',
  },
  {
    name: "Anna's Archive",
    url: 'https://annas-archive.org/search?q={query}',
    category: 'books',
  },
  {
    name: 'Jusbrasil (Leis)',
    url: 'https://www.jusbrasil.com.br/busca?q={query}',
    category: 'legal',
  },
]

/** OPDS feeds that can be added to render results INSIDE BiblioRadar. */
export const OPDS_SUGGESTIONS = [
  {
    name: 'Standard Ebooks',
    url: 'https://standardebooks.org/opds',
    desc: 'Clássicos de domínio público com formatação de alta qualidade',
  },
  {
    name: 'ManyBooks',
    url: 'https://manybooks.net/opds-catalog/root.xml',
    desc: 'Mais de 50.000 ebooks gratuitos em vários formatos',
  },
  {
    name: 'FeedBooks — Domínio Público',
    url: 'https://catalog.feedbooks.com/publicdomain/catalog.atom',
    desc: 'Livros de domínio público em francês e inglês',
  },
]
