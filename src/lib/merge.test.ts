import { describe, it, expect } from 'vitest'
import { mergeResults } from './merge'
import type { BookResult } from './types'

function book(
  partial: Partial<BookResult> & { title: string; authors?: string[] }
): BookResult {
  return {
    id: partial.id ?? partial.title,
    authors: [],
    source: 'gutenberg',
    ...partial,
  }
}

describe('mergeResults', () => {
  it('returns empty array for empty input', () => {
    expect(mergeResults([])).toEqual([])
  })

  it('keeps single book unchanged', () => {
    const b = book({ title: 'Clean Code', authors: ['Martin'] })
    const result = mergeResults([b])
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(b)
  })

  it('deduplicates by normalized title + first author', () => {
    const b1 = book({
      id: '1',
      title: 'Clean Code',
      authors: ['Robert Martin'],
    })
    const b2 = book({
      id: '2',
      title: 'clean code',
      authors: ['Robert Martin'],
    })
    const result = mergeResults([b1, b2])
    expect(result).toHaveLength(1)
  })

  it('prefers entry with pdfUrl over one without', () => {
    const withPdf = book({
      id: 'a',
      title: 'Dom Casmurro',
      authors: ['Machado'],
      pdfUrl: 'http://pdf.com',
    })
    const noPdf = book({ id: 'b', title: 'Dom Casmurro', authors: ['Machado'] })
    const result = mergeResults([noPdf, withPdf])
    expect(result[0].pdfUrl).toBe('http://pdf.com')
  })

  it('keeps first entry when neither has pdfUrl', () => {
    const b1 = book({ id: 'first', title: 'Moby Dick', authors: ['Melville'] })
    const b2 = book({ id: 'second', title: 'Moby Dick', authors: ['Melville'] })
    const result = mergeResults([b1, b2])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('first')
  })

  it('keeps first entry when both have pdfUrl', () => {
    const b1 = book({
      id: 'first',
      title: '1984',
      authors: ['Orwell'],
      pdfUrl: 'http://a.com',
    })
    const b2 = book({
      id: 'second',
      title: '1984',
      authors: ['Orwell'],
      pdfUrl: 'http://b.com',
    })
    const result = mergeResults([b1, b2])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('first')
  })

  it('does not merge books with different authors', () => {
    const b1 = book({ title: 'History', authors: ['Smith'] })
    const b2 = book({ title: 'History', authors: ['Jones'] })
    const result = mergeResults([b1, b2])
    expect(result).toHaveLength(2)
  })

  it('sorts by pdfUrl presence when sortByPdf=true', () => {
    const noPdf = book({ id: 'x', title: 'Book A', authors: ['A'] })
    const withPdf = book({
      id: 'y',
      title: 'Book B',
      authors: ['B'],
      pdfUrl: 'http://x.com',
    })
    const result = mergeResults([noPdf, withPdf], true)
    expect(result[0].pdfUrl).toBeDefined()
  })

  it('handles books with empty authors array', () => {
    const b1 = book({ id: '1', title: 'Anonymous', authors: [] })
    const b2 = book({ id: '2', title: 'Anonymous', authors: [] })
    // Both map to "anonymous::" so they merge
    const result = mergeResults([b1, b2])
    expect(result).toHaveLength(1)
  })

  it('handles large input without error', () => {
    const books = Array.from({ length: 500 }, (_, i) =>
      book({ id: String(i), title: `Book ${i}`, authors: [`Author ${i}`] })
    )
    const result = mergeResults(books)
    expect(result).toHaveLength(500)
  })
})
