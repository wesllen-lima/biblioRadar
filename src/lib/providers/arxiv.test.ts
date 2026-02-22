import { describe, it, expect, vi, beforeEach } from 'vitest'
import { arxiv } from './arxiv'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function okXml(xml: string) {
  return Promise.resolve(
    new Response(xml, { status: 200, headers: { 'Content-Type': 'application/atom+xml' } })
  )
}

// Minimal valid Atom/arXiv entry
function makeEntry(overrides: Partial<{
  id: string
  title: string
  authors: string[]
  published: string
  summary: string
  pdfHref: string
  category: string
}> = {}) {
  const {
    id = 'https://arxiv.org/abs/2306.04338v1',
    title = 'Attention Is All You Need',
    authors = ['Vaswani, Ashish', 'Shazeer, Noam'],
    published = '2023-06-07T00:00:00Z',
    summary = 'A paper about transformers.',
    pdfHref = 'https://arxiv.org/pdf/2306.04338v1',
    category = 'cs.LG',
  } = overrides

  const authorXml = authors.map((a) => `<author><name>${a}</name></author>`).join('\n')

  return `<entry>
    <id>${id}</id>
    <title>${title}</title>
    ${authorXml}
    <published>${published}</published>
    <summary>${summary}</summary>
    <link href="${pdfHref}" title="pdf" type="application/pdf"/>
    <category term="${category}" scheme="http://arxiv.org/schemas/atom"/>
  </entry>`
}

function wrapFeed(entries: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>ArXiv Query</title>
  ${entries}
</feed>`
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe('arxiv provider', () => {
  it('returns empty array on non-ok response', async () => {
    mockFetch.mockResolvedValue(new Response('', { status: 503 }))
    const results = await arxiv.search('machine learning')
    expect(results).toEqual([])
  })

  it('returns empty array on network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const results = await arxiv.search('machine learning')
    expect(results).toEqual([])
  })

  it('parses a single entry correctly', async () => {
    mockFetch.mockReturnValue(okXml(wrapFeed(makeEntry())))
    const results = await arxiv.search('attention')

    expect(results).toHaveLength(1)
    const r = results[0]
    expect(r.id).toBe('arxiv:2306.04338')
    expect(r.source).toBe('arxiv')
    expect(r.title).toBe('Attention Is All You Need')
    expect(r.authors).toEqual(['Vaswani, Ashish', 'Shazeer, Noam'])
    expect(r.year).toBe(2023)
    expect(r.description).toBe('A paper about transformers.')
  })

  it('strips version from arxiv id', async () => {
    mockFetch.mockReturnValue(okXml(wrapFeed(makeEntry({ id: 'https://arxiv.org/abs/2306.04338v3' }))))
    const results = await arxiv.search('test')

    expect(results[0].id).toBe('arxiv:2306.04338')
  })

  it('sets readUrl to abs page', async () => {
    mockFetch.mockReturnValue(okXml(wrapFeed(makeEntry())))
    const results = await arxiv.search('test')

    expect(results[0].readUrl).toBe('https://arxiv.org/abs/2306.04338')
  })

  it('appends .pdf to pdfUrl when not present', async () => {
    mockFetch.mockReturnValue(
      okXml(wrapFeed(makeEntry({ pdfHref: 'https://arxiv.org/pdf/2306.04338v1' })))
    )
    const results = await arxiv.search('test')

    expect(results[0].pdfUrl).toBe('https://arxiv.org/pdf/2306.04338v1.pdf')
  })

  it('does not double-append .pdf when already present', async () => {
    mockFetch.mockReturnValue(
      okXml(wrapFeed(makeEntry({ pdfHref: 'https://arxiv.org/pdf/2306.04338v1.pdf' })))
    )
    const results = await arxiv.search('test')

    expect(results[0].pdfUrl).toBe('https://arxiv.org/pdf/2306.04338v1.pdf')
  })

  it('extracts subject category', async () => {
    mockFetch.mockReturnValue(okXml(wrapFeed(makeEntry({ category: 'cs.AI' }))))
    const results = await arxiv.search('test')

    expect(results[0].subject).toEqual(['cs.AI'])
  })

  it('sets format to pdf', async () => {
    mockFetch.mockReturnValue(okXml(wrapFeed(makeEntry())))
    const results = await arxiv.search('test')

    expect(results[0].format).toBe('pdf')
  })

  it('parses multiple entries', async () => {
    const entries = [
      makeEntry({ id: 'https://arxiv.org/abs/2001.00001v1', title: 'Paper A' }),
      makeEntry({ id: 'https://arxiv.org/abs/2001.00002v1', title: 'Paper B' }),
      makeEntry({ id: 'https://arxiv.org/abs/2001.00003v1', title: 'Paper C' }),
    ].join('\n')

    mockFetch.mockReturnValue(okXml(wrapFeed(entries)))
    const results = await arxiv.search('test')

    expect(results).toHaveLength(3)
    expect(results.map((r) => r.title)).toEqual(['Paper A', 'Paper B', 'Paper C'])
  })

  it('skips entries without a valid arxiv id', async () => {
    const invalid = `<entry>
      <id>https://example.com/not-arxiv</id>
      <title>Invalid</title>
      <published>2023-01-01T00:00:00Z</published>
      <summary>Test</summary>
    </entry>`

    mockFetch.mockReturnValue(okXml(wrapFeed(invalid)))
    const results = await arxiv.search('test')

    expect(results).toHaveLength(0)
  })
})
