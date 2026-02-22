'use client'

import { CheckCircle2, Loader2, XCircle, RefreshCw } from 'lucide-react'

export type ProviderState = 'loading' | 'done' | 'error'

export type ProviderStatusEntry = {
  key: string
  label: string
  state: ProviderState
  count: number
}

export default function ProviderStatus({
  providers,
  onRetry,
}: {
  providers: ProviderStatusEntry[]
  onRetry?: (key: string) => void
}) {
  if (providers.length === 0) return null

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {providers.map((p) => (
        <div
          key={p.key}
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
            p.state === 'done'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
              : p.state === 'error'
                ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400'
                : 'border-border bg-muted/60 text-muted-foreground'
          }`}
        >
          {p.state === 'loading' && (
            <Loader2 size={11} className="animate-spin" />
          )}
          {p.state === 'done' && <CheckCircle2 size={11} />}
          {p.state === 'error' && <XCircle size={11} />}
          <span>{p.label}</span>
          {p.state === 'done' && p.count > 0 && (
            <span className="opacity-70">({p.count})</span>
          )}
          {p.state === 'error' && onRetry && (
            <button
              onClick={() => onRetry(p.key)}
              className="ml-0.5 transition-colors hover:text-red-800 dark:hover:text-red-300"
              title="Tentar novamente"
              aria-label={`Tentar novamente: ${p.label}`}
            >
              <RefreshCw size={10} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
