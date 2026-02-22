export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 space-y-3 border-b border-border pb-6">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-4 w-72 rounded" />
      </div>

      <div className="flex gap-8">
        <div className="hidden w-48 shrink-0 flex-col gap-1 space-y-1 md:flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-10 rounded-lg" />
          ))}
        </div>

        <div className="flex-1 space-y-4">
          <div className="skeleton h-4 w-48 rounded" />
          <div className="skeleton h-40 rounded-xl" />
          <div className="skeleton h-32 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
