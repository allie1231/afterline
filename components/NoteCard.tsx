import { NoteBody } from "./NoteBody";
import type { Note, Quote, Source } from "@/lib/data/types";

function fmtDate(iso: string) {
  return iso.slice(0, 10).replace(/-/g, ".");
}

export function NoteCard({
  note,
  quotesById,
}: {
  note: Note;
  quotesById?: Map<string, { quote: Quote; source: Source | null }>;
}) {
  return (
    <article className="border border-line bg-paper p-5">
      <header className="flex items-baseline gap-3 mb-2 flex-wrap">
        {note.kind && (
          <span className="font-mono text-[11px] tracking-[0.25em] border border-ink px-2 py-0.5">
            {note.kind}
          </span>
        )}
        <span className="font-mono text-[11px] tracking-[0.25em] text-muted">
          {fmtDate(note.created_at)}
          {note.updated_at !== note.created_at && (
            <span className="ml-2 opacity-60">
              · <span className="tracking-normal">수정</span>{" "}
              {fmtDate(note.updated_at)}
            </span>
          )}
        </span>
      </header>

      {note.title && (
        <h3 className="font-sans text-2xl tracking-tight leading-tight mb-3">
          {note.title}
        </h3>
      )}

      <NoteBody body={note.body} quotesById={quotesById} />
    </article>
  );
}
