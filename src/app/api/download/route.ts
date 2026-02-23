export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { isSafeUrl } from '@/lib/security'

const DEFAULT_HOSTS = [
  'gutenberg.org',
  'archive.org',
  'openlibrary.org',
  'covers.openlibrary.org',
  'scielo.org',
  'scielo.br',
  'periodicos.capes.gov.br',
  'gov.br',
  'usp.br',
  'unicamp.br',
  'unesp.br',
  'arxiv.org',
  'biorxiv.org',
  'medrxiv.org',
  'ssrn.com',
  'core.ac.uk',
  'plos.org',
  'mdpi.com',
  'frontiersin.org',
  'springeropen.com',
  'hindawi.com',
  'researchgate.net',
  'academia.edu',
  'standardebooks.org',
  'manybooks.net',
  'planetebook.com',
  // Zenodo (CERN open access)
  'zenodo.org',
  // HAL (French open archive)
  'archives-ouvertes.fr',
  'hal.science',
  'hal.archives-ouvertes.fr',
  // EuropePMC
  'europepmc.org',
  'ncbi.nlm.nih.gov',
]

let trustedHostsCache: Set<string> | null = null

function getTrustedHosts(): Set<string> {
  if (trustedHostsCache) return trustedHostsCache
  const extra = (process.env.TRUSTED_DOWNLOAD_HOSTS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  const allHosts = [...DEFAULT_HOSTS, ...extra].flatMap((h) => [h, `www.${h}`])
  trustedHostsCache = new Set(allHosts)
  return trustedHostsCache
}

const MAX_BYTES = Number(process.env.DOWNLOAD_MAX_BYTES || 80 * 1024 * 1024)

// Browser-like headers that work with most file hosts
const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/pdf,application/octet-stream,*/*',
  'Accept-Language': 'en-US,en;q=0.9,pt;q=0.8',
  'Accept-Encoding': 'identity', // avoid compressed streams we can't pass through easily
  Referer: 'https://www.google.com/',
  'Cache-Control': 'no-cache',
}

function isHostTrusted(hostname: string): boolean {
  const trusted = getTrustedHosts()
  const h = hostname.toLowerCase().replace(/^www\./, '')
  return [...trusted].some((t) => {
    const clean = t.replace(/^www\./, '')
    return h === clean || h.endsWith(`.${clean}`)
  })
}

async function tryFetch(url: string): Promise<Response> {
  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), 20_000)
  try {
    const resp = await fetch(url, {
      headers: BROWSER_HEADERS,
      redirect: 'follow',
      signal: ctrl.signal,
    })
    return resp
  } finally {
    clearTimeout(timeout)
  }
}

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get('url')
  if (!urlParam) return new Response('Missing url', { status: 400 })

  let src: URL
  try {
    src = new URL(urlParam)
  } catch {
    return new Response('Invalid url', { status: 400 })
  }

  if (!['http:', 'https:'].includes(src.protocol))
    return new Response('Protocol not allowed', { status: 400 })
  if (!isSafeUrl(src.toString()))
    return new Response('Unsafe destination', { status: 403 })

  // Sources explicitly added by the user (OPDS feeds / scrapers) are trusted —
  // the user configured them intentionally. isSafeUrl above already blocks
  // private IPs, localhost and cloud-metadata endpoints.
  const srcParam = req.nextUrl.searchParams.get('src') ?? ''
  const isUserSource =
    srcParam.startsWith('opds:') || srcParam.startsWith('scrape:')

  if (!isUserSource && !isHostTrusted(src.hostname))
    return new Response('Host not allowed', { status: 403 })

  try {
    const resp = await tryFetch(src.toString())

    // Some servers return 403/429 — try once with a slightly different UA
    let finalResp = resp
    if (!resp.ok && (resp.status === 403 || resp.status === 429)) {
      const retryCtrl = new AbortController()
      const retryTimeout = setTimeout(() => retryCtrl.abort(), 15_000)
      try {
        finalResp = await fetch(src.toString(), {
          headers: {
            ...BROWSER_HEADERS,
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
            Referer: src.origin + '/',
          },
          redirect: 'follow',
          signal: retryCtrl.signal,
        })
      } finally {
        clearTimeout(retryTimeout)
      }
    }

    if (!finalResp.ok || !finalResp.body) {
      return new Response(`Upstream returned ${finalResp.status}`, {
        status: 502,
      })
    }

    // Check size from Content-Length if available
    const lenStr = finalResp.headers.get('content-length')
    if (lenStr) {
      const len = Number(lenStr)
      if (!Number.isNaN(len) && len > MAX_BYTES)
        return new Response('File too large', { status: 413 })
    }

    // Determine filename
    let filename = 'document.pdf'
    const disp = finalResp.headers.get('content-disposition')
    if (disp?.includes('filename=')) {
      const match = disp.match(/filename[*]?=(?:UTF-8''|"?)([^";\n]+)/i)
      if (match) {
        try {
          filename = decodeURIComponent(match[1].trim().replace(/"/g, ''))
        } catch {
          filename = match[1].trim().replace(/"/g, '')
        }
      }
    } else {
      const pathPart = src.pathname.split('/').pop()
      if (pathPart && pathPart.includes('.')) {
        try {
          filename = decodeURIComponent(pathPart)
        } catch {
          filename = pathPart
        }
      }
    }

    const reader = finalResp.body.getReader()
    let bytes = 0
    const stream = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read()
        if (done) {
          controller.close()
          return
        }
        bytes += value.byteLength
        if (bytes > MAX_BYTES) {
          controller.error(new Error('File limit exceeded'))
          return
        }
        controller.enqueue(value)
      },
      cancel() {
        reader.cancel()
      },
    })

    const contentType =
      finalResp.headers.get('Content-Type') || 'application/pdf'

    return new Response(stream, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
        ...(lenStr ? { 'Content-Length': lenStr } : {}),
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('aborted') || msg.includes('abort')) {
      return new Response('Download timed out', { status: 504 })
    }
    console.error('Download proxy error:', err)
    return new Response('Internal Server Error', { status: 500 })
  }
}
