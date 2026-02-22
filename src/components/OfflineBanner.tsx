'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { useI18n } from './I18nProvider'

export default function OfflineBanner() {
  const { t } = useI18n()
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    setOffline(!navigator.onLine)
    const onOffline = () => setOffline(true)
    const onOnline = () => setOffline(false)
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)
    return () => {
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white"
    >
      <WifiOff size={14} aria-hidden="true" />
      {t('offline.banner')}
    </div>
  )
}
