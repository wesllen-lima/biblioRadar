import type { BookResult } from '@/lib/types'

type WithLang = BookResult & {
  lang?: string | string[]
  language?: string | string[]
}

function norm(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
}

function tokens(s: string) {
  return norm(s)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

function getLang(b: BookResult): string | string[] | undefined {
  const wb = b as WithLang
  return wb.lang ?? wb.language
}

function langBonus(
  lang: string | string[] | undefined,
  preferred: string
): number {
  if (!lang) return 0

  const matches = (l: string) => l.toLowerCase().startsWith(preferred)

  if (typeof lang === 'string') return matches(lang) ? 3 : 0
  if (Array.isArray(lang)) return lang.some((l) => matches(String(l))) ? 3 : 0
  return 0
}

function scoreOne(q: string, b: BookResult, preferredLang: string): number {
  const tq = tokens(q)
  const title = b.title || ''
  const authorsStr = b.authors?.length ? b.authors.join(' ') : ''
  const tt = tokens(title)
  const ta = tokens(authorsStr)
  if (tt.length === 0) return -1

  let score = 0

  const set = new Set([...tt, ...ta])
  for (const t of tq) if (set.has(t)) score += 3

  const Nq = norm(q)
  const Nt = norm(title)
  const Na = norm(authorsStr)
  if (Nt.startsWith(Nq)) score += 6
  else if (Nt.includes(Nq)) score += 4
  if (Na && Na.includes(Nq)) score += 3

  if (b.pdfUrl) score += 3
  if (b.year) score += 1

  const lang = getLang(b)
  if (preferredLang !== 'all') {
    score += langBonus(lang, preferredLang)
  } else {
    if (typeof lang === 'string') {
      const L = lang.toLowerCase()
      if (L.startsWith('pt') || L.startsWith('en')) score += 1
    } else if (Array.isArray(lang)) {
      if (
        lang.some((l) =>
          ['pt', 'en'].some((p) => String(l).toLowerCase().startsWith(p))
        )
      )
        score += 1
    }
  }

  if ((b.source || '').toLowerCase().includes('gutenberg')) score += 1

  return score
}

export function rankResults(
  q: string,
  rows: BookResult[],
  preferredLang = 'all'
) {
  const seen = new Set<string>()
  const dedup: BookResult[] = []
  for (const r of rows) {
    const authorsStr = r.authors?.length ? r.authors.join(' ') : ''
    const key = `${norm(r.title || '')}::${norm(authorsStr)}`
    if (seen.has(key)) continue
    seen.add(key)
    dedup.push(r)
  }

  const withScore = dedup.map((b) => ({ b, s: scoreOne(q, b, preferredLang) }))
  const qTokens = tokens(q)
  const pruned = withScore.filter(({ s }) =>
    qTokens.length >= 2 ? s >= 4 : s >= 1
  )
  pruned.sort((a, b) => b.s - a.s || (b.b.year || 0) - (a.b.year || 0))

  return pruned.map(({ b }) => b)
}
