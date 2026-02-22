'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { encodeState, decodeState } from '@/lib/shareState'
import { useI18n } from '@/components/I18nProvider'
import type { CustomProvider } from '@/components/ProvidersManager'

type ExternalSite = { name: string; template: string }

type SharedConfig = {
  version: number
  providers: CustomProvider[]
  externalSites: ExternalSite[]
}

function readExternalSites(): ExternalSite[] {
  try {
    const raw = localStorage.getItem('external_sites_v2')
    return raw ? (JSON.parse(raw) as ExternalSite[]) : []
  } catch {
    return []
  }
}

export default function ConfigShare({
  providers,
  onApply,
  onRemountExternal,
  onRemountProviders,
}: {
  providers: CustomProvider[]
  onApply: (next: {
    providers: CustomProvider[]
    externalSites: ExternalSite[]
  }) => void
  onRemountExternal: () => void
  onRemountProviders: () => void
}) {
  const { t } = useI18n()
  const [pendingText, setPendingText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const toObject = useMemo<SharedConfig>(() => {
    const externalSites = readExternalSites()
    return { version: 2, providers, externalSites }
  }, [providers])

  const applyFromObject = useCallback(
    async (obj: SharedConfig) => {
      const ext = Array.isArray(obj.externalSites) ? obj.externalSites : []
      const prov = Array.isArray(obj.providers) ? obj.providers : []
      try {
        localStorage.setItem('external_sites_v2', JSON.stringify(ext))
      } catch {}
      try {
        localStorage.setItem('custom_providers_v2', JSON.stringify(prov))
      } catch {}
      onApply({ providers: prov, externalSites: ext })
      onRemountExternal()
      onRemountProviders()
    },
    [onApply, onRemountExternal, onRemountProviders]
  )

  async function copyLink() {
    const hash = encodeState(toObject)
    const url = `${location.origin}${location.pathname}#brcfg=${hash}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {}
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(toObject, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'biblioRadar-config.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(a.href)
  }

  function importFromText() {
    try {
      const obj = JSON.parse(pendingText) as SharedConfig
      applyFromObject(obj)
      setPendingText('')
    } catch {}
  }

  function openFileDialog() {
    fileRef.current?.click()
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result)) as SharedConfig
        applyFromObject(obj)
      } catch {}
    }
    reader.readAsText(f)
    e.currentTarget.value = ''
  }

  useEffect(() => {
    const m = location.hash.match(/#brcfg=([^&]+)/i)
    if (!m) return
    try {
      const obj = decodeState<SharedConfig>(m[1])
      applyFromObject(obj)
    } catch {}
  }, [applyFromObject])

  return (
    <section className="panel">
      <h3 className="mb-2 font-semibold">{t('cfg.title')}</h3>
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-ghost btn-sm" onClick={downloadJson}>
          {t('cfg.export')}
        </button>
        <button className="btn-ghost btn-sm" onClick={copyLink}>
          {t('cfg.copyLink')}
        </button>
        <button className="btn-ghost btn-sm" onClick={openFileDialog}>
          {t('cfg.importFile')}
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={onFile}
      />
      <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
        <input
          value={pendingText}
          onChange={(e) => setPendingText(e.target.value)}
          placeholder={t('cfg.pastePlaceholder')}
          className="field"
        />
        <button className="btn-primary btn-sm" onClick={importFromText}>
          {t('cfg.apply')}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">{t('cfg.desc')}</p>
    </section>
  )
}
