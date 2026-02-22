'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Home,
  Library,
  Settings,
  Moon,
  Sun,
  BookOpen,
  X,
  Clock,
} from 'lucide-react'
import { useI18n } from '@/components/I18nProvider'
import { getSearchHistory } from '@/lib/history'

type Action = {
  id: string
  label: string
  shortcut?: string
  icon: React.ReactNode
  onSelect: () => void
}

let globalOpen: (() => void) | null = null
let globalClose: (() => void) | null = null

export function openCommandPalette() {
  globalOpen?.()
}

export function closeCommandPalette() {
  globalClose?.()
}

export default function CommandPalette() {
  const { t } = useI18n()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setActiveIdx(0)
  }, [])

  const doOpen = useCallback(() => {
    setRecentSearches(getSearchHistory().slice(0, 5))
    setOpen(true)
  }, [])

  // Register global handlers
  useEffect(() => {
    globalOpen = doOpen
    globalClose = close
    return () => {
      globalOpen = null
      globalClose = null
    }
  }, [doOpen, close])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Global keyboard shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.key === 'k' && (e.metaKey || e.ctrlKey)) ||
        (e.key === '/' &&
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA')
      ) {
        e.preventDefault()
        if (open) close()
        else doOpen()
      }
      if (e.key === 'Escape' && open) close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close, doOpen])

  const toggleTheme = () => {
    const root = document.documentElement
    const current =
      root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
    const next = current === 'dark' ? 'light' : 'dark'
    root.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
    close()
  }

  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'dark'

  const actions: Action[] = [
    {
      id: 'home',
      label: t('nav.home'),
      shortcut: 'G H',
      icon: <Home size={16} />,
      onSelect: () => {
        router.push('/')
        close()
      },
    },
    {
      id: 'library',
      label: t('nav.library'),
      shortcut: 'G L',
      icon: <Library size={16} />,
      onSelect: () => {
        router.push('/library')
        close()
      },
    },
    {
      id: 'settings',
      label: t('nav.settings'),
      shortcut: 'G S',
      icon: <Settings size={16} />,
      onSelect: () => {
        router.push('/settings')
        close()
      },
    },
    {
      id: 'theme',
      label: isDark ? t('theme.toggle.light') : t('theme.toggle.dark'),
      shortcut: '⌘ D',
      icon: isDark ? <Sun size={16} /> : <Moon size={16} />,
      onSelect: toggleTheme,
    },
  ]

  const filtered = query.trim()
    ? actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
    : actions

  const recentFiltered = query.trim()
    ? recentSearches.filter((s) =>
        s.toLowerCase().includes(query.toLowerCase())
      )
    : recentSearches

  const totalItems = recentFiltered.length + filtered.length

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => (i + 1) % totalItems)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => (i - 1 + totalItems) % totalItems)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx < recentFiltered.length) {
        const term = recentFiltered[activeIdx]
        router.push(`/?q=${encodeURIComponent(term)}`)
        close()
      } else {
        const action = filtered[activeIdx - recentFiltered.length]
        action?.onSelect()
      }
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      onClick={close}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="glass scale-in relative w-full max-w-xl overflow-hidden rounded-2xl"
        style={{ boxShadow: 'var(--shadow-modal)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <Search size={18} className="shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIdx(0)
            }}
            onKeyDown={handleKey}
            placeholder={t('search.placeholder.clean')}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="hidden h-5 items-center gap-0.5 rounded border border-border bg-muted/50 px-1.5 font-mono text-[10px] text-muted-foreground sm:flex">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2">
          {/* Recent searches */}
          {recentFiltered.length > 0 && (
            <div>
              <div className="px-4 py-1.5">
                <span className="label text-[10px]">
                  {t('search.placeholder.clean').split('?')[0] || 'Recent'}
                </span>
              </div>
              {recentFiltered.map((term, i) => (
                <button
                  key={term}
                  onClick={() => {
                    router.push(`/?q=${encodeURIComponent(term)}`)
                    close()
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    activeIdx === i
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted/60'
                  }`}
                >
                  <Clock size={14} className="shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-left">{term}</span>
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          {filtered.length > 0 && (
            <div>
              <div className="mt-1 px-4 py-1.5">
                <span className="label text-[10px]">Actions</span>
              </div>
              {filtered.map((action, i) => {
                const idx = recentFiltered.length + i
                return (
                  <button
                    key={action.id}
                    onClick={action.onSelect}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      activeIdx === idx
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <span className="shrink-0 text-muted-foreground">
                      {action.icon}
                    </span>
                    <span className="flex-1 text-left">{action.label}</span>
                    {action.shortcut && (
                      <kbd className="hidden items-center gap-0.5 rounded border border-border bg-muted/50 px-1.5 font-mono text-[10px] text-muted-foreground sm:flex">
                        {action.shortcut}
                      </kbd>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {totalItems === 0 && (
            <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
              <BookOpen size={32} strokeWidth={1} className="mb-2 opacity-40" />
              <p className="text-sm">{t('results.none_title')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
