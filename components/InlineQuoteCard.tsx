import Link from "next/link";
import type { Quote, Source } from "@/lib/data/types";

// Inline rendering of a [[q:id]] reference inside a note body.
// Compact, self-contained, links to the parent source page.
export function InlineQuoteCard({
  quote,
  source,
}: {
  quote: Quote | null;
  source: Source | null;
}) {
  if (!quote) {
    return (
      <span className="inline-block font-mono text-[10px] tracking-[0.2em] text-muted border border-dashed border-line px-2 py-1 my-2">
        UNRESOLVED LINE / 인용 못 찾음
      </span>
    );
  }
  return (
    <aside className="my-4 border-l-2 border-ink pl-4 py-2 bg-line/10">
      <p className="font-sans text-base leading-relaxed whitespace-pre-line">
        &ldquo;{quote.text}&rdquo;
      </p>
      {(source || quote.page) && (
        <div className="font-mono text-[10px] tracking-[0.25em] text-muted mt-2 flex gap-3 flex-wrap">
          {source && (
            <Link
              href={`/sources/${source.id}`}
              className="hover:text-ink"
            >
              {source.title}
              {source.creator ? ` — ${source.creator}` : ""}
            </Link>
          )}
          {quote.page && <span>· p.{quote.page}</span>}
        </div>
      )}
    </aside>
  );
}
