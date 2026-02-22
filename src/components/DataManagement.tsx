'use client'

import { useState } from 'react'
import {
  Download,
  Upload,
  Trash2,
  FileText,
  FileJson,
  FileCode2,
} from 'lucide-react'
import { toast } from 'sonner'
import ConfirmDialog from './ConfirmDialog'
import { useI18n } from './I18nProvider'
import { getAllBooks, putBook } from '@/lib/db'
import type { BookResult } from '@/lib/types'

function abntAuthor(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].toUpperCase()
  return `${parts[parts.length - 1].toUpperCase()}, ${parts.slice(0, -1).join(' ')}`
}

function makeBibKey(book: BookResult): string {
  const last = (book.authors[0] || 'unknown').split(' ').pop() || 'unknown'
  return `${last}${book.year ?? 'nd'}${book.title.replace(/[^a-z0-9]/gi, '').slice(0, 6)}`.toLowerCase()
}

function bookToBibtex(book: BookResult): string {
  const url = book.readUrl || book.pdfUrl || ''
  return `@misc{${makeBibKey(book)},\n  author = {${book.authors.join(' and ')}},\n  title = {{${book.title}}},\n  year = {${book.year ?? 's.d.'}},\n  url = {${url}}\n}`
}

function bookToAbnt(book: BookResult): string {
  const today = new Date().toLocaleDateString('pt-BR')
  const author = book.authors.length
    ? abntAuthor(book.authors[0])
    : 'AUTOR DESCONHECIDO'
  const url = book.readUrl || book.pdfUrl || ''
  return `${author}. ${book.title}. ${book.year ?? 's.d.'}. Disponível em: <${url}>. Acesso em: ${today}.`
}

function bookToMarkdown(book: BookResult): string {
  const lines = [
    '---',
    `title: "${book.title.replace(/"/g, '\\"')}"`,
    `authors: [${book.authors.map((a) => `"${a}"`).join(', ')}]`,
    book.year ? `year: ${book.year}` : '',
    book.isbn ? `isbn: "${book.isbn}"` : '',
    book.language ? `language: "${book.language}"` : '',
    book.readUrl
      ? `url: "${book.readUrl}"`
      : book.pdfUrl
        ? `url: "${book.pdfUrl}"`
        : '',
    book.source ? `source: "${book.source}"` : '',
    book.tags?.length
      ? `tags: [${book.tags.map((t) => `"${t}"`).join(', ')}]`
      : '',
    book.readingStatus ? `status: "${book.readingStatus}"` : '',
    '---',
    '',
    book.description ? `## Sinopse\n\n${book.description}` : '',
  ]
  return lines.filter(Boolean).join('\n')
}

function bookToZoteroRdf(books: BookResult[]): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  const items = books.map((b) => {
    const url = b.readUrl || b.pdfUrl || ''
    const authors = b.authors
      .map((a) => {
        const parts = a.trim().split(/\s+/)
        const first = parts.slice(0, -1).join(' ')
        const last = parts[parts.length - 1]
        return `<foaf:Person><foaf:surname>${esc(last)}</foaf:surname><foaf:givenname>${esc(first)}</foaf:givenname></foaf:Person>`
      })
      .join('\n      ')
    return `  <bib:Book${url ? ` rdf:about="${esc(url)}"` : ''}>
    <z:itemType>book</z:itemType>
    <dc:title>${esc(b.title)}</dc:title>
    ${b.year ? `<dc:date>${b.year}</dc:date>` : ''}
    ${b.isbn ? `<dc:identifier>ISBN:${esc(b.isbn)}</dc:identifier>` : ''}
    ${b.description ? `<dcterms:abstract>${esc(b.description)}</dcterms:abstract>` : ''}
    ${b.language ? `<z:language>${esc(b.language)}</z:language>` : ''}
    <bib:authors>
      <rdf:Seq>
        ${b.authors.map(() => `<rdf:li>`).join('')}
        ${authors}
        ${b.authors.map(() => `</rdf:li>`).join('')}
      </rdf:Seq>
    </bib:authors>
  </bib:Book>`
  })
  return `<?xml version="1.0" encoding="utf-8"?>
<rdf:RDF
  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:z="http://www.zotero.org/namespaces/export#"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:foaf="http://xmlns.com/foaf/0.1/"
  xmlns:bib="http://purl.org/net/biblio#"
  xmlns:dcterms="http://purl.org/dc/terms/">
${items.join('\n')}
</rdf:RDF>`
}

function bookToJsonLd(book: BookResult): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    author: book.authors.map((a) => ({ '@type': 'Person', name: a })),
    ...(book.year && { datePublished: String(book.year) }),
    ...(book.isbn && { isbn: book.isbn }),
    ...(book.language && { inLanguage: book.language }),
    ...(book.description && { description: book.description }),
    ...(book.cover && { image: book.cover }),
    url: book.readUrl || book.pdfUrl,
  }
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function DataManagement() {
  const { t } = useI18n()
  const [importing, setImporting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  /* ── Backup / Restore ── */
  const handleExport = async () => {
    const books = await getAllBooks()
    const data = {
      library: books,
      providers: localStorage.getItem('biblio_custom_providers'),
      sites: localStorage.getItem('biblio_external_sites'),
      settings: localStorage.getItem('biblio_settings'),
      theme: localStorage.getItem('theme'),
      timestamp: new Date().toISOString(),
      version: 3,
    }
    downloadBlob(
      JSON.stringify(data, null, 2),
      `biblioradar-backup-${new Date().toISOString().split('T')[0]}.json`,
      'application/json'
    )
    toast.success(t('data.backup.success'))
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        if (!json.version) throw new Error(t('data.import.invalid'))
        // Books
        const books: BookResult[] =
          json.version >= 3 ? json.library : JSON.parse(json.library ?? '[]')
        for (const book of books)
          await putBook({ ...book, savedAt: book.savedAt ?? Date.now() })
        if (json.providers)
          localStorage.setItem('biblio_custom_providers', json.providers)
        if (json.sites)
          localStorage.setItem('biblio_external_sites', json.sites)
        if (json.settings)
          localStorage.setItem('biblio_settings', json.settings)
        if (json.theme) {
          localStorage.setItem('theme', json.theme)
          document.documentElement.setAttribute('data-theme', json.theme)
        }
        toast.success(t('data.restore.success'))
        setTimeout(() => window.location.reload(), 1500)
      } catch {
        toast.error(t('data.restore.error'))
      } finally {
        setImporting(false)
      }
    }
    reader.readAsText(file)
  }

  const handleClear = async () => {
    const books = await getAllBooks()
    const { deleteBook } = await import('@/lib/db')
    for (const b of books) await deleteBook(b.id)
    localStorage.clear()
    window.location.reload()
  }

  /* ── Exports de biblioteca ── */
  const exportBib = async () => {
    const books = await getAllBooks()
    if (books.length === 0) {
      toast.error(t('data.library.empty'))
      return
    }
    downloadBlob(
      books.map(bookToBibtex).join('\n\n'),
      `biblioradar-library-${new Date().toISOString().split('T')[0]}.bib`,
      'text/plain'
    )
    toast.success(t('data.export.bib.success', { count: books.length }))
  }

  const exportMarkdown = async () => {
    const books = await getAllBooks()
    if (books.length === 0) {
      toast.error(t('data.library.empty'))
      return
    }
    downloadBlob(
      books.map(bookToMarkdown).join('\n\n---\n\n'),
      `biblioradar-library-${new Date().toISOString().split('T')[0]}.md`,
      'text/markdown'
    )
    toast.success(t('data.export.md.success', { count: books.length }))
  }

  const exportCsv = async () => {
    const books = await getAllBooks()
    if (books.length === 0) {
      toast.error(t('data.library.empty'))
      return
    }
    const header = 'Título,Autores,Ano,Idioma,Fonte,URL,Tags,Status\n'
    const rows = books
      .map((b) =>
        [
          b.title,
          b.authors.join('; '),
          b.year ?? '',
          b.language ?? '',
          b.source ?? '',
          b.readUrl || b.pdfUrl || '',
          (b.tags ?? []).join('; '),
          b.readingStatus ?? 'unread',
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n')
    downloadBlob(
      header + rows,
      `biblioradar-library-${new Date().toISOString().split('T')[0]}.csv`,
      'text/csv'
    )
    toast.success(t('data.export.csv.success', { count: books.length }))
  }

  const exportJsonLd = async () => {
    const books = await getAllBooks()
    if (books.length === 0) {
      toast.error(t('data.library.empty'))
      return
    }
    const jsonld = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: books.map(bookToJsonLd),
    }
    downloadBlob(
      JSON.stringify(jsonld, null, 2),
      `biblioradar-library-${new Date().toISOString().split('T')[0]}.jsonld`,
      'application/ld+json'
    )
    toast.success(t('data.export.jsonld.success', { count: books.length }))
  }

  const exportZotero = async () => {
    const books = await getAllBooks()
    if (books.length === 0) {
      toast.error(t('data.library.empty'))
      return
    }
    downloadBlob(
      bookToZoteroRdf(books),
      `biblioradar-library-${new Date().toISOString().split('T')[0]}.rdf`,
      'application/rdf+xml'
    )
    toast.success(t('data.export.zotero.success', { count: books.length }))
  }

  const copyAbnt = async () => {
    const books = await getAllBooks()
    if (books.length === 0) {
      toast.error(t('data.library.empty'))
      return
    }
    await navigator.clipboard.writeText(books.map(bookToAbnt).join('\n\n'))
    toast.success(t('data.export.abnt.success', { count: books.length }))
  }

  return (
    <>
      {/* Backup / Restore / Reset */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <button
          onClick={handleExport}
          className="group flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-primary/30 hover:bg-muted/50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-700 transition-transform group-hover:scale-110 dark:text-blue-400">
            <Download size={20} />
          </div>
          <div>
            <span className="block font-medium text-foreground">
              {t('data.backup')}
            </span>
            <span className="text-xs text-muted-foreground">
              {t('data.backup.desc')}
            </span>
          </div>
        </button>

        <label className="group relative flex h-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-primary/30 hover:bg-muted/50">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={importing}
          />
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 transition-transform group-hover:scale-110 dark:text-emerald-400">
            {importing ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent dark:border-emerald-400" />
            ) : (
              <Upload size={20} />
            )}
          </div>
          <div>
            <span className="block font-medium text-foreground">
              {t('data.restore')}
            </span>
            <span className="text-xs text-muted-foreground">
              {t('data.restore.desc')}
            </span>
          </div>
        </label>

        <button
          onClick={() => setConfirmOpen(true)}
          className="group flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-destructive/30 hover:bg-destructive/5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-700 transition-transform group-hover:scale-110 dark:text-red-400">
            <Trash2 size={20} />
          </div>
          <div>
            <span className="block font-medium text-foreground">
              {t('data.reset')}
            </span>
            <span className="text-xs text-muted-foreground">
              {t('data.reset.desc')}
            </span>
          </div>
        </button>
      </div>

      {/* Exports de biblioteca */}
      <div className="border-t border-border pt-4">
        <p className="mb-3 text-xs font-bold tracking-wider text-muted-foreground uppercase">
          {t('data.export.title')}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportBib}
            className="btn-outline h-8 gap-2 px-3 text-xs"
          >
            <FileText size={13} /> BibTeX (.bib)
          </button>
          <button
            onClick={exportMarkdown}
            className="btn-outline h-8 gap-2 px-3 text-xs"
          >
            <FileCode2 size={13} /> Markdown
          </button>
          <button
            onClick={exportCsv}
            className="btn-outline h-8 gap-2 px-3 text-xs"
          >
            <FileText size={13} /> CSV
          </button>
          <button
            onClick={exportJsonLd}
            className="btn-outline h-8 gap-2 px-3 text-xs"
          >
            <FileJson size={13} /> JSON-LD
          </button>
          <button
            onClick={copyAbnt}
            className="btn-outline h-8 gap-2 px-3 text-xs"
          >
            <FileText size={13} /> {t('data.copyAbnt')}
          </button>
          <button
            onClick={exportZotero}
            className="btn-outline h-8 gap-2 px-3 text-xs"
          >
            <FileCode2 size={13} /> Zotero (.rdf)
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={t('data.reset.confirm.title')}
        description={t('data.reset.confirm.desc')}
        confirmLabel={t('data.reset.confirm.action')}
        onConfirm={handleClear}
        onCancel={() => setConfirmOpen(false)}
        variant="destructive"
      />
    </>
  )
}
