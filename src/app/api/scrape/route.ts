export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import * as cheerio from 'cheerio'
import { z } from 'zod'
import { isSafeUrl } from '@/lib/security'

const MAX_HTML_BYTES = 5 * 1024 * 1024 // 5 MB

// Definição de tipo para evitar "any"
interface ScrapeResult {
  id: string
  source: string
  title: string
  authors: string[]
  cover?: string
  pdfUrl?: string
  readUrl: string
  year?: string
}

const schema = z.object({
  q: z.string().trim().min(1).max(200),
  config: z.object({
    type: z.literal('scrape'),
    name: z.string(),
    searchUrlTemplate: z.string().url(),
    itemSelector: z.string().min(1),
    titleSelector: z.string().optional(),
    linkSelector: z.string().min(1),
    authorSelector: z.string().optional(),
    coverSelector: z.string().optional(),
    yearSelector: z.string().optional(),
  }),
})

function absoluteUrl(base: string, href?: string | null) {
  if (!href) return undefined
  try {
    return new URL(href, base).toString()
  } catch {
    return undefined
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ results: [] }, { status: 400 })
    }

    const { q, config } = parsed.data

    // Suporte a placeholders variados para maior compatibilidade
    let targetUrl = config.searchUrlTemplate
    if (targetUrl.includes('{query}')) {
      targetUrl = targetUrl.replace(/\{query\}/g, encodeURIComponent(q))
    } else if (targetUrl.includes('{plus}')) {
      targetUrl = targetUrl.replace(/\{plus\}/g, q.trim().replace(/\s+/g, '+'))
    } else if (targetUrl.includes('{raw}')) {
      targetUrl = targetUrl.replace(/\{raw\}/g, q)
    } else {
      // Fallback padrão se nenhum placeholder for encontrado
      const separator = targetUrl.includes('?') ? '&' : '?'
      targetUrl = `${targetUrl}${separator}q=${encodeURIComponent(q)}`
    }

    if (!isSafeUrl(targetUrl)) {
      console.warn(`Blocked unsafe URL attempt: ${targetUrl}`)
      return NextResponse.json({ results: [] }, { status: 403 })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout (aumentado levemente)

    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; BiblioRadar/1.0; +http://biblioradar.vercel.app)',
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) throw new Error(`Status ${res.status}`)

    const contentLength = res.headers.get('content-length')
    if (contentLength && Number(contentLength) > MAX_HTML_BYTES) {
      return NextResponse.json({ results: [] })
    }

    const html = await res.text()
    if (html.length > MAX_HTML_BYTES) {
      return NextResponse.json({ results: [] })
    }
    const $ = cheerio.load(html)
    const items: ScrapeResult[] = []

    const $items = $(config.itemSelector)
    const candidates =
      $items.length > 0 ? $items : $('body').find("a[href$='.pdf']").parent()

    candidates.slice(0, 40).each((_, el) => {
      const $el = $(el)

      const rawLink = config.linkSelector
        ? $el.find(config.linkSelector).first().attr('href')
        : $el.is('a')
          ? $el.attr('href')
          : $el.find('a').first().attr('href')

      const fullHref = absoluteUrl(targetUrl, rawLink)
      if (!fullHref) return

      const title =
        (config.titleSelector
          ? $el.find(config.titleSelector).first().text()
          : $el.attr('title') || $el.text()
        ).trim() || 'Sem título'

      const author = config.authorSelector
        ? $el.find(config.authorSelector).first().text().trim()
        : ''

      const coverSrc = config.coverSelector
        ? $el.find(config.coverSelector).attr('src')
        : undefined

      const year = config.yearSelector
        ? $el.find(config.yearSelector).first().text().trim()
        : undefined

      const isPdf = /\.pdf(\?|#|$)/i.test(fullHref)

      const idHash = createHash('sha256').update(fullHref).digest('hex').slice(0, 16)

      items.push({
        id: `scrape:${config.name.toLowerCase().replace(/\s+/g, '-')}:${idHash}`,
        source: 'scrape',
        title,
        authors: author ? [author] : [],
        cover: absoluteUrl(targetUrl, coverSrc),
        pdfUrl: isPdf ? fullHref : undefined,
        readUrl: fullHref,
        year: year?.slice(0, 4), // Tenta pegar apenas o ano se possível
      })
    })

    return NextResponse.json({ results: items })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Scrape error:', msg)
    return NextResponse.json({ results: [] })
  }
}
