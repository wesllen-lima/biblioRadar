'use client'
import { useEffect, useState } from 'react'
import { setCookie, getCookie } from '@/lib/cookieStore'
import { useI18n } from '@/components/I18nProvider'
import { Shield, X, Lock } from 'lucide-react'

export default function CookieConsent() {
  const [show, setShow] = useState(false)
  const [visible, setVisible] = useState(false)
  const { t } = useI18n()

  useEffect(() => {
    const ok = getCookie('br_cookie_consent')
    if (!ok) {
      setShow(true)
      // Small delay so the slide-in animation is visible
      const id = setTimeout(() => setVisible(true), 100)
      return () => clearTimeout(id)
    }
  }, [])

  function dismiss() {
    setVisible(false)
    setTimeout(() => setShow(false), 300)
  }

  function accept() {
    setCookie('br_cookie_consent', 'v1')
    setCookie('br_store', 'cookie')
    dismiss()
  }

  if (!show) return null

  return (
    <div
      className={`fixed right-0 bottom-0 left-0 z-[60] px-3 pb-3 transition-all duration-300 sm:right-4 sm:bottom-4 sm:left-auto sm:max-w-sm sm:px-0 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
      // On mobile sits above BottomNav (56px = h-14)
      style={{
        paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-title"
    >
      {/* Extra bottom spacing on mobile for BottomNav */}
      <div className="h-14 sm:hidden" aria-hidden />

      <div className="glass relative overflow-hidden rounded-2xl border border-border/60 shadow-[0_8px_32px_hsl(0_0%_0%/0.18)]">
        {/* Top accent bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-primary via-violet-500 to-primary" />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/15">
              <Shield size={18} className="text-emerald-500" />
            </div>

            <div className="min-w-0 flex-1 pr-6">
              <h2
                id="cookie-title"
                className="text-sm leading-tight font-bold text-foreground"
              >
                {t('cookies.title')}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t('cookies.desc')}
              </p>
            </div>

            <button
              onClick={dismiss}
              className="btn-icon absolute top-3 right-3 h-7 w-7 text-muted-foreground"
              aria-label={t('action.close')}
            >
              <X size={14} />
            </button>
          </div>

          {/* Privacy badge */}
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <Lock size={10} />
            {t('cookies.privacy')}
          </div>

          {/* Actions */}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={dismiss}
              className="btn-ghost btn-sm h-8 px-3 text-xs"
            >
              {t('cookies.later')}
            </button>
            <button
              onClick={accept}
              className="btn-brand btn-sm h-8 px-4 text-xs"
            >
              {t('cookies.ok')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
