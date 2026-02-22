'use client'

import { useEffect, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useI18n } from './I18nProvider'

type Props = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'destructive' | 'default'
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  variant = 'destructive',
}: Props) {
  const { t } = useI18n()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {variant === 'destructive' && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle size={18} className="text-destructive" />
              </div>
            )}
            <h2 id="confirm-title" className="font-semibold text-foreground">
              {title}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="btn-icon h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={t('action.close')}
          >
            <X size={16} />
          </button>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>

        <div className="flex justify-end gap-2">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="btn-ghost btn-sm"
          >
            {t('confirm.cancel')}
          </button>
          <button
            onClick={() => {
              onConfirm()
            }}
            className={
              variant === 'destructive'
                ? 'btn-destructive btn-sm'
                : 'btn-primary btn-sm'
            }
          >
            {confirmLabel ?? t('confirm.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
