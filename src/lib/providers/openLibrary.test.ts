import { describe, it, expect, vi, beforeEach } from 'vitest'
import { openLibrary } from './openLibrary'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function okResponse(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
  )
}

function makeDoc(overrides: Record<string, unknown> = {}) {
  return {
    key: '/works/OL1003040W',
    title: 'Dom Casmurro',
    author_name: ['Machado de Assis'],
    first_publish_year: 1899,
    cover_i: 647501,
    ia: ['domcasmurro0000mach'],
    public_scan_b: false,
    has_fulltext: false,
    ...overrides,
  }
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe('openLibrary provider', () => {
  it('returns empty array on non-ok response', async () => {
    mockFetch.mockResolvedValue(new Response('', { status: 503 }))
    const results = await openLibrary.search('dom casmurro')
    expect(results).toEqual([])
  })

  it('maps basic fields correctly', async () => {
    mockFetch.mockReturnValue(okResponse({ docs: [makeDoc()] }))
    const results = await openLibrary.search('dom casmurro')

    expect(results).toHaveLength(1)
    const r = results[0]
    expect(r.id).toBe('ol:/works/OL1003040W')
    expect(r.source).toBe('open_library')
    expect(r.title).toBe('Dom Casmurro')
    expect(r.authors).toEqual(['Machado de Assis'])
    expect(r.year).toBe(1899)
    expect(r.cover).toContain('647501')
    expect(r.readUrl).toBe('https://openlibrary.org/works/OL1003040W')
  })

  it('does NOT set pdfUrl when public_scan_b is false', async () => {
    mockFetch.mockReturnValue(okResponse({ docs: [makeDoc({ public_scan_b: false, ia: ['domcasmurro0000mach'] })] }))
    const results = await openLibrary.search('dom casmurro')

    expect(results[0].pdfUrl).toBeUndefined()
  })

  it('sets pdfUrl via IA when public_scan_b is true', async () => {
    mockFetch.mockReturnValue(
      okResponse({ docs: [makeDoc({ public_scan_b: true, ia: ['pollyanna00port_2'] })] })
    )
    const results = await openLibrary.search('pollyanna')

    expect(results[0].pdfUrl).toBe(
      'https://archive.org/download/pollyanna00port_2/pollyanna00port_2.pdf'
    )
  })

  it('does NOT set pdfUrl when public_scan_b is true but ia is empty', async () => {
    mockFetch.mockReturnValue(
      okResponse({ docs: [makeDoc({ public_scan_b: true, ia: [] })] })
    )
    const results = await openLibrary.search('test')

    expect(results[0].pdfUrl).toBeUndefined()
  })

  it('uses first ia identifier for PDF URL', async () => {
    mockFetch.mockReturnValue(
      okResponse({
        docs: [makeDoc({ public_scan_b: true, ia: ['first_ia_id', 'second_ia_id'] })],
      })
    )
    const results = await openLibrary.search('test')

    expect(results[0].pdfUrl).toContain('first_ia_id')
  })

  it('handles missing cover gracefully', async () => {
    mockFetch.mockReturnValue(okResponse({ docs: [makeDoc({ cover_i: undefined })] }))
    const results = await openLibrary.search('test')

    expect(results[0].cover).toBeUndefined()
  })

  it('handles missing year gracefully', async () => {
    mockFetch.mockReturnValue(okResponse({ docs: [makeDoc({ first_publish_year: undefined })] }))
    const results = await openLibrary.search('test')

    expect(results[0].year).toBeUndefined()
  })

  it('handles empty docs array', async () => {
    mockFetch.mockReturnValue(okResponse({ docs: [] }))
    const results = await openLibrary.search('nothing')
    expect(results).toEqual([])
  })

  it('includes fields param in the API request URL', async () => {
    mockFetch.mockReturnValue(okResponse({ docs: [] }))
    await openLibrary.search('test')

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('public_scan_b')
    expect(calledUrl).toContain('has_fulltext')
    expect(calledUrl).toContain('ia')
  })
})
