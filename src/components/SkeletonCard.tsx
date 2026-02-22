'use client'

export default function SkeletonCard() {
  return (
    <article
      aria-hidden
      className="card animate-rise grid grid-cols-[84px_1fr] gap-3 p-3 md:p-4"
    >
      <div className="border-soft h-[112px] w-[84px] overflow-hidden rounded-md border">
        <div className="bg-shimmer h-full w-full" />
      </div>

      <div className="min-w-0 space-y-2">
        <div className="bg-shimmer h-4 w-3/4 rounded" />
        <div className="bg-shimmer h-3 w-1/2 rounded" />
        <div className="flex gap-2 pt-1">
          <div className="bg-shimmer h-8 w-28 rounded" />
          <div className="bg-shimmer h-8 w-24 rounded" />
        </div>
      </div>
    </article>
  )
}
