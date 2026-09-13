export default function Loading() {
  return (
    <section className="px-6 py-10 max-w-5xl mx-auto animate-pulse">
      <div className="h-3 w-40 bg-line/60 rounded mb-6" />
      <div className="h-12 w-56 bg-line/60 rounded mb-12" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-line/30 border border-line/50 rounded" />
        ))}
      </div>
    </section>
  );
}
