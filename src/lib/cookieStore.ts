const DAY = 24 * 60 * 60

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(
    new RegExp(
      '(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'
    )
  )
  return m ? decodeURIComponent(m[1]) : null
}

export function setCookie(
  name: string,
  value: string,
  maxAgeSec = 365 * DAY
): void {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSec}; Path=/; SameSite=Lax`
}

export function readJSONCookie<T>(name: string, fallback: T): T {
  try {
    const raw = getCookie(name)
    if (!raw) return fallback
    if (raw === '__ls__') {
      const ls =
        typeof localStorage !== 'undefined'
          ? localStorage.getItem(`ck:${name}`)
          : null
      return ls ? (JSON.parse(ls) as T) : fallback
    }
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSONCookie<T>(
  name: string,
  data: T,
  maxAgeSec = 365 * DAY
): void {
  try {
    const str = JSON.stringify(data)
    if (str.length > 3800) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`ck:${name}`, str)
        setCookie(name, '__ls__', maxAgeSec)
      }
    } else {
      setCookie(name, str, maxAgeSec)
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`ck:${name}`)
      }
    }
  } catch (e) {
    console.warn('cookieStore writeJSONCookie:', e)
  }
}
