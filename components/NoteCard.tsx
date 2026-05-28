"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Markdown } from "./Markdown";
import { NoteEditInline } from "./NoteEditor";
import { deleteNoteAction } from "@/app/notes/actions";
import type { Note } from "@/lib/data/types";

function fmtDate(iso: string) {
  return iso.slice(0, 10).replace(/-/g, ".");
}

export function NoteCard({ note }: { note: Note }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  function handleDelete() {
    if (!confirm("이 노트를 삭제할까요? 되돌릴 수 없어요.")) return;
    start(async () => {
      await deleteNoteAction(note.id);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <NoteEditInline
        noteId={note.id}
        initialKind={note.kind ?? ""}
        initialTitle={note.title ?? ""}
        initialBody={note.body}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <article className="border border-line bg-paper p-5 hover:border-ink transition-colors">
      <header className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-baseline gap-3 flex-wrap">
          {note.kind && (
            <span className="font-mono text-[10px] tracking-[0.25em] border border-ink px-2 py-0.5">
              {note.kind}
            </span>
          )}
          <span className="font-mono text-[10px] tracking-[0.25em] text-muted">
            {fmtDate(note.created_at)}
            {note.updated_at !== note.created_at && (
              <span className="ml-2 opacity-60">
                · 수정 {fmtDate(note.updated_at)}
              </span>
            )}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="font-mono text-[10px] tracking-[0.3em] border border-ink px-2 py-1 hover:bg-ink hover:text-paper transition-colors"
          >
            EDIT
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="font-mono text-[10px] tracking-[0.3em] border border-line text-muted px-2 py-1 hover:border-red hover:text-red transition-colors disabled:opacity-50"
          >
            ×
          </button>
        </div>
      </header>

      {note.title && (
        <h3 className="font-serif text-2xl tracking-tight leading-tight mb-3">
          {note.title}
        </h3>
      )}

      <Markdown source={note.body} />
    </article>
  );
}
