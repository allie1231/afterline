"use client";

import { useState, useTransition } from "react";
import {
  deleteQuoteAction,
  updateQuoteAction,
} from "@/app/sources/[id]/actions";
import { SaveQuoteButton } from "./SaveQuoteButton";
import type { Quote, Source } from "@/lib/data/types";

export function QuoteRow({
  quote,
  index,
  source,
}: {
  quote: Quote;
  index: number;
  source: Source;
}) {
  const sourceId = source.id;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(quote.text);
  const [page, setPage] = useState(quote.page ?? "");
  const [note, setNote] = useState(quote.note ?? "");
  const [tags, setTags] = useState(quote.mood_tags.join(", "));
  const [favorite, setFavorite] = useState(quote.is_favorite);
  const [pending, startTransition] = useTransition();

  function reset() {
    setText(quote.text);
    setPage(quote.page ?? "");
    setNote(quote.note ?? "");
    setTags(quote.mood_tags.join(", "));
    setFavorite(quote.is_favorite);
  }

  function save() {
    startTransition(async () => {
      await updateQuoteAction(quote.id, sourceId, {
        text: text.trim(),
        page: page.trim() || null,
        note: note.trim() || null,
        mood_tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
        is_favorite: favorite,
      });
      setEditing(false);
    });
  }

  function handleDelete() {
    if (!confirm("이 문장을 삭제할까요? 되돌릴 수 없어요.")) return;
    startTransition(async () => {
      await deleteQuoteAction(quote.id, sourceId);
    });
  }

  if (editing) {
    return (
      <li className="grid grid-cols-[40px_1fr] gap-6">
        <div className="font-mono text-[10px] tracking-[0.2em] text-muted pt-2">
          {String(index + 1).padStart(2, "0")}
        </div>
        <div className="flex flex-col gap-3 border border-ink p-4 bg-paper">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full border border-line bg-paper px-3 py-2 font-serif text-xl leading-snug focus:outline-none focus:border-blue resize-y"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="font-mono text-[9px] tracking-[0.3em] text-muted mb-1">
                PAGE / LOCATION
              </div>
              <input
                type="text"
                value={page}
                onChange={(e) => setPage(e.target.value)}
                className="w-full border border-line bg-paper px-3 py-2 font-serif text-base focus:outline-none focus:border-blue"
              />
            </div>
            <div>
              <div className="font-mono text-[9px] tracking-[0.3em] text-muted mb-1">
                TAGS
              </div>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full border border-line bg-paper px-3 py-2 font-serif text-base focus:outline-none focus:border-blue"
              />
            </div>
          </div>
          <div>
            <div className="font-mono text-[9px] tracking-[0.3em] text-muted mb-1">
              MEMO
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full border border-line bg-paper px-3 py-2 font-sans text-sm leading-snug focus:outline-none focus:border-blue resize-y"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={favorite}
              onChange={(e) => setFavorite(e.target.checked)}
              className="w-4 h-4 accent-red"
            />
            <span className="font-mono text-[10px] tracking-[0.25em]">
              FAVORITE / 즐겨찾기
            </span>
          </label>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="font-mono text-[10px] tracking-[0.3em] border border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
            >
              SAVE
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                setEditing(false);
              }}
              disabled={pending}
              className="font-mono text-[10px] tracking-[0.3em] text-muted px-3 py-2 hover:text-ink"
            >
              CANCEL
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="group grid grid-cols-[40px_1fr] gap-6 relative">
      <div className="font-mono text-[10px] tracking-[0.2em] text-muted pt-2">
        {String(index + 1).padStart(2, "0")}
      </div>
      <div>
        <p className="font-serif text-2xl leading-snug whitespace-pre-line">
          {quote.text}
        </p>
        {quote.page && (
          <div className="font-mono text-[10px] tracking-[0.25em] text-muted mt-2">
            p. {quote.page}
          </div>
        )}
        {quote.note && (
          <div className="mt-3">
            <div className="font-mono text-[10px] tracking-[0.2em] text-muted">
              memo
            </div>
            <p className="font-sans text-sm mt-1">{quote.note}</p>
          </div>
        )}
        {quote.mood_tags.length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {quote.mood_tags.map((m) => (
              <span
                key={m}
                className="font-mono text-[10px] tracking-[0.2em] border border-line px-2 py-0.5"
              >
                {m}
              </span>
            ))}
          </div>
        )}
        {quote.is_favorite && (
          <div className="mt-3 font-mono text-[10px] tracking-[0.25em] text-red">
            ★ FAVORITE
          </div>
        )}

        <div className="mt-3">
          <SaveQuoteButton quote={quote} source={source} />
        </div>

        {/* Hover actions */}
        <div className="absolute top-1 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="font-mono text-[10px] tracking-[0.3em] border border-ink px-2 py-1 bg-paper hover:bg-ink hover:text-paper transition-colors"
          >
            EDIT
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="font-mono text-[10px] tracking-[0.3em] border border-line text-muted px-2 py-1 bg-paper hover:border-red hover:text-red transition-colors disabled:opacity-50"
            title="Delete"
          >
            ×
          </button>
        </div>
      </div>
    </li>
  );
}
