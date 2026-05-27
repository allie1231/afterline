import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCollectionNoteBySource,
  getQuotesBySource,
  getRoomCategory,
  getSourceById,
} from "@/lib/data/repository";
import { SourceCover } from "@/components/SourceCover";
import { LibraryCard } from "@/components/LibraryCard";
import type { SourceType } from "@/lib/data/types";

const NOTE_LABEL: Record<SourceType, { en: string; ko: string }> = {
  book: { en: "READING NOTE", ko: "독서노트" },
  article: { en: "ARTICLE READ", ko: "기사 읽기" },
  movie: { en: "TICKET", ko: "티켓 보기" },
  lyrics: { en: "A LINE OF MUSIC", ko: "음악 한 줄" },
  conversation: { en: "A BUBBLE", ko: "말풍선 하나" },
  other: { en: "COLLECTION NOTE", ko: "수집노트" },
};

// Types that don't show a left-side cover image on the detail page.
const NO_COVER_TYPES = new Set<SourceType>(["article", "conversation"]);

export default async function SourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const source = await getSourceById(id);
  if (!source) notFound();

  const [quotes, note, category] = await Promise.all([
    getQuotesBySource(source.id),
    getCollectionNoteBySource(source.id),
    getRoomCategory(source.type),
  ]);

  if (!category) notFound();

  const showCover = !NO_COVER_TYPES.has(source.type);
  const noteLabel = NOTE_LABEL[source.type];

  return (
    <section className="px-6 py-10 max-w-5xl mx-auto">
      <div className="font-mono text-[10px] tracking-[0.25em] text-muted mb-8">
        AFTERLINE / {source.type.toUpperCase()} / COLLECTION NOTE
      </div>

      {/* Header */}
      <header
        className={`${
          showCover
            ? "grid grid-cols-1 md:grid-cols-[200px_1fr] gap-10"
            : ""
        } border-b border-ink pb-8 mb-12`}
      >
        {showCover && <SourceCover source={source} category={category} />}

        <div className="flex flex-col justify-end">
          <div className="font-mono text-[10px] tracking-[0.25em] text-muted mb-2">
            {category.en} / {category.ko}
          </div>
          <h1 className="font-serif text-[clamp(28px,4vw,48px)] leading-[1.05] tracking-tight break-words">
            {source.title}
          </h1>
          {source.creator && (
            <div className="font-serif text-lg text-muted mt-2">
              {source.creator}
            </div>
          )}
          {(source.publisher || source.published_date) && (
            <div className="font-mono text-[10px] tracking-[0.2em] text-muted mt-1.5">
              {[source.publisher, source.published_date]
                .filter(Boolean)
                .join(" · ")}
            </div>
          )}

          <div className="flex gap-6 mt-5 font-mono text-[10px] tracking-[0.25em]">
            <span>COLLECTED LINES {String(quotes.length).padStart(2, "0")}</span>
            {note?.status && (
              <span>STATUS: {note.status.replace("_", " ").toUpperCase()}</span>
            )}
          </div>
        </div>
      </header>

      {/* Lines */}
      <div className="mb-16">
        <div className="flex items-baseline justify-between mb-6">
          <div className="font-mono text-[10px] tracking-[0.25em] text-muted">
            LINES / 수집 문장
          </div>
          <Link
            href={`/quotes/new?type=${source.type}&source=${source.id}`}
            className="font-mono text-[10px] tracking-[0.3em] border border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors"
          >
            + NEW LINE
          </Link>
        </div>
        <ol className="flex flex-col gap-8">
          {quotes.map((q, i) => (
            <li key={q.id} className="grid grid-cols-[40px_1fr] gap-6">
              <div className="font-mono text-[10px] tracking-[0.2em] text-muted pt-2">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <p className="font-serif text-2xl leading-snug">
                  &ldquo;{q.text}&rdquo;
                </p>
                {q.note && (
                  <div className="mt-3">
                    <div className="font-mono text-[10px] tracking-[0.2em] text-muted">
                      memo
                    </div>
                    <p className="font-sans text-sm mt-1">{q.note}</p>
                  </div>
                )}
                {q.mood_tags.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {q.mood_tags.map((m) => (
                      <span
                        key={m}
                        className="font-mono text-[10px] tracking-[0.2em] border border-line px-2 py-0.5"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
          {quotes.length === 0 && (
            <li className="font-mono text-xs text-muted">
              NO LINES YET / 아직 수집된 문장이 없습니다.
            </li>
          )}
        </ol>
      </div>

      {/* Note as library card */}
      <div>
        <div className="font-mono text-[10px] tracking-[0.25em] text-muted mb-4">
          {noteLabel.en} / {noteLabel.ko}
        </div>
        <LibraryCard
          note={note}
          source={source}
          lineCount={quotes.length}
          noteLabel={noteLabel}
        />
      </div>

      <div className="mt-16">
        <Link
          href={`/rooms/${source.type}`}
          className="font-mono text-[10px] tracking-[0.25em] text-muted hover:text-ink"
        >
          ← BACK TO {source.type.toUpperCase()} ROOM
        </Link>
      </div>
    </section>
  );
}
