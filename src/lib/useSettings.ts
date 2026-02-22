'use client'

import { useState, useEffect } from 'react'

export type SearchLanguage = 'all' | 'pt' | 'en' | 'es'

const STORAGE_KEY = 'biblio_settings'

type Settings = {
  searchLanguage: SearchLanguage
  onlyPdf: boolean
  enrichMetadata: boolean
}

const DEFAULT_SETTINGS: Settings = {
  searchLanguage: 'all',
  onlyPdf: false,
  enrichMetadata: true,
}

function readFromStorage(): Settings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setSettings(readFromStorage())
    setIsLoaded(true)

    const onSameTab = () => setSettings(readFromStorage())
    const onCrossTab = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      setSettings(
        e.newValue
          ? { ...DEFAULT_SETTINGS, ...JSON.parse(e.newValue) }
          : DEFAULT_SETTINGS
      )
    }

    window.addEventListener('settings-updated', onSameTab)
    window.addEventListener('storage', onCrossTab)
    return () => {
      window.removeEventListener('settings-updated', onSameTab)
      window.removeEventListener('storage', onCrossTab)
    }
  }, [])

  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event('settings-updated'))
  }

  return { settings, updateSetting, isLoaded }
}
