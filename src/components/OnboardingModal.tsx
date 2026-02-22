'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Database, Share2, X } from 'lucide-react'
import { useI18n } from './I18nProvider'

const STORAGE_KEY = 'br_onboarded'

export default function OnboardingModal() {
  const { t } = useI18n()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {}
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {}
    setVisible(false)
  }

  if (!visible) return null

  const features = [
    {
      icon: <BookOpen size={18} className="mt-0.5 shrink-0 text-primary" />,
      text: t('onboarding.f1'),
    },
    {
      icon: <Database size={18} className="mt-0.5 shrink-0 text-primary" />,
      text: t('onboarding.f2'),
    },
    {
      icon: <Share2 size={18} className="mt-0.5 shrink-0 text-primary" />,
      text: t('onboarding.f3'),
    },
  ]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div
        className="scale-in w-full max-w-md rounded-2xl border border-border bg-card"
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal-700 text-primary-foreground shadow-md shadow-primary/30">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
                BiblioRadar
              </p>
              <h2
                id="onboarding-title"
                className="text-lg leading-tight font-bold text-foreground"
              >
                {t('onboarding.title')}
              </h2>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="btn-icon h-8 w-8 text-muted-foreground"
            aria-label={t('action.close')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Features */}
        <div className="space-y-3 px-5 pb-5">
          {features.map((f, i) => (
            <div key={i} className="surface flex gap-3 rounded-xl p-3">
              {f.icon}
              <p className="text-sm leading-snug text-foreground">{f.text}</p>
            </div>
          ))}

          <button
            onClick={dismiss}
            className="btn-brand mt-2 h-11 w-full text-sm font-semibold"
          >
            {t('onboarding.cta')} →
          </button>
        </div>
      </div>
    </div>
  )
}
