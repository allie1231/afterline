"use client";

import { useState } from "react";
import { NoteCard } from "./NoteCard";
import { NoteCreateForm } from "./NoteEditor";
import type { Note } from "@/lib/data/types";

// Inline notes list for the source detail page.
// Shows a "+ NEW NOTE" trigger that expands the create form, then a
// chronological list of existing notes (newest first).
export function NoteList({
  notes,
  sourceId,
}: {
  notes: Note[];
  sourceId: string;
}) {
  const [composing, setComposing] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {composing ? (
        <NoteCreateForm sourceId={sourceId} />
      ) : (
        <button
          type="button"
          onClick={() => setComposing(true)}
          className="self-start font-mono text-[10px] tracking-[0.3em] border border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors"
        >
          + NEW NOTE / 새 노트
        </button>
      )}

      {notes.length === 0 ? (
        <div className="font-mono text-xs tracking-[0.2em] text-muted py-4">
          NO NOTES YET / 아직 작성된 노트가 없어요.
        </div>
      ) : (
        notes.map((n) => <NoteCard key={n.id} note={n} />)
      )}
    </div>
  );
}
