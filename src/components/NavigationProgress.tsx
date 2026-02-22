'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function NavigationProgress() {
  const pathname = usePathname()
  const [phase, setPhase] = useState<'idle' | 'start' | 'done'>('idle')

  useEffect(() => {
    setPhase('start')
    const t1 = setTimeout(() => setPhase('done'), 150)
    const t2 = setTimeout(() => setPhase('idle'), 700)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [pathname])

  if (phase === 'idle') return null

  return (
    <div className="pointer-events-none fixed top-0 right-0 left-0 z-[9999] h-0.5 bg-primary/15">
      <div
        className="h-full bg-primary transition-all ease-out"
        style={{
          width: phase === 'start' ? '70%' : '100%',
          transitionDuration: phase === 'start' ? '150ms' : '300ms',
          opacity: phase === 'done' ? 0 : 1,
        }}
      />
    </div>
  )
}
