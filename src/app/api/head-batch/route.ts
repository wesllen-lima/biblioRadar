export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isSafeUrl } from '@/lib/security'

const schema = z.object({
  urls: z.array(z.string().url()).max(30),
})

type HeadInfo = {
  url: string
  ok: boolean
  status: number
  contentType?: string
}

async function checkUrl(u: string): Promise<HeadInfo> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4000)
  try {
    const res = await fetch(u, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'BiblioRadar/1.0 (HeadCheck)' },
    })
    clearTimeout(timer)
    return {
      url: u,
      ok: res.ok,
      status: res.status,
      contentType: res.headers.get('content-type') || undefined,
    }
  } catch {
    clearTimeout(timer)
    return { url: u, ok: false, status: 0 }
  }
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const safeUrls = parsed.data.urls.filter(isSafeUrl)
  const settled = await Promise.allSettled(safeUrls.map(checkUrl))
  const results = settled.map((r, i) =>
    r.status === 'fulfilled' ? r.value : { url: safeUrls[i], ok: false, status: 0 }
  )

  return NextResponse.json(
    { results },
    {
      headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=300' },
    }
  )
}
