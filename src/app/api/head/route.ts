export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isSafeUrl } from '@/lib/security'

const schema = z.object({
  u: z.string().url(),
})

type HeadInfo = {
  ok: boolean
  status: number
  contentType?: string
  contentLength?: number
  finalUrl?: string
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

async function doHead(u: string, signal: AbortSignal): Promise<HeadInfo> {
  // Try HEAD first; fall back to GET with Range: bytes=0-0 for servers that block HEAD
  let res = await fetch(u, {
    method: 'HEAD',
    redirect: 'follow',
    signal,
    headers: {
      'User-Agent': UA,
      Accept: 'application/pdf,application/octet-stream,*/*',
    },
  })

  // Some servers return 405 (Method Not Allowed) or 403 for HEAD — retry with minimal GET
  if (res.status === 405 || res.status === 403 || res.status === 400) {
    res = await fetch(u, {
      method: 'GET',
      redirect: 'follow',
      signal,
      headers: {
        'User-Agent': UA,
        Accept: 'application/pdf,application/octet-stream,*/*',
        Range: 'bytes=0-0', // fetch only first byte to keep it fast
      },
    })
  }

  const ct = res.headers.get('content-type') || undefined
  const cl = res.headers.get('content-length')

  return {
    ok: res.ok || res.status === 206, // 206 = Partial Content (Range request OK)
    status: res.status,
    contentType: ct,
    contentLength: cl ? Number(cl) : undefined,
    finalUrl: res.url,
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const u = searchParams.get('u')

  const parsed = schema.safeParse({ u: u || '' })

  if (!parsed.success) {
    return NextResponse.json<HeadInfo>({ ok: false, status: 400 })
  }

  const targetUrl = parsed.data.u

  // SEGURANÇA: Bloqueia acesso a localhost/rede interna
  if (!isSafeUrl(targetUrl)) {
    return NextResponse.json<HeadInfo>({ ok: false, status: 403 })
  }

  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 5000) // 5s total

  try {
    const info = await doHead(targetUrl, controller.signal)
    clearTimeout(t)
    return NextResponse.json(info, {
      headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=300' },
    })
  } catch {
    clearTimeout(t)
    // Retorna status 0 ou 408 em caso de erro/timeout
    return NextResponse.json<HeadInfo>({ ok: false, status: 0 })
  }
}
