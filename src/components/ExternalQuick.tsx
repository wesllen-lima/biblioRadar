'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Globe, BookOpen } from 'lucide-react'
import { useI18n } from '@/components/I18nProvider'
import { RECOMMENDED_SITES } from '@/lib/recommendedSites'
import { toast } from 'sonner'

type Site = { name: string; url: string }

const CATEGORY_LABELS: Record<string, string> = {
  academic: 'Acadêmico',
  books: 'Livros',
  legal: 'Legal',
  science: 'Ciência',
}

export default function ExternalQuick() {
  const { t } = useI18n()
  const [sites, setSites] = useState<Site[]>([])
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('biblio_external_sites')
      if (saved) setSites(JSON.parse(saved))
    } catch {}
  }, [])

  const save = (newSites: Site[]) => {
    setSites(newSites)
    localStorage.setItem('biblio_external_sites', JSON.stringify(newSites))
    window.dispatchEvent(new Event('external-sites-updated'))
  }

  const add = () => {
    const trimName = name.trim()
    const trimUrl = url.trim()
    if (!trimName || !trimUrl.startsWith('http')) return
    if (sites.some((s) => s.url === trimUrl)) return
    save([...sites, { name: trimName, url: trimUrl }])
    setName('')
    setUrl('')
    toast.success(t('ext.added'))
  }

  const remove = (index: number) => {
    save(sites.filter((_, i) => i !== index))
    toast(t('ext.removed'), { icon: '🗑️' })
  }

  const addRecommended = () => {
    const newSites = [...sites]
    let count = 0
    RECOMMENDED_SITES.forEach((rec) => {
      if (!newSites.some((s) => s.url === rec.url)) {
        newSites.push({ name: rec.name, url: rec.url })
        count++
      }
    })
    if (count > 0) {
      save(newSites)
      toast.success(`${count} ${t('ext.added')}`)
    } else {
      toast.info(t('pm.opds.already_added'))
    }
  }

  const isAdded = (siteUrl: string) => sites.some((s) => s.url === siteUrl)

  return (
    <div className="space-y-6">
      {/* Active list */}
      {sites.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-8 text-muted-foreground">
          <Globe size={28} className="mb-3 opacity-40" />
          <p className="mb-4 text-sm">{t('ext.quick.none')}</p>
          <button onClick={addRecommended} className="btn-outline btn-sm gap-2">
            <Plus size={14} />
            {t('ext.quick.add_suggested')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-2">
            {sites.map((site, i) => {
              let hostname = ''
              try {
                hostname = new URL(site.url).hostname.replace('www.', '')
              } catch {}
              return (
                <div
                  key={i}
                  className="group flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-sm transition-colors hover:border-primary/30"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Globe size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {site.name}
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground opacity-70">
                        {hostname}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => remove(i)}
                    className="btn-icon shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title={t('common.remove')}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            })}
          </div>
          <button
            onClick={addRecommended}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus size={12} />
            {t('ext.quick.reload')}
          </button>
        </div>
      )}

      {/* Suggestions */}
      <div className="space-y-2">
        <h4 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">
          <BookOpen size={12} />
          Sugestões por categoria
        </h4>
        <div className="grid gap-1.5">
          {RECOMMENDED_SITES.map((rec, i) => {
            const added = isAdded(rec.url)
            let hostname = ''
            try {
              hostname = new URL(rec.url).hostname.replace('www.', '')
            } catch {}
            return (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2 transition-colors hover:bg-muted/40"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 rounded border border-border/50 bg-muted px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    {CATEGORY_LABELS[rec.category] ?? rec.category}
                  </span>
                  <span className="truncate text-sm font-medium text-foreground">
                    {rec.name}
                  </span>
                  <span className="hidden truncate font-mono text-[11px] text-muted-foreground opacity-60 sm:block">
                    {hostname}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (!added) {
                      save([...sites, { name: rec.name, url: rec.url }])
                      toast.success(t('ext.added'))
                    }
                  }}
                  disabled={added}
                  className={`ml-2 shrink-0 rounded border px-2 py-1 text-xs transition-colors ${
                    added
                      ? 'cursor-default border-border text-muted-foreground opacity-50'
                      : 'border-primary/40 text-primary hover:bg-primary/10'
                  }`}
                >
                  {added ? t('pm.opds.already_added') : '+ ' + t('ext.add')}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add custom */}
      <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-5">
        <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Plus size={16} className="text-primary" />
          {t('ext.add.custom')}
        </h4>
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
          <input
            className="field bg-background"
            placeholder={t('ext.namePh')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <input
            className="field bg-background"
            placeholder={t('ext.urlPh')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button
            onClick={add}
            disabled={!name.trim() || !url.trim().startsWith('http')}
            className="btn-primary w-full sm:w-auto"
          >
            {t('ext.add')}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{t('ext.quick.tip')}</p>
      </div>
    </div>
  )
}
