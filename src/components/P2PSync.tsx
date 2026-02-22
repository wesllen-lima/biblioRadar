'use client'

import { useState } from 'react'
import { Share2, Upload, Copy, Check, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { getAllBooks, putBook } from '@/lib/db'
import type { BookResult } from '@/lib/types'
import { useI18n } from './I18nProvider'

async function compressToBase64(data: string): Promise<string> {
  const blob = new Blob([data])
  const stream = blob.stream().pipeThrough(new CompressionStream('gzip'))
  const buf = await new Response(stream).arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function decompressFromBase64(b64url: string): Promise<string> {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length).map((_, i) =>
    binary.charCodeAt(i)
  )
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream('gzip'))
  return new Response(stream).text()
}

export default function P2PSync() {
  const { t } = useI18n()
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [sizeKb, setSizeKb] = useState(0)
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importLink, setImportLink] = useState('')

  const handleExport = async () => {
    setExporting(true)
    try {
      const books = await getAllBooks()
      if (books.length === 0) {
        toast.error(t('data.library.empty'))
        return
      }

      const json = JSON.stringify(books)
      const compressed = await compressToBase64(json)
      const url = `${window.location.origin}/?sync=${compressed}`
      setSizeKb(Math.round((compressed.length / 1024) * 10) / 10)
      setShareUrl(url)

      if (navigator.share && books.length <= 80) {
        try {
          await navigator.share({ title: t('sync.share.title'), url })
          return
        } catch {
          // user cancelled or not supported — fall through to show the link
        }
      }
    } catch {
      toast.error(t('sync.export.error'))
    } finally {
      setExporting(false)
    }
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success(t('sync.copy.success'))
    setTimeout(() => setCopied(false), 2500)
  }

  const handleImport = async () => {
    const raw = importLink.trim()
    if (!raw) return
    setImporting(true)
    try {
      const match = raw.match(/[?&]sync=([A-Za-z0-9_-]+)/)
      if (!match) throw new Error(t('sync.import.invalid'))
      const json = await decompressFromBase64(match[1])
      const books: BookResult[] = JSON.parse(json)
      let count = 0
      for (const b of books) {
        await putBook({ ...b, savedAt: b.savedAt ?? Date.now() })
        count++
      }
      toast.success(t('sync.imported', { count }))
      setImportLink('')
      setTimeout(() => window.location.reload(), 1200)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('sync.error'))
    } finally {
      setImporting(false)
    }
  }

  const tooLarge = sizeKb > 80

  return (
    <div className="space-y-6">
      {/* Export */}
      <div>
        <p className="mb-1 text-sm font-medium text-foreground">
          {t('sync.share.label')}
        </p>
        <p className="mb-3 text-xs text-muted-foreground">
          {t('sync.share.desc')}
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn-secondary gap-2"
        >
          {exporting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Share2 size={15} />
          )}
          {t('sync.share.btn')}
        </button>

        {shareUrl && (
          <div className="mt-3 space-y-2">
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-3">
              <code className="line-clamp-3 flex-1 text-xs leading-relaxed break-all text-muted-foreground">
                {shareUrl}
              </code>
              <button
                onClick={handleCopy}
                className="btn-ghost btn-sm h-7 w-7 shrink-0 rounded-md p-0"
                aria-label={t('sync.copy')}
              >
                {copied ? (
                  <Check size={14} className="text-success" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {tooLarge && (
                <AlertTriangle size={12} className="text-amber-500" />
              )}
              <span
                className={tooLarge ? 'text-amber-600 dark:text-amber-400' : ''}
              >
                {t('sync.size', { size: sizeKb })}
                {tooLarge && ` ${t('sync.size.large')}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Import */}
      <div className="border-t border-border pt-5">
        <p className="mb-1 text-sm font-medium text-foreground">
          {t('sync.import.label')}
        </p>
        <p className="mb-3 text-xs text-muted-foreground">
          {t('sync.import.desc')}
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={importLink}
            onChange={(e) => setImportLink(e.target.value)}
            placeholder={t('sync.import.placeholder')}
            className="field flex-1 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleImport()}
          />
          <button
            onClick={handleImport}
            disabled={!importLink.trim() || importing}
            className="btn-primary shrink-0 gap-2"
          >
            {importing ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Upload size={15} />
            )}
            {t('sync.import.btn')}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {t('sync.import.merge')}
        </p>
      </div>
    </div>
  )
}
