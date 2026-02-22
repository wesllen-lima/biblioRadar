import { describe, it, expect, vi, beforeEach } from 'vitest'
import { internetArchive } from './internetArchive'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function okJson(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
  )
}

const SEARCH_RESPONSE = {
  response: {
    docs: [
      { identifier: 'domcasmurro0000mach', title: 'Dom Casmurro', creator: 'Machado de Assis', year: '1899' },
    ],
  },
}

const FILES_WITH_TEXT_PDF = {
  result: [
    { name: 'domcasmurro0000mach.pdf', format: 'Text PDF' },
    { name: 'domcasmurro0000mach.epub', format: 'EPUB' },
    { name: 'domcasmurro0000mach_encrypted.pdf', format: 'ACS Encrypted PDF' },
    { name: 'domcasmurro0000mach.lcpdf', format: 'LCP Encrypted PDF' },
  ],
}

const FILES_ONLY_ENCRYPTED = {
  result: [
    { name: 'book_encrypted.pdf', format: 'ACS Encrypted PDF' },
    { name: 'book.lcpdf', format: 'LCP Encrypted PDF' },
  ],
}

const FILES_NO_PDF = {
  result: [
    { name: 'book.epub', format: 'EPUB' },
    { name: 'book.txt', format: 'Plain Text' },
  ],
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe('internetArchive provider', () => {
  it('returns empty array on non-ok search response', async () => {
    mockFetch.mockResolvedValue(new Response('', { status: 503 }))
    const results = await internetArchive.search('hamlet')
    expect(results).toEqual([])
  })

  it('picks Text PDF over encrypted PDF', async () => {
    mockFetch
      .mockReturnValueOnce(okJson(SEARCH_RESPONSE))
      .mockReturnValueOnce(okJson(FILES_WITH_TEXT_PDF))

    const results = await internetArchive.search('dom casmurro')
    expect(results).toHaveLength(1)
    expect(results[0].pdfUrl).toBe(
      'https://archive.org/download/domcasmurro0000mach/domcasmurro0000mach.pdf'
    )
  })

  it('returns undefined pdfUrl when only encrypted PDFs exist', async () => {
    mockFetch
      .mockReturnValueOnce(okJson(SEARCH_RESPONSE))
      .mockReturnValueOnce(okJson(FILES_ONLY_ENCRYPTED))

    const results = await internetArchive.search('dom casmurro')
    expect(results[0].pdfUrl).toBeUndefined()
  })

  it('returns undefined pdfUrl when no PDFs exist', async () => {
    mockFetch
      .mockReturnValueOnce(okJson(SEARCH_RESPONSE))
      .mockReturnValueOnce(okJson(FILES_NO_PDF))

    const results = await internetArchive.search('dom casmurro')
    expect(results[0].pdfUrl).toBeUndefined()
  })

  it('does not return ACS encrypted PDF as pdfUrl', async () => {
    const filesWithOnlyAcs = {
      result: [
        { name: 'book.pdf', format: 'ACS Encrypted PDF' },
      ],
    }
    mockFetch
      .mockReturnValueOnce(okJson(SEARCH_RESPONSE))
      .mockReturnValueOnce(okJson(filesWithOnlyAcs))

    const results = await internetArchive.search('test')
    expect(results[0].pdfUrl).toBeUndefined()
  })

  it('maps author as single string to array', async () => {
    mockFetch
      .mockReturnValueOnce(okJson(SEARCH_RESPONSE))
      .mockReturnValueOnce(okJson(FILES_WITH_TEXT_PDF))

    const results = await internetArchive.search('dom casmurro')
    expect(results[0].authors).toEqual(['Machado de Assis'])
  })

  it('maps author array correctly', async () => {
    const multiAuthor = {
      response: {
        docs: [{ identifier: 'testbook', title: 'Test', creator: ['Author A', 'Author B'] }],
      },
    }
    mockFetch
      .mockReturnValueOnce(okJson(multiAuthor))
      .mockReturnValueOnce(okJson(FILES_NO_PDF))

    const results = await internetArchive.search('test')
    expect(results[0].authors).toEqual(['Author A', 'Author B'])
  })

  it('uses cover from IA image service', async () => {
    mockFetch
      .mockReturnValueOnce(okJson(SEARCH_RESPONSE))
      .mockReturnValueOnce(okJson(FILES_NO_PDF))

    const results = await internetArchive.search('test')
    expect(results[0].cover).toBe('https://archive.org/services/img/domcasmurro0000mach')
  })

  it('sets readUrl to IA details page', async () => {
    mockFetch
      .mockReturnValueOnce(okJson(SEARCH_RESPONSE))
      .mockReturnValueOnce(okJson(FILES_NO_PDF))

    const results = await internetArchive.search('test')
    expect(results[0].readUrl).toBe('https://archive.org/details/domcasmurro0000mach')
  })

  it('falls back to guessed URL when metadata fetch fails', async () => {
    mockFetch
      .mockReturnValueOnce(okJson(SEARCH_RESPONSE))
      .mockRejectedValueOnce(new Error('Network error'))

    const results = await internetArchive.search('dom casmurro')
    // Falls back to first guessed URL
    expect(results[0].pdfUrl).toBe(
      'https://archive.org/download/domcasmurro0000mach/domcasmurro0000mach.pdf'
    )
  })

  it('converts year string to number', async () => {
    mockFetch
      .mockReturnValueOnce(okJson(SEARCH_RESPONSE))
      .mockReturnValueOnce(okJson(FILES_NO_PDF))

    const results = await internetArchive.search('test')
    expect(results[0].year).toBe(1899)
    expect(typeof results[0].year).toBe('number')
  })
})
