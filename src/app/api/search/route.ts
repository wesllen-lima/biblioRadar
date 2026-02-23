export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { gutenberg } from '@/lib/providers/gutenberg'
import { internetArchive } from '@/lib/providers/internetArchive'
import { openLibrary } from '@/lib/providers/openLibrary'
import { arxiv } from '@/lib/providers/arxiv'
import { zenodo } from '@/lib/providers/zenodo'
import { hal } from '@/lib/providers/hal'
import { europePMC } from '@/lib/providers/europePMC'
import type { BookResult } from '@/lib/types'

const PROVIDERS = [
  { id: 'gutenberg', provider: gutenberg },
  { id: 'internet_archive', provider: internetArchive },
  { id: 'open_library', provider: openLibrary },
  { id: 'arxiv', provider: arxiv },
  { id: 'zenodo', provider: zenodo },
  { id: 'hal', provider: hal },
  { id: 'europe_pmc', provider: europePMC },
]

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) {
    return new Response(JSON.stringify({ done: true }) + '\n', {
      headers: { 'Content-Type': 'application/x-ndjson' },
    })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      let pending = PROVIDERS.length

      const send = (obj: object) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'))
        } catch {}
      }

      const finish = () => {
        pending--
        if (pending === 0) {
          send({ done: true })
          try {
            controller.close()
          } catch {}
        }
      }

      for (const { id, provider } of PROVIDERS) {
        const timeout = new Promise<BookResult[]>((resolve) =>
          setTimeout(() => resolve([]), 8_000)
        )
        Promise.race([provider.search(q), timeout])
          .then((results) => send({ source: id, results }))
          .catch(() => send({ source: id, results: [] }))
          .finally(finish)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
