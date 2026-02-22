import { describe, it, expect, vi, beforeEach } from 'vitest'
import { gutenberg } from './gutenberg'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function makeBook(overrides: Record<string, unknown> = {}) {
  return {
    id: 1524,
    title: 'Hamlet',
    authors: [{ name: 'Shakespeare, William', birth_year: 1564, death_year: 1616 }],
    languages: ['en'],
    download_count: 5000,
    formats: {
      'application/epub+zip': 'https://www.gutenberg.org/ebooks/1524.epub3.images',
      'image/jpeg': 'https://www.gutenberg.org/cache/epub/1524/pg1524.cover.medium.jpg',
      'text/html': 'https://www.gutenberg.org/ebooks/1524.html.images',
      'application/octet-stream': 'https://www.gutenberg.org/cache/epub/1524/pg1524-h.zip',
    },
    ...overrides,
  }
}

function okResponse(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
  )
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe('gutenberg provider', () => {
  it('returns empty array on non-ok response', async () => {
    mockFetch.mockResolvedValue(new Response('', { status: 503 }))
    const results = await gutenberg.search('hamlet')
    expect(results).toEqual([])
  })

  it('returns empty array when results is empty', async () => {
    mockFetch.mockReturnValue(okResponse({ count: 0, results: [] }))
    const results = await gutenberg.search('xyznotfound')
    expect(results).toEqual([])
  })

  it('maps EPUB URL to epubUrl, not pdfUrl', async () => {
    mockFetch.mockReturnValue(okResponse({ count: 1, results: [makeBook()] }))
    const results = await gutenberg.search('hamlet')

    expect(results).toHaveLength(1)
    expect(results[0].epubUrl).toBe('https://www.gutenberg.org/ebooks/1524.epub3.images')
    expect(results[0].pdfUrl).toBeUndefined()
  })

  it('does NOT set pdfUrl from application/octet-stream (zip file)', async () => {
    mockFetch.mockReturnValue(okResponse({ count: 1, results: [makeBook()] }))
    const results = await gutenberg.search('hamlet')

    expect(results[0].pdfUrl).toBeUndefined()
  })

  it('sets pdfUrl only when application/pdf format exists', async () => {
    const withPdf = makeBook({
      formats: {
        'application/pdf': 'https://www.gutenberg.org/files/1524/1524.pdf',
        'application/epub+zip': 'https://www.gutenberg.org/ebooks/1524.epub3.images',
        'image/jpeg': 'https://covers.example.com/cover.jpg',
      },
    })
    mockFetch.mockReturnValue(okResponse({ count: 1, results: [withPdf] }))
    const results = await gutenberg.search('hamlet')

    expect(results[0].pdfUrl).toBe('https://www.gutenberg.org/files/1524/1524.pdf')
    expect(results[0].epubUrl).toBe('https://www.gutenberg.org/ebooks/1524.epub3.images')
  })

  it('uses stable id from gutenberg numeric id', async () => {
    mockFetch.mockReturnValue(okResponse({ count: 1, results: [makeBook()] }))
    const results = await gutenberg.search('hamlet')

    expect(results[0].id).toBe('gutenberg:1524')
    expect(results[0].source).toBe('gutenberg')
  })

  it('always sets readUrl to gutenberg ebook page', async () => {
    mockFetch.mockReturnValue(okResponse({ count: 1, results: [makeBook()] }))
    const results = await gutenberg.search('hamlet')

    expect(results[0].readUrl).toBe('https://www.gutenberg.org/ebooks/1524')
  })

  it('deduplicates authors', async () => {
    const dupe = makeBook({
      authors: [
        { name: 'Shakespeare, William' },
        { name: 'Shakespeare, William' },
        { name: 'Garrick, David' },
      ],
    })
    mockFetch.mockReturnValue(okResponse({ count: 1, results: [dupe] }))
    const results = await gutenberg.search('hamlet')

    expect(results[0].authors).toEqual(['Shakespeare, William', 'Garrick, David'])
  })

  it('handles missing cover gracefully', async () => {
    const noCover = makeBook({ formats: { 'application/epub+zip': 'https://example.com/book.epub' } })
    mockFetch.mockReturnValue(okResponse({ count: 1, results: [noCover] }))
    const results = await gutenberg.search('hamlet')

    expect(results[0].cover).toBeUndefined()
  })
})
