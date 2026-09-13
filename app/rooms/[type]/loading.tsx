export default function Loading() {
  return (
    <section className="px-6 py-10 animate-pulse">
      <div className="h-3 w-40 bg-line/60 rounded mb-3" />
      <div className="flex items-baseline justify-between mb-12 border-b border-line/50 pb-6">
        <div className="h-12 w-48 bg-line/60 rounded" />
        <div className="h-4 w-24 bg-line/40 rounded" />
      </div>
      <div className="flex flex-wrap items-end gap-y-5">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="w-[14px] bg-line/50 rounded mx-[1px]" style={{ height: `${100 + (i % 5) * 25}px` }} />
        ))}
      </div>
    </section>
  );
}
