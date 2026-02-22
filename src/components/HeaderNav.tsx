'use client'

import ThemeToggle from '@/components/ThemeToggle'
import LanguageSwitch from '@/components/LanguageSwitch'
import Link from 'next/link'
import { useLibrary } from '@/lib/useLibrary'
import { useEffect, useState } from 'react'
import {
  Library,
  Settings,
  Home,
  BookOpen,
  Search,
  Network,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import type { Route } from 'next'
import { useI18n } from '@/components/I18nProvider'
import { openCommandPalette } from '@/components/CommandPalette'

export default function HeaderNav() {
  const { items } = useLibrary()
  const { t } = useI18n()
  const [count, setCount] = useState(0)
  const pathname = usePathname()

  useEffect(() => setCount(items.length), [items])

  return (
    <header className="sticky top-0 z-50 w-full px-4 pt-4 pb-2">
      <div className="mx-auto max-w-5xl">
        <nav className="relative flex items-center justify-between rounded-full border border-border/40 bg-background/80 px-4 py-2 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
          {/* Logo */}
          <Link
            href="/"
            className="group focus-ring flex items-center gap-2 rounded-full px-1 outline-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal-700 text-primary-foreground shadow-md shadow-primary/30 transition-transform group-hover:scale-110 group-active:scale-95">
              <BookOpen size={16} />
            </div>
            <span className="hidden font-bold tracking-tight transition-colors group-hover:text-primary sm:inline-block">
              BiblioRadar
            </span>
          </Link>

          {/* Right controls */}
          <div className="flex items-center gap-1">
            {/* Command palette button — visible on desktop */}
            <button
              onClick={openCommandPalette}
              className="group relative hidden h-9 items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 text-sm text-muted-foreground transition-all hover:border-border hover:bg-muted hover:text-foreground md:inline-flex"
              aria-label={t('search.placeholder.clean')}
            >
              <Search size={15} />
              <span className="hidden text-xs lg:inline">
                {t('search.placeholder.clean')}
              </span>
              <kbd className="ml-1 hidden h-5 items-center rounded border border-border bg-background/50 px-1.5 font-mono text-[10px] text-muted-foreground lg:flex">
                ⌘K
              </kbd>
            </button>

            {/* Search icon (mobile-ish without text) */}
            <button
              onClick={openCommandPalette}
              className="btn-ghost group relative inline-flex h-9 w-9 items-center justify-center rounded-full px-0 hover:bg-muted/80 md:hidden"
              aria-label={t('search.placeholder.clean')}
            >
              <Search size={18} />
            </button>

            <div className="mx-1 hidden h-4 w-px bg-border sm:block" />

            {/* Nav links — hidden on mobile (BottomNav handles it) */}
            <div className="hidden items-center gap-1 sm:flex">
              <NavItem
                href="/"
                active={pathname === '/'}
                icon={<Home size={18} />}
                label={t('nav.home')}
              />
              <NavItem
                href="/library"
                active={pathname.startsWith('/library')}
                icon={<Library size={18} />}
                label={t('nav.library')}
                count={count}
              />
              <NavItem
                href="/graph"
                active={pathname.startsWith('/graph')}
                icon={<Network size={18} />}
                label={t('nav.graph')}
              />
              <NavItem
                href="/settings"
                active={pathname.startsWith('/settings')}
                icon={<Settings size={18} />}
                label={t('nav.settings')}
              />
            </div>

            <div className="ml-2 flex items-center gap-1 border-l border-border pl-2">
              <LanguageSwitch />
              <ThemeToggle />
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}

function NavItem({
  href,
  active,
  icon,
  label,
  count,
}: {
  href: Route<string> | URL
  active: boolean
  icon: React.ReactNode
  label: string
  count?: number
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`group focus-ring relative flex h-9 items-center justify-center gap-2 rounded-full px-3 transition-all duration-200 outline-none ${
        active
          ? 'bg-primary/10 font-medium text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <span className="relative">
        {icon}
        {count !== undefined && count > 0 && (
          <span className="absolute -top-2 -right-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-[3px] text-[9px] font-bold text-primary-foreground shadow-sm ring-2 ring-background">
            {count}
          </span>
        )}
      </span>
      <span className="hidden text-sm lg:inline-block">{label}</span>
      <Tooltip text={label} className="lg:hidden" />
    </Link>
  )
}

function Tooltip({
  text,
  className = '',
}: {
  text: string
  className?: string
}) {
  return (
    <span
      className={`pointer-events-none absolute top-full z-50 mt-2 rounded-md bg-foreground px-2 py-1 text-[10px] font-medium whitespace-nowrap text-background opacity-0 shadow-lg transition-all duration-200 group-hover:-translate-y-1 group-hover:opacity-100 ${className}`}
    >
      {text}
      <span className="absolute -top-1 left-1/2 -ml-1 h-2 w-2 -rotate-45 bg-foreground" />
    </span>
  )
}
