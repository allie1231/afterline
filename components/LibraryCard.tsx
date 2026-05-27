import type { CollectionNote, Source } from "@/lib/data/types";
import { StarRating } from "./StarRating";

const STATUS_LABEL: Record<NonNullable<CollectionNote["status"]>, string> = {
  to_read: "TO READ",
  reading: "READING",
  finished: "FINISHED",
  archived: "ARCHIVED",
};

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return iso.slice(0, 10).replace(/-/g, ".");
}

export function LibraryCard({
  note,
  source,
  lineCount,
  noteLabel,
}: {
  note: CollectionNote | null;
  source: Source;
  lineCount: number;
  noteLabel: { en: string; ko: string };
}) {
  const status = note?.status ? STATUS_LABEL[note.status] : "UNFILED";
  const filedDate = fmtDate(source.created_at);

  return (
    <article
      className="library-card group relative bg-paper border border-ink transition-all duration-200 hover:-translate-y-1 hover:-rotate-[0.4deg]"
    >
      <header className="flex items-center justify-between border-b border-ink px-6 py-3">
        <div className="font-mono text-[10px] tracking-[0.3em]">
          AFTERLINE / LIBRARY CARD
        </div>
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted">
          NO. {source.id.slice(-6).toUpperCase()}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px]">
        <div className="px-6 py-6 border-r border-ink/0 md:border-ink">
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

          {note?.summary && (
            <div className="mt-6 pt-5 border-t border-dashed border-line">
              <div className="font-mono text-[10px] tracking-[0.25em] text-muted mb-1">
                SUMMARY
              </div>
              <p className="font-serif text-lg leading-snug">{note.summary}</p>
            </div>
          )}

          {note?.personal_note && (
            <div className="mt-6 pt-5 border-t border-dashed border-line">
              <div className="font-mono text-[10px] tracking-[0.25em] text-muted mb-1">
                MY THOUGHT
              </div>
              <p className="font-serif text-lg leading-snug">
                {note.personal_note}
              </p>
            </div>
          )}

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

        <aside className="border-t md:border-t-0 border-ink px-6 py-6 flex flex-col gap-5">
          <StarRating sourceId={source.id} initialRating={note?.rating ?? null} />
          <Stamp label="STATUS" value={status} highlight />
          <Stamp label="LINES" value={String(lineCount).padStart(2, "0")} />
          <Stamp label="STARTED" value={fmtDate(note?.started_at)} />
          <Stamp label="FINISHED" value={fmtDate(note?.finished_at)} />
        </aside>
      </div>

      <div className="border-t border-ink px-6 py-3 grid grid-cols-3 gap-4">
        <Footer label="DATE / 날짜" value={filedDate} />
        <Footer label={`${noteLabel.en} / ${noteLabel.ko}`} value="" />
        <Footer label="NO." value={source.id.slice(-6).toUpperCase()} align="right" />
      </div>
    </article>
  );
}

function Stamp({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="font-mono text-[9px] tracking-[0.3em] text-muted">
        {label}
      </div>
      <div
        className={`font-mono text-sm tracking-[0.15em] mt-1 ${
          highlight ? "inline-block border border-ink px-2 py-0.5" : ""
        }`}
      >
        {value}
      </div>
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
