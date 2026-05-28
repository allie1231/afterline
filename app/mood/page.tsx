import Link from "next/link";
import { getMoodTagsWithCounts } from "@/lib/data/repository";
import { Breadcrumb } from "@/components/Breadcrumb";

export default async function MoodPage() {
  const tags = await getMoodTagsWithCounts();

  return (
    <section className="px-6 py-10 max-w-4xl">
      <Breadcrumb
        crumbs={[
          { label: "AFTERLINE", href: "/" },
          { label: "TAGS" },
        ]}
        className="mb-3"
      />
      <h2 className="font-serif text-4xl md:text-5xl tracking-tight leading-none">
        Tags
      </h2>
      <div className="font-mono text-xs tracking-[0.2em] text-muted mt-3 mb-12">
        태그 / 인덱스 — 태그를 누르면 같은 태그의 문장이 모입니다.
      </div>

      {tags.length === 0 ? (
        <div className="font-mono text-xs text-muted">NO TAGS YET</div>
      ) : (
        <ul className="flex flex-col">
          {tags.map(({ tag, count }) => (
            <li key={tag} className="border-b border-line">
              <Link
                href={`/mood/${encodeURIComponent(tag)}`}
                className="flex items-baseline justify-between py-4 px-2 -mx-2 hover:bg-line/40 transition-colors"
              >
                <span className="font-serif text-3xl">{tag}</span>
                <span className="font-mono text-[10px] tracking-[0.25em] text-muted">
                  {String(count).padStart(2, "0")} LINES
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
