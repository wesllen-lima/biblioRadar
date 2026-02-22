'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { BookResult } from './types'
import { getAllBooks, putBook, deleteBook, migrateFromLocalStorage } from './db'
import { enrichBook } from './enrichment'

const BC_NAME = 'biblio_library_sync'

type LibraryContextType = {
  items: BookResult[]
  isLoaded: boolean
  toggleBook: (book: BookResult) => void
  isSaved: (id: string) => boolean
  updateBook: (id: string, updates: Partial<BookResult>) => void
}

const LibraryContext = createContext<LibraryContextType | null>(null)

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BookResult[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const reload = useCallback(async () => {
    const books = await getAllBooks()
    setItems(books)
  }, [])

  useEffect(() => {
    ;(async () => {
      await migrateFromLocalStorage()
      await reload()
      setIsLoaded(true)
    })()

    // Cross-tab sync via BroadcastChannel
    if (typeof BroadcastChannel === 'undefined') return
    const bc = new BroadcastChannel(BC_NAME)
    bc.onmessage = () => reload()
    return () => bc.close()
  }, [reload])

  const broadcast = () => {
    if (typeof BroadcastChannel === 'undefined') return
    const bc = new BroadcastChannel(BC_NAME)
    bc.postMessage('update')
    bc.close()
  }

  const toggleBook = (book: BookResult) => {
    const exists = items.some((b) => b.id === book.id)
    const savedBook: BookResult = {
      ...book,
      savedAt: Date.now(),
      readingStatus: 'unread',
    }
    // Optimistic update
    setItems((prev) =>
      exists ? prev.filter((b) => b.id !== book.id) : [savedBook, ...prev]
    )
    if (exists) {
      deleteBook(book.id)
        .then(broadcast)
        .catch(() => {
          // Revert: restore the removed book
          setItems((prev) => [book, ...prev])
        })
    } else {
      putBook(savedBook)
        .then(async () => {
          broadcast()
          // Background enrichment (respects user setting)
          try {
            const raw = localStorage.getItem('biblio_settings')
            const s = raw ? JSON.parse(raw) : {}
            if (s.enrichMetadata !== false) {
              const updates = await enrichBook(savedBook)
              if (Object.keys(updates).length > 0) {
                const enriched = { ...savedBook, ...updates }
                await putBook(enriched)
                setItems((prev) =>
                  prev.map((b) => (b.id === enriched.id ? enriched : b))
                )
                broadcast()
              }
            }
          } catch {
            // enrichment is best-effort
          }
        })
        .catch(() => {
          // Revert: remove the optimistically added book
          setItems((prev) => prev.filter((b) => b.id !== savedBook.id))
        })
    }
  }

  const updateBook = (id: string, updates: Partial<BookResult>) => {
    const previous = items.find((b) => b.id === id)
    setItems((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    )
    if (previous) {
      putBook({ ...previous, ...updates })
        .then(broadcast)
        .catch(() => {
          // Revert to previous state
          setItems((prev) => prev.map((b) => (b.id === id ? previous : b)))
        })
    }
  }

  const isSaved = (id: string) => items.some((b) => b.id === id)

  return (
    <LibraryContext.Provider
      value={{ items, isLoaded, toggleBook, isSaved, updateBook }}
    >
      {children}
    </LibraryContext.Provider>
  )
}

export function useLibrary() {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider')
  return ctx
}
