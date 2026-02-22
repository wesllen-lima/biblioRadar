import { idbGet, idbSet } from './idbCache'

export type CacheRecord<T> = { ts: number; data: T }

const NS = 'br_cache_v1:'
const DEFAULT_TTL = 5 * 60 * 1000

function ssGet<T>(key: string, ttlMs: number): T | null {
  if (typeof sessionStorage === 'undefined') return null
  const raw = sessionStorage.getItem(NS + key)
  if (!raw) return null
  try {
    const obj = JSON.parse(raw) as CacheRecord<T>
    if (!obj || typeof obj.ts !== 'number') return null
    if (Date.now() - obj.ts > ttlMs) return null
    return obj.data
  } catch {
    return null
  }
}

function ssSet<T>(key: string, data: T): void {
  if (typeof sessionStorage === 'undefined') return
  const rec: CacheRecord<T> = { ts: Date.now(), data }
  try {
    sessionStorage.setItem(NS + key, JSON.stringify(rec))
  } catch {}
}

export async function getCache<T>(
  key: string,
  ttlMs = DEFAULT_TTL
): Promise<T | null> {
  // Try IndexedDB first (persists across tabs and sessions)
  const idbResult = await idbGet<T>(NS + key, ttlMs)
  if (idbResult !== null) return idbResult
  // Fallback to sessionStorage
  return ssGet<T>(key, ttlMs)
}

export async function setCache<T>(key: string, data: T): Promise<void> {
  // Write to both stores for resilience
  await idbSet<T>(NS + key, data)
  ssSet<T>(key, data)
}

export function makeKey(parts: string[]): string {
  return parts.join('|')
}
