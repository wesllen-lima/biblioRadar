export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 space-y-2">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="flex items-center gap-3">
          <div className="skeleton h-8 w-8 rounded-full" />
          <div className="skeleton h-7 w-48 rounded-lg" />
        </div>
        <div className="skeleton ml-11 h-4 w-80 rounded" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="skeleton w-full" style={{ height: 520 }} />
      </div>

      <div className="mt-3 flex gap-4">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-4 w-24 rounded" />
      </div>
    </div>
  )
}
