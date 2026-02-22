import type { SearchLanguage } from './useSettings'

const DOMAIN_RULES: Record<
  string,
  (url: string, lang: SearchLanguage) => string
> = {
  'google.com': (url, lang) => {
    if (lang === 'all') return url
    return `${url}&lr=lang_${lang}`
  },
  'scholar.google': (url, lang) => {
    if (lang === 'all') return url
    return `${url}&hl=${lang}&lr=lang_${lang}`
  },
  'scielo.org': (url, lang) => {
    if (lang === 'all') return url
    return url.replace('&lang=pt', '').replace('&lang=en', '') + `&lang=${lang}`
  },
  'youtube.com': (url, lang) => {
    if (lang === 'pt') return url.replace('search_query=', 'search_query=pt+')
    return url
  },
}

export function getSmartUrl(
  template: string,
  query: string,
  lang: SearchLanguage
): string {
  let finalUrl = template
  const q = encodeURIComponent(query)

  if (finalUrl.includes('{raw}')) finalUrl = finalUrl.replace('{raw}', query)
  else if (finalUrl.includes('{plus}'))
    finalUrl = finalUrl.replace('{plus}', query.trim().replace(/\s+/g, '+'))
  else if (finalUrl.includes('{query}'))
    finalUrl = finalUrl.replace('{query}', q)
  else finalUrl = `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}q=${q}`

  if (lang !== 'all') {
    try {
      const hostname = new URL(finalUrl).hostname
      const key = Object.keys(DOMAIN_RULES).find((k) => hostname.includes(k))
      if (key) {
        finalUrl = DOMAIN_RULES[key](finalUrl, lang)
      }
    } catch {}
  }

  return finalUrl
}

export function getFaviconUrl(urlStr: string): string {
  try {
    const domain = new URL(urlStr).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    return ''
  }
}
