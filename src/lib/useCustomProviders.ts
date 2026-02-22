'use client'

import { useState, useEffect } from 'react'
import type { CustomProvider } from '@/components/ProvidersManager'

const STORAGE_KEY = 'biblio_custom_providers'

function readProviders(): CustomProvider[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useCustomProviders() {
  const [providers, setProviders] = useState<CustomProvider[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setProviders(readProviders())
    setIsLoaded(true)

    const onUpdate = () => setProviders(readProviders())
    const onCrossTab = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      setProviders(e.newValue ? JSON.parse(e.newValue) : [])
    }

    window.addEventListener('providers-updated', onUpdate)
    window.addEventListener('storage', onCrossTab)
    return () => {
      window.removeEventListener('providers-updated', onUpdate)
      window.removeEventListener('storage', onCrossTab)
    }
  }, [])

  const saveProviders = (list: CustomProvider[]) => {
    setProviders(list)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    window.dispatchEvent(new Event('providers-updated'))
  }

  return { providers, saveProviders, isLoaded }
}
