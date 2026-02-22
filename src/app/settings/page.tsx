'use client'

import { useI18n } from '@/components/I18nProvider'
import ProvidersManager from '@/components/ProvidersManager'
import ExternalQuick from '@/components/ExternalQuick'
import DataManagement from '@/components/DataManagement'
import P2PSync from '@/components/P2PSync'
import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowLeft,
  Settings,
  Database,
  Globe,
  HardDrive,
  Shield,
  Share2,
  Languages,
  SlidersHorizontal,
  Network,
  Smartphone,
  Palette,
} from 'lucide-react'
import { useSettings, type SearchLanguage } from '@/lib/useSettings'
import ThemeToggle from '@/components/ThemeToggle'

type SettingsSection = 'search' | 'sources' | 'data' | 'sync' | 'appearance'

const SECTIONS: {
  id: SettingsSection
  icon: React.ElementType
  labelKey: string
}[] = [
  { id: 'search', icon: SlidersHorizontal, labelKey: 'settings.search.title' },
  { id: 'sources', icon: Database, labelKey: 'settings.providers.title' },
  { id: 'data', icon: HardDrive, labelKey: 'settings.data.title' },
  { id: 'sync', icon: Smartphone, labelKey: 'settings.sync.title' },
  { id: 'appearance', icon: Palette, labelKey: 'settings.appearance.title' },
]

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
        checked ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const { t } = useI18n()
  const { settings, updateSetting } = useSettings()
  const [active, setActive] = useState<SettingsSection>('search')

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 mx-auto max-w-4xl px-4 py-8 duration-500">
      {/* Header */}
      <div className="mb-8 border-b border-border pb-6">
        <Link
          href="/"
          className="btn-ghost btn-sm mb-4 w-fit pl-0 transition-colors hover:bg-transparent hover:text-primary"
        >
          <ArrowLeft size={16} className="mr-1" />
          {t('settings.back')}
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            <Settings className="text-primary" size={28} />
            {t('settings.title')}
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('settings.subtitle')}
        </p>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Sidebar — desktop */}
        <nav
          className="hidden w-48 shrink-0 flex-col gap-1 md:flex"
          aria-label={t('settings.title')}
        >
          {SECTIONS.map(({ id, icon: Icon, labelKey }) => {
            const label = t(labelKey)
            const isActive = active === id
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all ${
                  isActive
                    ? 'border border-primary/20 bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </button>
            )
          })}

          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-start gap-2 rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
              <Shield size={14} className="mt-0.5 shrink-0 text-emerald-500" />
              <span>{t('settings.privacy.title')}</span>
            </div>
          </div>
        </nav>

        {/* Tabs — mobile */}
        <div className="no-scrollbar -mx-2 flex gap-1 overflow-x-auto px-2 pb-2 md:hidden">
          {SECTIONS.map(({ id, icon: Icon, labelKey }) => {
            const isActive = active === id
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon size={13} />
                {t(labelKey).split(' ')[0]}
              </button>
            )
          })}
        </div>

        {/* Content panel */}
        <div className="fade-blur-in min-w-0 flex-1" key={active}>
          {/* Breadcrumb */}
          <p className="mb-6 text-xs text-muted-foreground">
            {t('settings.title')} &rsaquo;{' '}
            {t(SECTIONS.find((s) => s.id === active)?.labelKey ?? '')}
          </p>

          {active === 'search' && (
            <div className="space-y-6">
              <section className="card space-y-6 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Languages size={18} className="text-primary" />
                  <h2 className="text-base font-semibold">
                    {t('settings.lang.title')}
                  </h2>
                </div>
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <p className="max-w-sm text-sm text-muted-foreground">
                    {t('settings.lang.desc')}
                  </p>
                  <select
                    value={settings.searchLanguage}
                    onChange={(e) =>
                      updateSetting(
                        'searchLanguage',
                        e.target.value as SearchLanguage
                      )
                    }
                    className="field w-full bg-background sm:w-44"
                  >
                    <option value="all">{t('settings.lang.all')}</option>
                    <option value="pt">{t('settings.lang.pt')}</option>
                    <option value="en">{t('settings.lang.en')}</option>
                    <option value="es">{t('settings.lang.es')}</option>
                  </select>
                </div>
              </section>

              <section className="card space-y-5 p-6">
                <div className="mb-2 flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-violet-500" />
                  <h2 className="text-base font-semibold">
                    {t('settings.search.title')}
                  </h2>
                </div>
                <label className="flex cursor-pointer items-start justify-between gap-4">
                  <div>
                    <span className="block text-sm font-medium text-foreground">
                      {t('settings.onlyPdf.label')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t('settings.onlyPdf.desc')}
                    </span>
                  </div>
                  <Toggle
                    checked={settings.onlyPdf}
                    onChange={(v) => updateSetting('onlyPdf', v)}
                  />
                </label>
                <div className="border-t border-border/50" />
                <label className="flex cursor-pointer items-start justify-between gap-4">
                  <div>
                    <span className="block text-sm font-medium text-foreground">
                      {t('settings.enrich.label')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t('settings.enrich.desc')}
                    </span>
                  </div>
                  <Toggle
                    checked={settings.enrichMetadata}
                    onChange={(v) => updateSetting('enrichMetadata', v)}
                  />
                </label>
              </section>
            </div>
          )}

          {active === 'sources' && (
            <div className="space-y-6">
              <section className="card p-6">
                <div className="mb-2 flex items-center gap-2">
                  <Database size={18} className="text-blue-500" />
                  <h2 className="text-base font-semibold">
                    {t('settings.providers.title')}
                  </h2>
                </div>
                <p className="mb-6 text-sm text-muted-foreground">
                  {t('settings.providers.desc')}
                </p>
                <ProvidersManager />
              </section>

              <section className="card p-6">
                <div className="mb-2 flex items-center gap-2">
                  <Globe size={18} className="text-emerald-500" />
                  <h2 className="text-base font-semibold">
                    {t('settings.external.title')}
                  </h2>
                </div>
                <div className="mb-5 flex items-start gap-3">
                  <Share2
                    className="mt-1 shrink-0 text-emerald-500"
                    size={16}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t('settings.external.desc')}
                  </p>
                </div>
                <ExternalQuick />
              </section>
            </div>
          )}

          {active === 'data' && (
            <section className="card p-6">
              <div className="mb-4 flex items-center gap-2">
                <HardDrive size={18} className="text-orange-500" />
                <h2 className="text-base font-semibold">
                  {t('settings.data.title')}
                </h2>
              </div>
              <DataManagement />
            </section>
          )}

          {active === 'sync' && (
            <div className="space-y-6">
              <section className="card p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Smartphone size={18} className="text-sky-500" />
                  <h2 className="text-base font-semibold">
                    {t('settings.sync.title')}
                  </h2>
                </div>
                <P2PSync />
              </section>

              <section className="card p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Network size={18} className="text-violet-500" />
                  <h2 className="text-base font-semibold">
                    {t('settings.graph.title')}
                  </h2>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    {t('settings.graph.desc')}
                  </p>
                  <Link
                    href="/graph"
                    className="btn-secondary btn-sm shrink-0 gap-2"
                  >
                    <Network size={14} /> {t('settings.graph.btn')}
                  </Link>
                </div>
              </section>
            </div>
          )}

          {active === 'appearance' && (
            <section className="card p-6">
              <div className="mb-6 flex items-center gap-2">
                <Palette size={18} className="text-pink-500" />
                <h2 className="text-base font-semibold">
                  {t('settings.appearance.title') || 'Appearance'}
                </h2>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t('theme.toggle.label')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('theme.toggle.dark')} / {t('theme.toggle.light')}
                  </p>
                </div>
                <ThemeToggle />
              </div>
              <div className="mt-4 border-t border-border/50 pt-4">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Shield
                    size={13}
                    className="mt-0.5 shrink-0 text-emerald-500"
                  />
                  <div>
                    <strong className="mb-1 block text-foreground">
                      {t('settings.privacy.title')}
                    </strong>
                    {t('settings.privacy.desc')}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
