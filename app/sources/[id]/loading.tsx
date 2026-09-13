export default function Loading() {
  return (
    <section className="px-6 py-10 max-w-5xl mx-auto animate-pulse">
      <div className="h-3 w-60 bg-line/60 rounded mb-8" />
      <header className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-10 border-b border-line/50 pb-8 mb-12">
        <div className="w-[200px] h-[280px] bg-line/40 rounded" />
        <div className="flex flex-col justify-end gap-3">
          <div className="h-4 w-16 bg-line/50 rounded" />
          <div className="h-10 w-80 bg-line/60 rounded" />
          <div className="h-5 w-40 bg-line/40 rounded" />
          <div className="h-3 w-32 bg-line/40 rounded" />
        </div>
      </header>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-line/30 rounded" />
        ))}
      </div>
    </section>
  );
}
