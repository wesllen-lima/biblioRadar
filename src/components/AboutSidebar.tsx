'use client'

import { useI18n } from './I18nProvider'
import { useCustomProviders } from '@/lib/useCustomProviders'
import { BookOpen, Library, Rss, Globe, Activity, Settings } from 'lucide-react'
import Link from 'next/link'

export default function AboutSidebar({
  onManageClick,
}: {
  onManageClick?: () => void
}) {
  const { t } = useI18n()
  const { providers } = useCustomProviders()

  const nativeSources = [
    { name: 'Project Gutenberg', icon: BookOpen },
    { name: 'Internet Archive', icon: Library },
    { name: 'Open Library', icon: Library },
  ]

  const totalActive = nativeSources.length + providers.length

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div>
        <h3 className="text-base font-bold text-foreground">
          {t('about.title')}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {t('about.desc')}
        </p>
      </div>

      <div className="space-y-2.5 rounded-lg border border-border/60 bg-muted/40 p-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            <Activity size={10} className="text-emerald-500" />
            {t('about.sources')}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {totalActive} online
          </span>
        </div>

        <ul className="space-y-1.5">
          {nativeSources.map((s, i) => (
            <li
              key={i}
              className="group flex items-center gap-2 text-xs text-foreground/70"
            >
              <span className="shrink-0 text-muted-foreground transition-colors group-hover:text-primary">
                <s.icon size={13} />
              </span>
              <span className="truncate">{s.name}</span>
            </li>
          ))}

          {providers.map((p, i) => {
            const displayName =
              'name' in p
                ? p.name
                : p.url.replace(/^https?:\/\//, '').split('/')[0] || 'OPDS Feed'
            return (
              <li
                key={`cust-${i}`}
                className="flex items-center gap-2 text-xs text-foreground/70"
              >
                <span className="shrink-0 text-blue-500">
                  {p.type === 'opds' ? <Rss size={13} /> : <Globe size={13} />}
                </span>
                <span className="truncate" title={displayName}>
                  {displayName}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      {onManageClick ? (
        <button
          onClick={onManageClick}
          className="btn-ghost h-8 w-full gap-2 rounded-lg border border-border/60 text-xs transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
        >
          <Settings size={12} />
          {t('providers.configure')}
        </button>
      ) : (
        <Link
          href="/settings"
          className="btn-ghost flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-border/60 text-xs transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
        >
          <Settings size={12} />
          {t('providers.configure')}
        </Link>
      )}
    </div>
  )
}
