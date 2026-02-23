import { describe, it, expect } from 'vitest'
import { rankResults } from './rank'
import type { BookResult } from './types'

function book(partial: Partial<BookResult> & { title: string }): BookResult {
  return {
    id: partial.id ?? partial.title,
    authors: [],
    source: 'gutenberg',
    ...partial,
  }
}

describe('rankResults', () => {
  it('returns empty array for empty input', () => {
    expect(rankResults('foo', [])).toEqual([])
  })

  it('ranks title-matched book higher than unrelated book', () => {
    const books = [
      book({ title: 'História do Brasil Colonial' }),
      book({ title: 'Dom Casmurro' }),
    ]
    const result = rankResults('Dom Casmurro', books)
    expect(result[0].title).toBe('Dom Casmurro')
  })

  it('boosts book with pdfUrl when titles match equally', () => {
    // Same exact title match — PDF version should rank first
    const books = [
      book({ id: 'a', title: 'Clean Code', authors: ['Martin'], pdfUrl: 'http://example.com/pdf' }),
      book({ id: 'b', title: 'Clean Code', authors: ['Smith'] }),
    ]
    const result = rankResults('Clean Code', books)
    expect(result[0].pdfUrl).toBe('http://example.com/pdf')
  })

  it('exact title match outranks partial match even with pdfUrl', () => {
    // Exact match should win over a "starts with" match that has a PDF
    const books = [
      book({ title: 'Clean Code', authors: ['Martin'] }),
      book({ title: 'Clean Code Guide', authors: ['Smith'], pdfUrl: 'http://example.com/pdf' }),
    ]
    const result = rankResults('Clean Code', books)
    expect(result[0].title).toBe('Clean Code')
  })

  it('deduplicates books with same normalized title and author', () => {
    const books = [
      book({
        id: 'a',
        title: 'The Great Gatsby',
        authors: ['F. Scott Fitzgerald'],
      }),
      book({
        id: 'b',
        title: 'the great gatsby',
        authors: ['f. scott fitzgerald'],
      }),
    ]
    const result = rankResults('Gatsby', books)
    expect(result).toHaveLength(1)
  })

  it('prunes irrelevant results when query has 2+ tokens', () => {
    // "javascript python" — only 1 token matches "XYZ" titles, score < 4 threshold
    const result = rankResults('javascript python', [
      book({ title: 'XYZ Unrelated Topic', source: 'internet_archive' }),
    ])
    // score: 0 tokens match, no startsWith/includes → pruned
    expect(result).toHaveLength(0)
  })

  it('boosts language match when preferredLang is set', () => {
    // rank.ts reads `language` field from BookResult for lang bonus
    const ptBook = book({ title: 'Livro de Programação', language: 'pt' })
    const enBook = book({ title: 'Programming Book', language: 'en' })
    // With preferred pt, pt book gets +3 bonus
    const result = rankResults('programação livro', [ptBook, enBook], 'pt')
    expect(result[0]).toBe(ptBook)
  })

  it('returns books sorted by score descending', () => {
    const books = [
      book({ title: 'Python Introduction' }),
      book({
        title: 'Python',
        authors: ['Guido van Rossum'],
        pdfUrl: 'http://x.com/p',
      }),
      book({ title: 'Python Advanced Topics' }),
    ]
    const result = rankResults('Python', books)
    // Exact "Python" with pdfUrl should score highest
    expect(result[0].title).toBe('Python')
  })

  it('handles books without authors gracefully', () => {
    const books = [book({ title: 'Anonymous Work', authors: [] })]
    expect(() => rankResults('anonymous', books)).not.toThrow()
  })

  it('handles books without year (no crash)', () => {
    const books = [book({ title: 'Timeless Book', year: undefined })]
    const result = rankResults('timeless book', books)
    expect(result).toHaveLength(1)
  })
})
