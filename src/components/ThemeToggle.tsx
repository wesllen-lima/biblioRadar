'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useI18n } from '@/components/I18nProvider'

export default function ThemeToggle() {
  const { t } = useI18n()
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const root = document.documentElement
    const currentTheme =
      root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
    setTheme(currentTheme)
    setMounted(true)
  }, [])

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
  }

  if (!mounted) {
    return <div className="h-9 w-9" />
  }

  return (
    <button
      onClick={toggle}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95"
      title={
        theme === 'light' ? t('theme.toggle.dark') : t('theme.toggle.light')
      }
      aria-label={t('theme.toggle.label')}
    >
      <Sun
        size={18}
        className={`absolute transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${theme === 'dark' ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'} `}
      />
      <Moon
        size={18}
        className={`absolute transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${theme === 'dark' ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0'} `}
      />
    </button>
  )
}
