'use client'

import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import { useI18n } from './I18nProvider'

const STORAGE_KEY = 'br_pwa_dismissed'

type Platform = 'android' | 'ios' | null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

export default function PWAInstallBanner() {
  const { t } = useI18n()
  const [platform, setPlatform] = useState<Platform>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Already installed or dismissed — don't show
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      localStorage.getItem(STORAGE_KEY)
    ) return

    const ua = navigator.userAgent
    const isIOS = /iphone|ipad|ipod/i.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream
    const isAndroid = /android/i.test(ua)

    if (isIOS) {
      // iOS doesn't fire beforeinstallprompt — show manual instructions after delay
      setPlatform('ios')
      const tid = setTimeout(() => setVisible(true), 3000)
      return () => clearTimeout(tid)
    }

    if (isAndroid) {
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e as BeforeInstallPromptEvent)
        setPlatform('android')
        const tid = setTimeout(() => setVisible(true), 2000)
        return () => clearTimeout(tid)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  const install = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
    setDeferredPrompt(null)
  }

  if (!visible || !platform) return null

  return (
    <div
      className="fixed right-3 left-3 z-40 sm:hidden"
      style={{
        bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px) + 0.5rem)',
      }}
    >
      <div
        className="glass flex items-center gap-3 rounded-2xl border border-primary/20 bg-card/95 p-3 shadow-xl"
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        {/* App icon */}
        <img
          src="/icon-192.png"
          alt="BiblioRadar"
          className="h-10 w-10 shrink-0 rounded-xl"
        />

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{t('pwa.install')}</p>
          {platform === 'android' ? (
            <p className="text-xs text-muted-foreground">{t('pwa.desc')}</p>
          ) : (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              {t('pwa.ios.desc.before')}
              <Share size={11} className="inline shrink-0 text-primary" />
              {t('pwa.ios.desc.after')}
            </p>
          )}
        </div>

        {/* Actions */}
        {platform === 'android' ? (
          <button onClick={install} className="btn-brand btn-sm shrink-0 gap-1.5">
            <Download size={14} />
            {t('pwa.cta')}
          </button>
        ) : null}

        <button
          onClick={dismiss}
          className="btn-icon h-8 w-8 shrink-0 text-muted-foreground"
          aria-label={t('action.close')}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
