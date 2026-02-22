const CACHE_NAME = 'biblioradar-v1'
const COVER_CACHE = 'biblioradar-covers-v1'
const COVER_LIMIT = 100

const PRECACHE = ['/', '/manifest.json']

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  const keep = [CACHE_NAME, COVER_CACHE]
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  )
})

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // Skip cross-origin (except cover images from openlibrary / archive.org)
  const isCoverHost =
    url.hostname === 'covers.openlibrary.org' ||
    url.hostname === 'archive.org' ||
    url.hostname.endsWith('.archive.org')

  if (url.origin !== self.location.origin && !isCoverHost) return

  // ── Cover images: stale-while-revalidate with LRU limit ──
  if (isCoverHost || url.pathname.match(/\.(jpg|jpeg|webp|png)$/)) {
    e.respondWith(coverStrategy(req))
    return
  }

  // ── API routes: network-first, no cache ──
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(req).catch(
        () =>
          new Response(JSON.stringify({ error: 'offline', results: [] }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          })
      )
    )
    return
  }

  // ── App shell / pages: network-first with cache fallback ──
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(req, clone))
        }
        return res
      })
      .catch(() => caches.match(req))
  )
})

// ── Cover strategy: cache-first + async LRU eviction ─────────────────────────
async function coverStrategy(req) {
  const cached = await caches.match(req)
  if (cached) return cached

  try {
    const res = await fetch(req)
    if (res.ok) {
      const cache = await caches.open(COVER_CACHE)
      await evictCoversIfNeeded(cache)
      cache.put(req, res.clone())
    }
    return res
  } catch {
    return cached || Response.error()
  }
}

async function evictCoversIfNeeded(cache) {
  const keys = await cache.keys()
  if (keys.length >= COVER_LIMIT) {
    // Remove oldest entries (first in, first out)
    const toDelete = keys.slice(0, keys.length - COVER_LIMIT + 1)
    await Promise.all(toDelete.map((k) => cache.delete(k)))
  }
}
