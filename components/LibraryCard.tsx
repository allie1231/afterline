import type { CollectionNote, Source, SourceType } from "@/lib/data/types";
import { resolveSpineColor } from "@/lib/data/spineColor";
import { StarRating } from "./StarRating";
import { StatusPicker } from "./StatusPicker";
import { DateField } from "./DateField";
import { NoteFieldEditor } from "./NoteFieldEditor";

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return iso.slice(0, 10).replace(/-/g, ".");
}

// Source types that show a cover area inside the card. "other" is excluded —
// per request, no image area at all.
const COVERED_TYPES = new Set<SourceType>(["book", "movie", "lyrics"]);

// Aspect of the cover area per type. Books and movies are portrait (poster
// shape); lyrics are a square album cover.
const COVER_BOX: Partial<Record<SourceType, string>> = {
  book: "w-[72px] h-[96px]",
  movie: "w-[72px] h-[96px]",
  lyrics: "w-[88px] h-[88px]",
};

export function LibraryCard({
  note,
  source,
  lineCount,
  noteLabel,
  tags,
}: {
  note: CollectionNote | null;
  source: Source;
  lineCount: number;
  noteLabel: { en: string; ko: string };
  tags: string[];
}) {
  const filedDate = fmtDate(source.created_at);
  const spineColor = resolveSpineColor(source);
  const showCover = COVERED_TYPES.has(source.type);
  const coverBox = COVER_BOX[source.type] ?? "w-20 h-20";

  return (
    <article
      id={`library-card-${source.id}`}
      className="library-card group relative bg-paper border border-ink transition-all duration-200 hover:-translate-y-1 hover:-rotate-[0.4deg]"
    >
      <header className="flex items-center justify-between border-b border-ink px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="font-mono text-[10px] tracking-[0.3em]">
            AFTERLINE / LIBRARY CARD
          </div>
          <span
            className="inline-block w-3 h-3 border border-ink"
            style={{ background: spineColor }}
            aria-label="spine color"
          />
        </div>
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted">
          NO. {source.id.slice(-6).toUpperCase()}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_210px]">
        <div className="px-6 py-6 border-r border-ink/0 md:border-ink">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[10px] tracking-[0.25em] text-muted mb-1">
                TITLE
              </div>
              <div className="font-serif text-2xl leading-tight">
                {source.title}
              </div>
              {source.creator && (
                <div className="font-serif text-base text-muted mt-1">
                  {source.creator}
                </div>
              )}
            </div>
            {showCover && (
              <div
                className={`shrink-0 ${coverBox} border border-ink overflow-hidden flex items-center justify-center`}
                style={{ background: spineColor }}
              >
                {source.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={source.cover_url}
                    alt=""
                    className="max-w-full max-h-full object-contain"
                    crossOrigin="anonymous"
                  />
                )}
              </div>
            )}
          </div>

          <div className="mt-6 pt-5 border-t border-dashed border-line">
            <div className="font-mono text-[10px] tracking-[0.25em] text-muted mb-2">
              TAGS / 태그
            </div>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-[10px] tracking-[0.2em] border border-ink px-2 py-0.5"
                  >
                    #{t.toUpperCase()}
                  </span>
                ))}
              </div>
            ) : (
              <div className="font-mono text-[10px] tracking-[0.2em] text-muted italic">
                (수집한 문장에 태그를 달면 여기에 모입니다)
              </div>
            )}
          </div>

          <div className="mt-6 pt-5 border-t border-dashed border-line">
            <div className="font-mono text-[10px] tracking-[0.25em] text-muted mb-2">
              MY THOUGHT / 내 생각
            </div>
            <NoteFieldEditor
              sourceId={source.id}
              field="personal_note"
              initialValue={note?.personal_note ?? ""}
              placeholder="+ 짧은 생각을 더해보세요"
              textClassName="font-serif text-lg leading-snug"
            />
          </div>

          {note?.keywords && note.keywords.length > 0 && (
            <div className="mt-6 pt-5 border-t border-dashed border-line">
              <div className="font-mono text-[10px] tracking-[0.25em] text-muted mb-2">
                KEYWORDS
              </div>
              <div className="flex flex-wrap gap-2">
                {note.keywords.map((k) => (
                  <span
                    key={k}
                    className="font-mono text-[10px] tracking-[0.2em] border border-ink px-2 py-0.5"
                  >
                    {k.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="border-t md:border-t-0 border-ink px-5 py-6 flex flex-col gap-5">
          <StarRating
            sourceId={source.id}
            initialRating={note?.rating ?? null}
          />
          <StatusPicker
            sourceId={source.id}
            initialStatus={note?.status ?? null}
          />
          <Stamp label="LINES" value={String(lineCount).padStart(2, "0")} />
          <DateField
            sourceId={source.id}
            field="started_at"
            label="STARTED"
            initialDate={note?.started_at ?? null}
          />
          <DateField
            sourceId={source.id}
            field="finished_at"
            label="FINISHED"
            initialDate={note?.finished_at ?? null}
          />
        </aside>
      </div>

      <div className="border-t border-ink px-6 py-3 grid grid-cols-3 gap-4">
        <Footer label="DATE / 날짜" value={filedDate} />
        <Footer label={`${noteLabel.en} / ${noteLabel.ko}`} value="" />
        <Footer
          label="NO."
          value={source.id.slice(-6).toUpperCase()}
          align="right"
        />
      </div>
    </article>
  );
}

function Stamp({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[9px] tracking-[0.3em] text-muted">
        {label}
      </div>
      <div className="font-mono text-sm tracking-[0.15em] mt-1">{value}</div>
    </div>
  );
}

function Footer({
  label,
  value,
  align = "left",
}: {
  label: string;
  value: string;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <div className="font-mono text-[9px] tracking-[0.3em] text-muted">
        {label}
      </div>
      {value && (
        <div className="font-mono text-xs tracking-[0.15em] mt-0.5">
          {value}
        </div>
      )}
    </div>
  );
}
