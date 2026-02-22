const DB_NAME = 'BiblioRadar'
const DB_VERSION = 1
const STORE = 'cache'

type CacheRecord<T> = { key: string; ts: number; data: T }

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => {
      dbPromise = null
      reject(req.error)
    }
  })
  return dbPromise
}

export async function idbGet<T>(key: string, ttlMs: number): Promise<T | null> {
  if (typeof indexedDB === 'undefined') return null
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(key)
      req.onsuccess = () => {
        const rec = req.result as CacheRecord<T> | undefined
        if (!rec || Date.now() - rec.ts > ttlMs) {
          resolve(null)
        } else {
          resolve(rec.data)
        }
      }
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function idbSet<T>(key: string, data: T): Promise<void> {
  if (typeof indexedDB === 'undefined') return
  try {
    const db = await openDB()
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put({
        key,
        ts: Date.now(),
        data,
      } satisfies CacheRecord<T>)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {}
}
