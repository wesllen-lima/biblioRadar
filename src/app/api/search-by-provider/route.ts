export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { gutenberg } from '@/lib/providers/gutenberg'
import { internetArchive } from '@/lib/providers/internetArchive'
import { openLibrary } from '@/lib/providers/openLibrary'
import { makeOpdsProvider } from '@/lib/providers/opds'
import { isSafeUrl } from '@/lib/security'
import type { BookResult } from '@/lib/types'

// Cache de 1 hora na borda
export const revalidate = 3600

const schema = z.object({
  q: z.string().trim().min(1).max(100),
  provider: z.enum(['gutenberg', 'internet_archive', 'open_library', 'opds']),
  feed: z.string().optional(),
})

async function withTimeout<T>(p: Promise<T>, ms = 5000): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error('Timeout')), ms)),
  ])
}

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p
  } catch (e) {
    console.error(e)
    return fallback
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const raw = {
    q: searchParams.get('q') || '',
    provider: searchParams.get('provider'),
    feed: searchParams.get('feed') || undefined,
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ results: [] })
  }

  const { q, provider, feed } = parsed.data
  let results: BookResult[] = []

  try {
    if (provider === 'gutenberg') {
      results = await safe(withTimeout(gutenberg.search(q)), [])
    } else if (provider === 'internet_archive') {
      results = await safe(withTimeout(internetArchive.search(q)), [])
    } else if (provider === 'open_library') {
      results = await safe(withTimeout(openLibrary.search(q)), [])
    } else if (provider === 'opds') {
      // SEGURANÇA: Se for OPDS, validar a URL do feed
      if (!feed || !isSafeUrl(feed)) {
        return NextResponse.json({ results: [] }, { status: 403 })
      }
      results = await safe(withTimeout(makeOpdsProvider(feed).search(q)), [])
    }

    return NextResponse.json(
      { results },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
        },
      }
    )
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
