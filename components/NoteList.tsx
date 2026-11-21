import { NoteCard } from "./NoteCard";
import type { Note, Quote, Source } from "@/lib/data/types";

// Notes written in Notion, newest first.
export function NoteList({
  notes,
  quotesById,
}: {
  notes: Note[];
  quotesById?: Map<string, { quote: Quote; source: Source | null }>;
}) {
  if (notes.length === 0) {
    return (
      <div className="font-mono text-xs tracking-[0.2em] text-muted py-4">
        NO NOTES YET / <span className="tracking-normal">아직 작성된 노트가 없어요.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {notes.map((n) => (
        <NoteCard key={n.id} note={n} quotesById={quotesById} />
      ))}
    </div>
  );
}
