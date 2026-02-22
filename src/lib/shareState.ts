export function toBase64Url(input: string): string {
  const b64 =
    typeof window === 'undefined'
      ? Buffer.from(input, 'utf8').toString('base64')
      : btoa(input)
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function fromBase64Url(input: string): string {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4))
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad
  return typeof window === 'undefined'
    ? Buffer.from(b64, 'base64').toString('utf8')
    : atob(b64)
}

export function encodeState<T>(obj: T): string {
  return toBase64Url(JSON.stringify(obj))
}

export function decodeState<T>(s: string): T {
  return JSON.parse(fromBase64Url(s)) as T
}
