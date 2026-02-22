export type SourceId =
  | 'gutenberg'
  | 'internet_archive'
  | 'open_library'
  | 'arxiv'
  | 'zenodo'
  | 'hal'
  | 'europe_pmc'
  | 'opds'
  | 'scrape'
  | 'user'

export type BookResult = {
  id: string
  source: SourceId
  title: string
  authors: string[]
  year?: number
  cover?: string
  pdfUrl?: string
  epubUrl?: string
  readUrl?: string
  description?: string
  language?: string
  format?: 'pdf' | 'epub' | 'html' | 'text' | 'unknown'
  subject?: string[]
  isbn?: string
  savedAt?: number // timestamp ms quando salvo na biblioteca
  tags?: string[] // coleções/tags do usuário
  readingStatus?: 'unread' | 'reading' | 'done'
  notes?: string
}
