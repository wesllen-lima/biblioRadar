'use client'

import { useI18n } from '@/components/I18nProvider'
import type { Locale } from '@/lib/i18n'
import { Globe } from 'lucide-react'

const CYCLE: Locale[] = ['pt-BR', 'en', 'es']

const LABELS: Record<Locale, string> = {
  'pt-BR': 'PT',
  en: 'EN',
  es: 'ES',
}

export default function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n()

  const next = () => {
    const idx = CYCLE.indexOf(locale)
    setLocale(CYCLE[(idx + 1) % CYCLE.length])
  }

  return (
    <button
      onClick={next}
      className="group relative flex h-9 min-w-[52px] items-center justify-center gap-1.5 rounded-full border border-transparent bg-transparent px-2 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
      title={t('lang.change')}
      aria-label={t('lang.current', { lang: LABELS[locale] })}
    >
      <Globe
        size={14}
        className="transition-transform duration-500 group-hover:rotate-180"
      />
      <span className="font-mono font-bold">{LABELS[locale]}</span>
    </button>
  )
}
