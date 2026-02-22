'use client'

import { useState, useEffect, useRef } from 'react'
import type { BookResult } from '@/lib/types'
import { useI18n } from './I18nProvider'
import { useFocusTrap } from '@/lib/useFocusTrap'
import { Copy, Check, X, Quote, Download } from 'lucide-react'

function formatAbntAuthor(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].toUpperCase()
  const last = parts[parts.length - 1].toUpperCase()
  const rest = parts.slice(0, -1).join(' ')
  return `${last}, ${rest}`
}

function buildBibKey(book: BookResult): string {
  const author = (book.authors[0] || 'unknown').split(' ').pop() || 'unknown'
  const year = book.year || 'nd'
  const title = book.title.replace(/[^a-z0-9]/gi, '').slice(0, 6)
  return `${author}${year}${title}`.replace(/[^a-z0-9]/gi, '').toLowerCase()
}

export default function CitationModal({
  book,
  onClose,
}: {
  book: BookResult
  onClose: () => void
}) {
  const { t } = useI18n()
  const [copied, setCopied] = useState('')
  const closeRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  useFocusTrap(modalRef)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
  const today = new Date().toLocaleDateString('pt-BR')
  const todayIso = new Date().toISOString().split('T')[0]

  const rawAuthor = book.authors[0] || 'Unknown Author'
  const abntAuthor = formatAbntAuthor(rawAuthor)
  const lastNameFirst = (() => {
    const parts = rawAuthor.trim().split(/\s+/)
    if (parts.length === 1) return parts[0]
    return `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`
  })()

  const title = book.title
  const year = book.year || 's.d.'
  const yearNum = book.year || new Date().getFullYear()
  const url = book.readUrl || book.pdfUrl || currentUrl
  const bibKey = buildBibKey(book)

  const bibtexText = `@misc{${bibKey},\n  author = {${rawAuthor}},\n  title = {{${title}}},\n  year = {${year}},\n  url = {${url}},\n  urldate = {${todayIso}}\n}`

  const formats = [
    {
      id: 'abnt',
      label: 'ABNT (Brasil)',
      text: `${abntAuthor}. ${title}. ${year}. Disponível em: <${url}>. Acesso em: ${today}.`,
    },
    {
      id: 'apa',
      label: 'APA (Internacional)',
      text: `${lastNameFirst} (${year}). ${title}. Retrieved from ${url}`,
    },
    {
      id: 'mla',
      label: 'MLA (8ª ed.)',
      text: `${lastNameFirst}. "${title}." ${yearNum}, ${url}. Accessed ${today}.`,
    },
    {
      id: 'vancouver',
      label: 'Vancouver (Medicina)',
      text: `${abntAuthor}. ${title} [Internet]. ${year} [citado em ${today}]. Disponível em: ${url}`,
    },
    {
      id: 'chicago',
      label: 'Chicago (Autor-Data)',
      text: `${lastNameFirst}. ${year}. "${title}." Accessed ${today}. ${url}.`,
    },
    {
      id: 'bibtex',
      label: 'BibTeX (LaTeX)',
      text: bibtexText,
    },
  ]

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(''), 2000)
    } catch {
      // ignore
    }
  }

  const downloadBib = () => {
    const blob = new Blob([bibtexText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${bibKey}.bib`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="citation-title"
    >
      <div
        ref={modalRef}
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border border-border bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Quote size={16} />
            </div>
            <h3
              id="citation-title"
              className="text-lg font-bold tracking-tight text-foreground"
            >
              {t('citation.title')}
            </h3>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t('action.close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Formats list — scrollable */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6">
          {formats.map((f) => (
            <div key={f.id} className="group">
              <div className="mb-1.5 flex items-center justify-between px-1">
                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {f.label}
                </span>
                {copied === f.id && (
                  <span className="flex animate-pulse items-center gap-1 text-xs font-medium text-emerald-600">
                    <Check size={12} /> {t('citation.copied')}
                  </span>
                )}
              </div>
              <button
                className={`relative w-full rounded-lg border p-3.5 text-left font-mono text-xs leading-relaxed break-words whitespace-pre-wrap transition-all duration-200 ${
                  copied === f.id
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100'
                    : 'border-border bg-muted/30 text-foreground hover:border-primary/40 hover:bg-background hover:shadow-sm'
                }`}
                onClick={() => copy(f.text, f.id)}
                title={t('citation.copy')}
              >
                {f.text}
                <div className="absolute top-3 right-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  {copied === f.id ? <Check size={14} /> : <Copy size={14} />}
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-border p-6 pt-4">
          <button
            onClick={downloadBib}
            className="btn-outline gap-2 text-xs"
            title="Baixar arquivo .bib para LaTeX / Zotero"
          >
            <Download size={14} /> Baixar .bib
          </button>
          <button onClick={onClose} className="btn-ghost btn-sm">
            {t('action.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
