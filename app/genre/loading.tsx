export default function Loading() {
  return (
    <section className="px-6 py-10 animate-pulse">
      <div className="h-3 w-40 bg-line/60 rounded mb-3" />
      <div className="flex items-baseline justify-between mb-12 border-b border-line/50 pb-6">
        <div className="h-12 w-36 bg-line/60 rounded" />
        <div className="h-4 w-20 bg-line/40 rounded" />
      </div>
      <div className="space-y-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="h-6 w-28 bg-line/50 rounded mb-5" />
            <div className="flex flex-wrap items-end gap-y-5">
              {Array.from({ length: 8 }).map((_, j) => (
                <div key={j} className="w-[14px] bg-line/50 rounded mx-[1px]" style={{ height: `${100 + (j % 4) * 25}px` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
