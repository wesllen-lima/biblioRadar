export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-8 pb-4">
      <div className="mx-auto mb-8 max-w-2xl space-y-3 text-center">
        <div className="skeleton mx-auto h-5 w-44 rounded-full" />
        <div className="skeleton mx-auto h-10 w-80 rounded-lg" />
        <div className="skeleton mx-auto h-4 w-64 rounded" />
      </div>

      <div className="skeleton mx-auto mb-8 h-16 max-w-2xl rounded-2xl" />

      <div className="space-y-3">
        <div className="mb-2 flex gap-2">
          {[80, 60, 72, 56, 68].map((w, i) => (
            <div
              key={i}
              className="skeleton h-7 rounded-full"
              style={{ width: w }}
            />
          ))}
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="w-36 shrink-0 overflow-hidden rounded-xl border border-border"
            >
              <div className="skeleton" style={{ aspectRatio: '2/3' }} />
              <div className="space-y-1.5 p-2">
                <div className="skeleton h-2.5 w-3/4 rounded" />
                <div className="skeleton h-2 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
