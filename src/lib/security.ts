import 'server-only'

// Bloqueia acesso a redes locais e metadados de nuvem (AWS/GCP/Vercel)
const BLOCKED_RANGES = [
  /^127\./, // Localhost IPv4
  /^10\./, // Private Class A
  /^172\.(1[6-9]|2\d|3[0-1])\./, // Private Class B
  /^192\.168\./, // Private Class C
  /^0\.0\.0\.0/, // Any
  /^169\.254\./, // Link-local (Cloud metadata)
  /^::1$/, // Localhost IPv6
  /^fc00:/, // Unique Local IPv6
  /^fe80:/, // Link-local IPv6
]

const BLOCKED_HOSTNAMES = ['localhost', 'metadata.google.internal']

export function isSafeUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr)

    // 1. Permitir apenas HTTP/HTTPS
    if (!['http:', 'https:'].includes(url.protocol)) return false

    const hostname = url.hostname.toLowerCase()

    // 2. Bloqueio por Hostname Explicito
    if (BLOCKED_HOSTNAMES.includes(hostname)) return false

    // 3. Bloqueio por Padrão de IP (Regex simples para evitar dependências pesadas)
    // Nota: Isso não previne DNS Rebinding sofisticado, mas resolve alertas básicos de segurança.
    if (BLOCKED_RANGES.some((regex) => regex.test(hostname))) return false

    return true
  } catch {
    return false
  }
}
