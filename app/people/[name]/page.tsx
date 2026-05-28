import Link from "next/link";
import { notFound } from "next/navigation";
import { getPersonPage } from "@/lib/data/repository";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ROOM_CATEGORIES } from "@/lib/data/categories";
import { SourceSpine } from "@/components/SourceSpine";
import type { SourceType } from "@/lib/data/types";

export const dynamic = "force-dynamic";

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return iso.slice(0, 10).replace(/-/g, ".");
}

export default async function PersonPageView({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name: encoded } = await params;
  const name = decodeURIComponent(encoded);
  const data = await getPersonPage(name);
  if (!data) notFound();

  // Group sources by type so each room shows its own shelf row.
  const sourcesByType = new Map<SourceType, typeof data.sources>();
  for (const s of data.sources) {
    const arr = sourcesByType.get(s.type) ?? [];
    arr.push(s);
    sourcesByType.set(s.type, arr);
  }

  // First & latest collected-at to anchor the timeline.
  const firstAt = data.sources
    .map((s) => s.created_at)
    .filter(Boolean)
    .sort()[0];
  const lastAt = data.sources
    .map((s) => s.created_at)
    .filter(Boolean)
    .sort()
    .pop();

  return (
    <section className="px-6 py-10 max-w-5xl mx-auto">
      <Breadcrumb
        crumbs={[
          { label: "AFTERLINE", href: "/" },
          { label: "PEOPLE", href: "/people" },
          { label: name },
        ]}
        className="mb-3"
      />

      <header className="border-b border-ink pb-8 mb-12">
        <h1 className="font-serif text-[clamp(36px,5vw,64px)] tracking-tight leading-none break-words">
          {name}
        </h1>
        <div className="font-mono text-[11px] tracking-[0.3em] text-muted mt-4 flex gap-6 flex-wrap">
          <span>{String(data.sources.length).padStart(2, "0")} SOURCES</span>
          <span>{String(data.lines).padStart(3, "0")} LINES</span>
          <span>{String(data.notesCount).padStart(2, "0")} NOTES</span>
          {firstAt && (
            <span>
              SPAN {fmtDate(firstAt)} → {fmtDate(lastAt)}
            </span>
          )}
        </div>
      </header>

      {/* Sources grouped by room */}
      {[...sourcesByType.entries()].map(([type, sources]) => {
        const cat = ROOM_CATEGORIES.find((c) => c.type === type);
        return (
          <section key={type} className="mb-12">
            <div className="flex items-baseline justify-between mb-4 border-b border-line pb-2">
              <div className="flex items-baseline gap-3">
                <span
                  className="w-2 h-2 inline-block"
                  style={{ background: cat?.accent }}
                />
                <h2 className="font-serif text-2xl tracking-tight">
                  {cat?.en ?? type.toUpperCase()}
                </h2>
                <span className="font-mono text-[10px] tracking-[0.25em] text-muted">
                  {cat?.ko}
                </span>
              </div>
              <Link
                href={`/rooms/${type}`}
                className="font-mono text-[10px] tracking-[0.25em] text-muted hover:text-ink"
              >
                ALL {cat?.en ?? type.toUpperCase()} →
              </Link>
            </div>
            <div className="flex flex-wrap items-end gap-x-3 gap-y-8 py-4">
              {sources.map((s) => (
                <SourceSpine key={s.id} source={s} lines={0} />
              ))}
            </div>
          </section>
        );
      })}

      {/* Recent lines */}
      {data.recentQuotes.length > 0 && (
        <section className="mb-12">
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-4">
            RECENT LINES / 최근 수집한 문장
          </div>
          <ol className="flex flex-col gap-6">
            {data.recentQuotes.slice(0, 20).map(({ quote, source }) => (
              <li
                key={quote.id}
                className="grid grid-cols-[40px_1fr] gap-6"
              >
                <div className="font-mono text-[10px] tracking-[0.25em] text-muted pt-2">
                  {fmtDate(quote.created_at).slice(5)}
                </div>
                <div>
                  <p className="font-serif text-xl leading-snug whitespace-pre-line">
                    {quote.text}
                  </p>
                  <Link
                    href={`/sources/${source.id}`}
                    className="font-mono text-[10px] tracking-[0.25em] text-muted hover:text-ink mt-2 inline-block"
                  >
                    {source.title} ↗
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </section>
  );
}
