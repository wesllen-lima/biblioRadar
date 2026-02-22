'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/components/I18nProvider'
import { Plus, Trash2, Rss, Globe, Code, Sparkles } from 'lucide-react'
import { OPDS_SUGGESTIONS } from '@/lib/recommendedSites'

export type CustomProvider =
  | { type: 'opds'; url: string; name?: string }
  | {
      type: 'scrape'
      name: string
      searchUrlTemplate: string
      itemSelector: string
      titleSelector: string
      linkSelector: string
      coverSelector?: string
      authorSelector?: string
      yearSelector?: string
    }

const STORAGE_KEY = 'biblio_custom_providers'

function readProviders(): CustomProvider[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeProviders(list: CustomProvider[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  window.dispatchEvent(new Event('providers-updated'))
}

function isValidHttpUrl(s: string) {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export default function ProvidersManager({
  onChange,
}: {
  onChange?: (arr: CustomProvider[]) => void
}) {
  const { t } = useI18n()
  const [tab, setTab] = useState<'opds' | 'scraper'>('opds')
  const [providers, setProviders] = useState<CustomProvider[]>([])

  const [opdsUrl, setOpdsUrl] = useState('')
  const [opdsErr, setOpdsErr] = useState('')

  const [scrName, setScrName] = useState('')
  const [scrUrl, setScrUrl] = useState('')
  const [scrRoot, setScrRoot] = useState('')
  const [scrTitle, setScrTitle] = useState('')
  const [scrHref, setScrHref] = useState('')
  const [scrCover, setScrCover] = useState('')
  const [scrAuthor, setScrAuthor] = useState('')
  const [scrYear, setScrYear] = useState('')
  const [scrErrUrl, setScrErrUrl] = useState('')
  const [scrErrReq, setScrErrReq] = useState('')

  useEffect(() => {
    const initial = readProviders()
    setProviders(initial)
    onChange?.(initial)
  }, [onChange])

  const updateProviders = (list: CustomProvider[]) => {
    setProviders(list)
    writeProviders(list)
    onChange?.(list)
  }

  const addOpds = () => {
    const url = opdsUrl.trim()
    const ok = isValidHttpUrl(url)
    if (!ok) {
      setOpdsErr(t('pm.err.url'))
      setTimeout(() => setOpdsErr(''), 3000)
      return
    }
    if (providers.some((p) => p.type === 'opds' && p.url === url)) return

    const name = url.replace(/^https?:\/\//, '').split('/')[0]
    updateProviders([{ type: 'opds', url, name }, ...providers])
    setOpdsUrl('')
    setOpdsErr('')
  }

  const addScraper = () => {
    const name = scrName.trim()
    const url = scrUrl.trim()
    const hasRequired = scrRoot.trim() && scrTitle.trim() && scrHref.trim()
    const urlOk = isValidHttpUrl(url)
    if (!urlOk) {
      setScrErrUrl(t('pm.err.nameUrl'))
      setTimeout(() => setScrErrUrl(''), 3000)
    }
    if (!hasRequired) {
      setScrErrReq(t('pm.err.selectors'))
      setTimeout(() => setScrErrReq(''), 3000)
    }
    if (!urlOk || !hasRequired || !name) return

    const cfg: CustomProvider = {
      type: 'scrape',
      name,
      searchUrlTemplate: url,
      itemSelector: scrRoot.trim(),
      titleSelector: scrTitle.trim(),
      linkSelector: scrHref.trim(),
      coverSelector: scrCover.trim() || undefined,
      authorSelector: scrAuthor.trim() || undefined,
      yearSelector: scrYear.trim() || undefined,
    }
    if (providers.some((p) => p.type === 'scrape' && p.name === name)) return
    updateProviders([cfg, ...providers])
    setScrName('')
    setScrUrl('')
    setScrRoot('')
    setScrTitle('')
    setScrHref('')
    setScrCover('')
    setScrAuthor('')
    setScrYear('')
    setScrErrUrl('')
    setScrErrReq('')
  }

  const removeAt = (i: number) =>
    updateProviders(providers.filter((_, idx) => idx !== i))

  const opdsDisabled = !isValidHttpUrl(opdsUrl.trim())
  const scrDisabled =
    !scrName.trim() ||
    !isValidHttpUrl(scrUrl.trim()) ||
    !scrRoot.trim() ||
    !scrTitle.trim() ||
    !scrHref.trim()

  return (
    <section className="space-y-6">
      <div className="flex w-fit rounded-lg bg-muted/50 p-1">
        <button
          type="button"
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${tab === 'opds' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setTab('opds')}
        >
          {t('pm.tab.opds')}
        </button>
        <button
          type="button"
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${tab === 'scraper' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setTab('scraper')}
        >
          {t('pm.tab.scraper')}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-5">
        {tab === 'opds' ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t('pm.opds.label')}
              </label>
              <div className="flex gap-2">
                <input
                  value={opdsUrl}
                  onChange={(e) => {
                    setOpdsUrl(e.target.value)
                    if (opdsErr) setOpdsErr('')
                  }}
                  onBlur={() => {
                    if (!isValidHttpUrl(opdsUrl.trim()))
                      setOpdsErr(t('pm.err.url'))
                  }}
                  placeholder="https://exemplo.com/opds/feed.xml"
                  className={`field flex-1 ${opdsErr ? 'border-red-500 focus-visible:border-red-500' : ''}`}
                />
                <button
                  onClick={addOpds}
                  disabled={opdsDisabled}
                  className="btn-primary"
                >
                  {t('pm.opds.add')}
                </button>
              </div>
              {opdsErr && (
                <p className="mt-1.5 text-xs text-red-600">{opdsErr}</p>
              )}
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Rss size={12} />
              {t('pm.opds.hint')}
            </p>

            {/* OPDS suggestions — renders results INSIDE BiblioRadar */}
            <div className="border-t border-border/50 pt-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                <Sparkles size={11} className="text-primary" />
                {t('pm.opds.suggestions')}
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                {t('pm.opds.suggestions.hint')}
              </p>
              <div className="grid gap-2">
                {OPDS_SUGGESTIONS.map((feed) => {
                  const alreadyAdded = providers.some(
                    (p) => p.type === 'opds' && p.url === feed.url
                  )
                  return (
                    <div
                      key={feed.url}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2 transition-colors hover:bg-muted/30"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {feed.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground opacity-70">
                          {feed.desc}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (!alreadyAdded) {
                            const name = feed.url
                              .replace(/^https?:\/\//, '')
                              .split('/')[0]
                            updateProviders([
                              { type: 'opds', url: feed.url, name },
                              ...providers,
                            ])
                          }
                        }}
                        disabled={alreadyAdded}
                        className={`ml-3 shrink-0 rounded border px-2 py-1 text-xs transition-colors ${
                          alreadyAdded
                            ? 'cursor-default border-border text-muted-foreground opacity-50'
                            : 'border-primary/40 text-primary hover:bg-primary/10'
                        }`}
                      >
                        {alreadyAdded ? (
                          t('pm.opds.already_added')
                        ) : (
                          <Plus size={14} />
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={scrName}
                onChange={(e) => setScrName(e.target.value)}
                placeholder={t('pm.scr.name')}
                className="field"
              />
              <input
                value={scrUrl}
                onChange={(e) => {
                  setScrUrl(e.target.value)
                  if (scrErrUrl) setScrErrUrl('')
                }}
                onBlur={() => {
                  if (!isValidHttpUrl(scrUrl.trim()))
                    setScrErrUrl(t('pm.err.nameUrl'))
                }}
                placeholder={t('pm.scr.url')}
                className={`field ${scrErrUrl ? 'border-red-500' : ''}`}
              />
            </div>
            {scrErrUrl && <p className="text-xs text-red-600">{scrErrUrl}</p>}

            <div className="space-y-3 rounded-lg border border-border bg-background p-4">
              <h4 className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                <Code size={12} /> {t('pm.css.required')}
              </h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  value={scrRoot}
                  onChange={(e) => setScrRoot(e.target.value)}
                  placeholder="Item Raiz (ex: .book-card)"
                  className="field"
                />
                <input
                  value={scrTitle}
                  onChange={(e) => setScrTitle(e.target.value)}
                  placeholder="Título (ex: h3 > a)"
                  className="field"
                />
                <input
                  value={scrHref}
                  onChange={(e) => setScrHref(e.target.value)}
                  placeholder="Link (ex: a.download)"
                  className="field"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-background p-4">
              <h4 className="mb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                {t('pm.optional')}
              </h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  value={scrCover}
                  onChange={(e) => setScrCover(e.target.value)}
                  placeholder="Capa (img src)"
                  className="field"
                />
                <input
                  value={scrAuthor}
                  onChange={(e) => setScrAuthor(e.target.value)}
                  placeholder="Autor (ex: .author)"
                  className="field"
                />
                <input
                  value={scrYear}
                  onChange={(e) => setScrYear(e.target.value)}
                  placeholder="Ano"
                  className="field"
                />
              </div>
            </div>

            {scrErrReq && <p className="text-xs text-red-600">{scrErrReq}</p>}

            <button
              onClick={addScraper}
              disabled={scrDisabled}
              className="btn-primary w-full sm:w-auto"
            >
              <Plus size={16} />
              {t('pm.scr.add')}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">
          {t('pm.active')} ({providers.length})
        </h4>
        {providers.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">{t('pm.none')}</p>
        ) : (
          <div className="grid gap-2">
            {providers.map((p, i) => (
              <div
                key={`${p.type}:${i}`}
                className="group flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-sm transition-colors hover:border-primary/30"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${p.type === 'opds' ? 'bg-orange-500/10 text-orange-600' : 'bg-blue-500/10 text-blue-600'}`}
                  >
                    {p.type === 'opds' ? (
                      <Rss size={16} />
                    ) : (
                      <Globe size={16} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {p.type === 'opds' ? p.name || 'Feed OPDS' : p.name}
                      </p>
                      <span className="rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground uppercase">
                        {p.type}
                      </span>
                    </div>
                    <p className="truncate font-mono text-xs text-muted-foreground opacity-70">
                      {p.type === 'opds' ? p.url : p.searchUrlTemplate}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeAt(i)}
                  className="btn-icon text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={t('common.remove')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
