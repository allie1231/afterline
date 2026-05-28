import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCollectionNoteBySource,
  getQuotesBySource,
  getRoomCategory,
  getSourceById,
} from "@/lib/data/repository";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CoverEditor } from "@/components/CoverEditor";
import { EditSourceButton } from "@/components/EditSourceButton";
import { LibraryCard } from "@/components/LibraryCard";
import { QuoteList } from "@/components/QuoteList";
import { SaveCardButton } from "@/components/SaveCardButton";
import { SourceFieldEditor } from "@/components/SourceFieldEditor";
import { DeleteSourceButton } from "@/components/DeleteSourceButton";
import { SourceTypeChanger } from "@/components/SourceTypeChanger";
import type { SourceType } from "@/lib/data/types";

const NOTE_LABEL: Record<SourceType, { en: string; ko: string }> = {
  book: { en: "READING NOTE", ko: "독서노트" },
  article: { en: "ARTICLE READ", ko: "기사 읽기" },
  movie: { en: "TICKET", ko: "티켓 보기" },
  lyrics: { en: "A LINE OF MUSIC", ko: "음악 한 줄" },
  conversation: { en: "A BUBBLE", ko: "말풍선 하나" },
  other: { en: "COLLECTION NOTE", ko: "수집노트" },
};

const NO_COVER_TYPES = new Set<SourceType>([
  "article",
  "conversation",
  "other",
]);

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

  // Unique mood tags pulled from every quote on this source — the card shows
  // them as the source's collected tag set.
  const allTags = Array.from(
    new Set(quotes.flatMap((q) => q.mood_tags ?? [])),
  ).sort();

  const cardFileName = `afterline-${source.title}-${source.id
    .slice(-6)
    .toUpperCase()}`.replace(/[^\w가-힣.-]+/g, "_");

  // Only treat the URL as an external link when it's clearly absolute —
  // otherwise the browser resolves it against our own origin and 404s.
  const externalUrl = /^https?:\/\//i.test(source.url ?? "")
    ? source.url!.trim()
    : null;

  return (
    <section className="px-6 py-10 max-w-5xl mx-auto">
      <div className="flex items-baseline gap-3 mb-8">
        <Breadcrumb
          crumbs={[
            { label: "AFTERLINE", href: "/" },
            { label: "ROOMS", href: "/rooms" },
            {
              label: source.type.toUpperCase(),
              href: `/rooms/${source.type}`,
            },
            { label: "COLLECTION NOTE" },
          ]}
        />
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={externalUrl}
            className="font-mono text-[10px] tracking-[0.25em] text-muted hover:text-ink transition-colors"
          >
            ↗ VISIT
          </a>
        )}
      </div>

      {/* Header — title/creator/publisher all inline-editable */}
      <header
        className={`${
          showCover
            ? "grid grid-cols-1 md:grid-cols-[200px_1fr] gap-10"
            : ""
        } border-b border-ink pb-8 mb-12`}
      >
        {showCover && <CoverEditor source={source} category={category} />}

        <div className="flex flex-col justify-end">
          <div className="mb-2 flex items-center gap-3 flex-wrap">
            <SourceTypeChanger
              sourceId={source.id}
              currentType={source.type}
            />
          </div>
          <h1 className="font-serif text-[clamp(28px,4vw,48px)] leading-[1.05] tracking-tight break-words">
            <SourceFieldEditor
              sourceId={source.id}
              field="title"
              initialValue={source.title}
              placeholder="제목"
            />
          </h1>
          <div className="font-serif text-lg text-muted mt-2">
            <SourceFieldEditor
              sourceId={source.id}
              field="creator"
              initialValue={source.creator ?? ""}
              placeholder="+ 저자 / 출연자"
              emptyClassName="text-muted italic text-base"
            />
          </div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-muted mt-2 flex gap-4 flex-wrap">
            <SourceFieldEditor
              sourceId={source.id}
              field="publisher"
              initialValue={source.publisher ?? ""}
              placeholder="+ 출판사 / 앨범"
            />
            {(source.type === "movie" ||
              source.type === "book" ||
              source.type === "lyrics") && (
              <SourceFieldEditor
                sourceId={source.id}
                field="published_date"
                initialValue={source.published_date ?? ""}
                placeholder="+ 연도"
              />
            )}
            {(source.type === "movie" ||
              source.type === "book" ||
              source.type === "lyrics") && (
              <SourceFieldEditor
                sourceId={source.id}
                field="genre"
                initialValue={source.genre ?? ""}
                placeholder="+ 장르"
              />
            )}
          </div>

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
        <QuoteList quotes={quotes} source={source} />
      </div>

      {/* Note as library card */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="font-mono text-[10px] tracking-[0.25em] text-muted">
            {noteLabel.en} / {noteLabel.ko}
          </div>
          <SaveCardButton
            targetId={`library-card-${source.id}`}
            fileName={cardFileName}
          />
        </div>
        <LibraryCard
          note={note}
          source={source}
          lineCount={quotes.length}
          noteLabel={noteLabel}
          tags={allTags}
        />
      </div>

      <div className="mt-16 flex items-center justify-between gap-4 flex-wrap">
        <Link
          href={`/rooms/${source.type}`}
          className="font-mono text-[10px] tracking-[0.25em] text-muted hover:text-ink"
        >
          ← BACK TO {source.type.toUpperCase()} ROOM
        </Link>
        <div className="flex items-center gap-3">
          <EditSourceButton source={source} />
          <DeleteSourceButton
            sourceId={source.id}
            type={source.type}
            title={source.title}
          />
        </div>
      </div>
    </section>
  );
}
