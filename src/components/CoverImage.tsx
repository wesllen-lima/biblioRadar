'use client'

import { useState } from 'react'
import Image from 'next/image'
import { titleGradient } from '@/lib/coverUtils'

interface CoverImageProps {
  src?: string | null
  title: string
  /** Tailwind class for the <Image> itself, defaults to object-cover */
  imgClassName?: string
  /** Extra className applied on top of the transition for hover effects */
  hoverClassName?: string
  /** Controls the size of the initial letter in the fallback */
  fallbackSize?: 'sm' | 'md' | 'lg'
}

/**
 * Renders a book cover image with an automatic gradient fallback on error.
 * Covers every case: 404, HTML page, empty body, CORS failure.
 */
export default function CoverImage({
  src,
  title,
  imgClassName = 'object-cover',
  hoverClassName = '',
  fallbackSize = 'md',
}: CoverImageProps) {
  const [error, setError] = useState(false)
  const gradient = titleGradient(title)
  const initial = title[0]?.toUpperCase() ?? '?'

  const sizeClass = { sm: 'text-3xl', md: 'text-4xl', lg: 'text-6xl' }[
    fallbackSize
  ]

  if (!src || error) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient}`}
      >
        <span
          className={`${sizeClass} font-black text-white/60 drop-shadow-lg select-none`}
        >
          {initial}
        </span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={title}
      fill
      className={`${imgClassName} ${hoverClassName}`}
      unoptimized
      onError={() => setError(true)}
    />
  )
}
