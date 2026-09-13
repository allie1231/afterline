export default function Loading() {
  return (
    <section className="px-6 py-10 animate-pulse">
      <div className="h-3 w-32 bg-line/60 rounded mb-6" />
      <div className="h-12 w-48 bg-line/60 rounded mb-12" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-line/50 p-6 h-40 rounded" />
        ))}
      </div>
    </section>
  );
}
