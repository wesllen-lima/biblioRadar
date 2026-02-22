import type { BookResult } from './types'

const OL_SEARCH = 'https://openlibrary.org/search.json'

/**
 * Fetches missing metadata (cover, description, subjects, isbn) for a book
 * from the Open Library API. Returns only the fields that were missing and found.
 */
export async function enrichBook(
  book: BookResult
): Promise<Partial<BookResult>> {
  const updates: Partial<BookResult> = {}

  // Nothing to enrich if we already have everything
  const needsCover = !book.cover
  const needsDesc = !book.description
  const needsSubjects = !book.subject?.length
  const needsIsbn = !book.isbn
  if (!needsCover && !needsDesc && !needsSubjects && !needsIsbn) return updates

  try {
    const query = book.isbn
      ? `isbn:${book.isbn}`
      : `title:"${book.title}"${book.authors[0] ? ` author:"${book.authors[0]}"` : ''}`

    const fields = 'key,cover_i,description,subject,isbn,first_publish_year'
    const res = await fetch(
      `${OL_SEARCH}?q=${encodeURIComponent(query)}&limit=1&fields=${fields}`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return updates

    const data = await res.json()
    const doc = data.docs?.[0]
    if (!doc) return updates

    if (needsCover && doc.cover_i) {
      updates.cover = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
    }

    if (needsIsbn && doc.isbn?.[0]) {
      updates.isbn = doc.isbn[0]
    }

    if (needsSubjects && doc.subject?.length) {
      updates.subject = (doc.subject as string[]).slice(0, 8)
    }

    // Fetch description from Works API if needed
    if (needsDesc && doc.key) {
      try {
        const worksRes = await fetch(`https://openlibrary.org${doc.key}.json`, {
          signal: AbortSignal.timeout(5000),
        })
        if (worksRes.ok) {
          const works = await worksRes.json()
          const raw = works.description
          const desc = typeof raw === 'string' ? raw : raw?.value
          if (desc) updates.description = desc.slice(0, 600)
        }
      } catch {
        // description fetch is optional, ignore errors
      }
    }
  } catch {
    // enrichment is best-effort, never throw
  }

  return updates
}
