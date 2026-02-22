'use client'

import { useEffect, useState } from 'react'
import { Clock, Search } from 'lucide-react'
import { getSearchHistory, clearHistory } from '@/lib/history'

export default function SearchHistory({
  onSelect,
  visible,
}: {
  onSelect: (term: string) => void
  visible: boolean
}) {
  const [history, setHistory] = useState<string[]>([])

  const load = () => setHistory(getSearchHistory())

  useEffect(() => {
    load()
    window.addEventListener('history-updated', load)
    return () => window.removeEventListener('history-updated', load)
  }, [])

  if (!visible || history.length === 0) return null

  return (
    <div className="animate-in fade-in slide-in-from-top-2 absolute top-full right-0 left-0 z-50 mt-2 rounded-xl border border-border bg-card/95 p-2 shadow-xl backdrop-blur-md duration-200">
      <div className="flex items-center justify-between px-2 py-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
        <span className="flex items-center gap-1">
          <Clock size={12} /> Recentes
        </span>
        <button
          onClick={clearHistory}
          className="transition-colors hover:text-destructive"
        >
          Limpar
        </button>
      </div>
      <ul className="mt-1">
        {history.map((term, i) => (
          <li key={i}>
            <button
              onClick={() => onSelect(term)}
              onMouseDown={(e) => e.preventDefault()}
              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted/50"
            >
              <Search
                size={16}
                className="text-muted-foreground transition-colors group-hover:text-primary"
              />
              {term}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
