export default function Loading() {
  return (
    <section className="px-6 py-10 max-w-5xl mx-auto animate-pulse">
      <div className="h-3 w-40 bg-line/60 rounded mb-8" />
      <div className="h-10 w-64 bg-line/60 rounded mb-4" />
      <div className="h-5 w-96 bg-line/40 rounded mb-12" />
      <div className="flex flex-wrap gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-[14px] bg-line/50 rounded" style={{ height: `${120 + (i % 4) * 30}px` }} />
        ))}
      </div>
    </section>
  );
}
