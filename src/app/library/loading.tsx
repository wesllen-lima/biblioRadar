export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-2">
          <div className="skeleton h-8 w-52 rounded-lg" />
          <div className="skeleton h-4 w-24 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-8 w-8 rounded-lg" />
          <div className="skeleton h-8 w-8 rounded-lg" />
          <div className="skeleton hidden h-8 w-24 rounded-lg sm:block" />
          <div className="skeleton h-8 w-8 rounded-lg" />
        </div>
      </div>

      <div className="mb-4 flex gap-3">
        <div className="skeleton h-9 flex-1 rounded-lg" />
        <div className="skeleton h-9 w-36 rounded-lg" />
      </div>

      <div className="mb-4 flex gap-2">
        {[60, 56, 60, 52].map((w, i) => (
          <div
            key={i}
            className="skeleton h-7 rounded-full"
            style={{ width: w }}
          />
        ))}
      </div>

      <div className="skeleton mb-4 h-4 w-36 rounded" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-[150px] rounded-xl" />
        ))}
      </div>
    </div>
  )
}
