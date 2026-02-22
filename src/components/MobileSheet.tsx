'use client'
import { useEffect } from 'react'

export default function MobileSheet({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div aria-modal="true" role="dialog" className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-surface border-soft absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border p-4">
        {children}
      </div>
    </div>
  )
}
