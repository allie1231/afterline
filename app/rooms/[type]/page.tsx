import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getQuotesBySource,
  getRoomCategory,
  getSourcesByType,
} from "@/lib/data/repository";
import { SourceSpine } from "@/components/SourceSpine";
import type { SourceType } from "@/lib/data/types";

const VALID: SourceType[] = [
  "book",
  "article",
  "lyrics",
  "movie",
  "conversation",
  "other",
];

export default async function RoomPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!VALID.includes(type as SourceType)) notFound();

  const category = await getRoomCategory(type as SourceType);
  const sources = await getSourcesByType(type as SourceType);
  if (!category) notFound();

  const sourceCounts = await Promise.all(
    sources.map(async (s) => ({
      source: s,
      lines: (await getQuotesBySource(s.id)).length,
    })),
  );

  return (
    <section className="px-6 py-10">
      <div className="font-mono text-[10px] tracking-[0.25em] text-muted mb-3">
        <Link href="/rooms" className="hover:text-ink">
          ← ROOMS
        </Link>
        {"  /  "}
        {category.en}
      </div>

      <div className="flex items-baseline justify-between mb-12 border-b border-line pb-6">
        <h2 className="font-serif text-4xl md:text-5xl tracking-tight">{category.en}</h2>
        <div className="flex items-end gap-6">
          <div className="text-right">
            <div className="font-mono text-[10px] tracking-[0.25em] text-muted">
              {category.ko}
            </div>
            <div className="font-serif text-lg mt-1">{category.description}</div>
          </div>
          <Link
            href={`/quotes/new?type=${category.type}`}
            className="font-mono text-[11px] tracking-[0.3em] border border-ink px-5 py-3 hover:bg-ink hover:text-paper transition-colors whitespace-nowrap"
          >
            + NEW LINE
          </Link>
        </div>
      </div>

      {sources.length === 0 ? (
        <div className="flex flex-col items-center py-24 gap-6">
          <div className="font-mono text-xs tracking-[0.25em] text-muted">
            NO SOURCES YET / 아직 수집된 출처가 없습니다.
          </div>
          <Link
            href={`/quotes/new?type=${category.type}`}
            className="font-mono text-[11px] tracking-[0.3em] border border-ink px-6 py-4 hover:bg-ink hover:text-paper transition-colors"
          >
            [ ADD FIRST LINE / 첫 문장 더하기 ]
          </Link>
        </div>
      ) : (
        <div className="relative">
          <div className="border-y-2 border-ink">
            <div className="flex items-end gap-3 py-6 overflow-x-auto">
              {sourceCounts.map(({ source, lines }, i) => (
                <SourceSpine
                  key={source.id}
                  source={source}
                  lines={lines}
                  index={i}
                />
              ))}
            </div>
          </div>
          <div className="mt-3 font-mono text-[10px] tracking-[0.25em] text-muted">
            SHELF · {String(sources.length).padStart(2, "0")} ITEMS
          </div>
        </div>
      )}
    </section>
  );
}
