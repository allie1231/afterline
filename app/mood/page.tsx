import { getMoodTagsWithCounts } from "@/lib/data/repository";

export default async function MoodPage() {
  const tags = await getMoodTagsWithCounts();

  return (
    <section className="px-6 py-10 max-w-4xl">
      <div className="font-mono text-[10px] tracking-[0.25em] text-muted mb-3">
        AFTERLINE / TAGS
      </div>
      <h2 className="font-serif text-4xl md:text-5xl tracking-tight leading-none">Tags</h2>
      <div className="font-mono text-xs tracking-[0.2em] text-muted mt-3 mb-12">
        태그 / 인덱스
      </div>

      {tags.length === 0 ? (
        <div className="font-mono text-xs text-muted">NO TAGS YET</div>
      ) : (
        <ul className="flex flex-col">
          {tags.map(({ tag, count }) => (
            <li
              key={tag}
              className="flex items-baseline justify-between border-b border-line py-4"
            >
              <span className="font-serif text-3xl">{tag}</span>
              <span className="font-mono text-[10px] tracking-[0.25em] text-muted">
                {String(count).padStart(2, "0")} LINES
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
