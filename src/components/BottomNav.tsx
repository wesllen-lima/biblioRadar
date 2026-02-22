'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Library, Settings, Network } from 'lucide-react'
import { useI18n } from '@/components/I18nProvider'
import { useLibrary } from '@/lib/useLibrary'
import { useEffect, useState } from 'react'

export default function BottomNav() {
  const pathname = usePathname()
  const { t } = useI18n()
  const { items } = useLibrary()
  const [count, setCount] = useState(0)

  useEffect(() => setCount(items.length), [items])

  const navItems = [
    { href: '/', icon: <Home size={20} />, label: t('nav.home') },
    {
      href: '/library',
      icon: <Library size={20} />,
      label: t('nav.library'),
      badge: count,
    },
    { href: '/graph', icon: <Network size={20} />, label: t('nav.graph') },
    {
      href: '/settings',
      icon: <Settings size={20} />,
      label: t('nav.settings'),
    },
  ] as const

  return (
    <nav
      className="glass fixed right-0 bottom-0 left-0 z-50 border-t border-border/50 sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Bottom navigation"
    >
      <div className="flex h-14 items-center justify-around">
        {navItems.map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 transition-all duration-200 ${
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground active:scale-90'
              }`}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <span className="relative">
                {item.icon}
                {'badge' in item && (item.badge as number) > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-[3px] text-[9px] font-bold text-primary-foreground ring-2 ring-background">
                    {item.badge as number}
                  </span>
                )}
              </span>
              <span
                className={`text-[10px] font-medium transition-all ${active ? 'opacity-100' : 'opacity-70'}`}
              >
                {item.label}
              </span>
              {active && (
                <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
