'use client'

import { useEffect, useState } from 'react'
import { Globe, Search, ArrowUpRight } from 'lucide-react'
import { useI18n } from '@/components/I18nProvider'
import { useSettings } from '@/lib/useSettings'
import { getSmartUrl, getFaviconUrl } from '@/lib/smartLinks'
/* eslint-disable @next/next/no-img-element */

type Site = { name: string; url: string }

const DEFAULT_SITES: Site[] = [
  {
    name: 'Google Scholar',
    url: 'https://scholar.google.com.br/scholar?q={query}',
  },
  { name: 'SciELO', url: 'https://search.scielo.org/?q={query}&lang=pt' },
  {
    name: 'Google Books',
    url: 'https://www.google.com/search?tbm=bks&q={query}',
  },
  {
    name: 'Internet Archive',
    url: 'https://archive.org/search.php?query={query}',
  },
  { name: "Anna's Archive", url: 'https://annas-archive.org/search?q={query}' },
]

export default function ExternalSites({
  currentQuery,
}: {
  currentQuery: string
  onManageClick?: () => void
}) {
  const {} = useI18n()
  const { settings } = useSettings()
  const [sites, setSites] = useState<Site[]>([])
  const [, setIsUsingDefaults] = useState(false)

  useEffect(() => {
    const load = () => {
      try {
        const saved = localStorage.getItem('biblio_external_sites')
        if (saved && JSON.parse(saved).length > 0) {
          setSites(JSON.parse(saved))
          setIsUsingDefaults(false)
        } else {
          setSites(DEFAULT_SITES)
          setIsUsingDefaults(true)
        }
      } catch {
        setSites(DEFAULT_SITES)
      }
    }
    load()
    window.addEventListener('external-sites-updated', load)
    return () => window.removeEventListener('external-sites-updated', load)
  }, [])

  if (!currentQuery.trim()) return null

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 mt-12 border-t border-border pt-8">
      <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Search size={20} className="text-primary" />
            Busca Profunda (Web)
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Pesquisar &quot;<strong>{currentQuery}</strong>&quot; diretamente
            nas fontes originais:
          </p>
        </div>

        {settings.searchLanguage !== 'all' && (
          <span className="rounded border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-bold tracking-wide text-primary uppercase">
            Filtro: {settings.searchLanguage}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {sites.map((site, i) => {
          const smartUrl = getSmartUrl(
            site.url,
            currentQuery,
            settings.searchLanguage
          )
          const iconUrl = getFaviconUrl(site.url)

          return (
            <a
              key={i}
              href={smartUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center gap-3 rounded-xl border border-border bg-card p-3 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
            >
              <div className="h-10 w-10 shrink-0 rounded-lg border border-border bg-muted/50 p-1.5 transition-colors group-hover:border-primary/20">
                <img
                  src={iconUrl}
                  alt=""
                  className="h-full w-full object-contain opacity-80 transition-opacity group-hover:opacity-100"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove(
                      'hidden'
                    )
                  }}
                />
                <div className="hidden h-full w-full items-center justify-center text-muted-foreground">
                  <Globe size={16} />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                    {site.name}
                  </span>
                  <ArrowUpRight
                    size={10}
                    className="text-muted-foreground opacity-50 transition-all group-hover:text-primary group-hover:opacity-100"
                  />
                </div>

                <span className="block truncate font-mono text-[11px] text-muted-foreground opacity-70 group-hover:opacity-100">
                  {/* Safe URL parse */}
                  {(() => {
                    try {
                      return new URL(smartUrl).hostname.replace('www.', '')
                    } catch {
                      return ''
                    }
                  })()}
                </span>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
