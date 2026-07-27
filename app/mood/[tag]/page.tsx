import Link from "next/link";
import { getQuotesByTag } from "@/lib/data/repository";
import { ROOM_CATEGORIES } from "@/lib/data/categories";
import type { SourceType } from "@/lib/data/types";
import { Breadcrumb } from "@/components/Breadcrumb";

const CAT_BY_TYPE = Object.fromEntries(
  ROOM_CATEGORIES.map((c) => [c.type, c]),
) as Record<SourceType, (typeof ROOM_CATEGORIES)[number]>;

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag: rawTag } = await params;
  const tag = decodeURIComponent(rawTag);
  const items = await getQuotesByTag(tag);

  const sourceCount = new Set(
    items.map((i) => i.source?.id).filter(Boolean),
  ).size;

  return (
    <section className="px-6 py-10 max-w-4xl mx-auto">
      <Breadcrumb
        backHref="/mood"
        crumbs={[
          { label: "AFTERLINE", href: "/" },
          { label: "TAGS", href: "/mood" },
          { label: tag },
        ]}
        className="mb-3"
      />

      <h1 className="font-serif text-4xl md:text-5xl tracking-tight leading-none break-words">
        {tag}
      </h1>
      <div className="font-mono text-xs tracking-[0.2em] text-muted mt-3 mb-12 flex gap-4">
        <span>{String(items.length).padStart(2, "0")} LINES</span>
        <span>· {String(sourceCount).padStart(2, "0")} SOURCES</span>
      </div>

      {items.length === 0 ? (
        <div className="font-mono text-xs tracking-[0.2em] text-muted py-20 text-center">
          NO LINES WITH THIS TAG
        </div>
      ) : (
        <ol className="flex flex-col gap-10">
          {items.map(({ quote, source }, i) => (
            <li key={quote.id} className="grid grid-cols-[40px_1fr] gap-6">
              <div className="font-mono text-[10px] tracking-[0.2em] text-muted pt-2">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <blockquote className="font-sans text-base leading-relaxed whitespace-pre-line">
                  {quote.text}
                </blockquote>
                {source && (
                  <div className="mt-3 font-mono text-[10px] tracking-[0.25em] text-muted flex gap-3 items-baseline flex-wrap">
                    <Link
                      href={`/sources/${source.id}`}
                      className="text-ink hover:underline"
                    >
                      — {source.title}
                    </Link>
                    {source.creator && <span>· {source.creator}</span>}
                    {quote.page && <span>· p. {quote.page}</span>}
                    {(() => {
                      const cat = CAT_BY_TYPE[source.type];
                      if (!cat) return null;
                      return (
                        <span
                          className="font-mono text-[9px] tracking-[0.25em] px-1.5 py-0.5"
                          style={{
                            background: cat.accent,
                            color:
                              cat.contrast === "dark"
                                ? "var(--white)"
                                : "var(--ink)",
                          }}
                        >
                          {cat.en}
                        </span>
                      );
                    })()}
                  </div>
                )}
                {quote.note && (
                  <p className="font-sans text-sm text-muted mt-2 max-w-2xl">
                    {quote.note}
                  </p>
                )}
                {quote.mood_tags.length > 1 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {quote.mood_tags
                      .filter((t) => t !== tag)
                      .map((t) => (
                        <Link
                          key={t}
                          href={`/mood/${encodeURIComponent(t)}`}
                          className="font-mono text-[9px] tracking-[0.25em] border border-line px-2 py-0.5 hover:border-ink hover:bg-ink hover:text-paper transition-colors"
                        >
                          {t}
                        </Link>
                      ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

