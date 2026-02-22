import type { BookResult } from './types'

const DB_NAME = 'biblioradar_v2'
const DB_VERSION = 1
const BOOKS_STORE = 'books'
const LS_LEGACY_KEY = 'br_library_v1'

let dbPromise: Promise<IDBDatabase> | null = null

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(BOOKS_STORE)) {
          const store = db.createObjectStore(BOOKS_STORE, { keyPath: 'id' })
          store.createIndex('savedAt', 'savedAt')
          store.createIndex('title', 'title')
          store.createIndex('source', 'source')
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => {
        dbPromise = null
        reject(req.error)
      }
    })
  }
  return dbPromise
}

function bookStore(db: IDBDatabase, mode: IDBTransactionMode) {
  return db.transaction(BOOKS_STORE, mode).objectStore(BOOKS_STORE)
}

export async function getAllBooks(): Promise<BookResult[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const req = bookStore(db, 'readonly').getAll()
    req.onsuccess = () =>
      resolve(
        (req.result as BookResult[]).sort(
          (a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0)
        )
      )
    req.onerror = () => reject(req.error)
  })
}

export async function putBook(book: BookResult): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const req = bookStore(db, 'readwrite').put(book)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const req = bookStore(db, 'readwrite').delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/** Migra dados do localStorage para IndexedDB na primeira abertura. */
export async function migrateFromLocalStorage(): Promise<void> {
  try {
    const raw = localStorage.getItem(LS_LEGACY_KEY)
    if (!raw) return
    const books: BookResult[] = JSON.parse(raw)
    if (!Array.isArray(books) || books.length === 0) {
      localStorage.removeItem(LS_LEGACY_KEY)
      return
    }
    const db = await getDB()
    await new Promise<void>((resolve, reject) => {
      const t = db.transaction(BOOKS_STORE, 'readwrite')
      const s = t.objectStore(BOOKS_STORE)
      for (const book of books) {
        s.put({ ...book, savedAt: book.savedAt ?? Date.now() })
      }
      t.oncomplete = () => resolve()
      t.onerror = () => reject(t.error)
    })
    localStorage.removeItem(LS_LEGACY_KEY)
  } catch {
    // fallback silencioso — dados permanecem em localStorage
  }
}
