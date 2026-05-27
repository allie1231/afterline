"use client";

import { useMemo, useState } from "react";
import { QuoteRow } from "./QuoteRow";
import type { Quote } from "@/lib/data/types";

export function QuoteList({
  quotes,
  sourceId,
}: {
  quotes: Quote[];
  sourceId: string;
}) {
  const [query, setQuery] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

  const allTags = useMemo(() => {
    const s = new Set<string>();
    for (const q of quotes) for (const t of q.mood_tags ?? []) s.add(t);
    return [...s].sort();
  }, [quotes]);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return quotes.filter((q) => {
      if (favOnly && !q.is_favorite) return false;
      if (activeTags.size > 0) {
        // require ALL selected tags
        for (const t of activeTags) {
          if (!q.mood_tags.includes(t)) return false;
        }
      }
      if (trimmed) {
        const hay =
          q.text.toLowerCase() + " " + (q.note ?? "").toLowerCase();
        if (!hay.includes(trimmed)) return false;
      }
      return true;
    });
  }, [quotes, query, favOnly, activeTags]);

  const anyFilter =
    query.trim().length > 0 || favOnly || activeTags.size > 0;

  function toggleTag(t: string) {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  function clearAll() {
    setQuery("");
    setFavOnly(false);
    setActiveTags(new Set());
  }

  // Only show the filter bar when there are enough quotes for filtering to matter.
  const showFilters = quotes.length >= 4;

  return (
    <>
      {showFilters && (
        <div className="flex flex-col gap-2 border border-line bg-paper p-3 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이 출처 안에서 문장·메모 검색…"
              className="flex-1 min-w-[180px] border border-ink bg-paper px-3 py-1.5 font-serif text-base focus:outline-none focus:border-blue"
            />
            <button
              type="button"
              onClick={() => setFavOnly((v) => !v)}
              className={`font-mono text-[10px] tracking-[0.3em] border px-3 py-1.5 transition-colors ${
                favOnly
                  ? "bg-red border-red text-paper"
                  : "border-ink hover:bg-ink hover:text-paper"
              }`}
            >
              ★ FAVS
            </button>
            {anyFilter && (
              <button
                type="button"
                onClick={clearAll}
                className="font-mono text-[10px] tracking-[0.3em] text-muted hover:text-ink"
              >
                × RESET
              </button>
            )}
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {allTags.map((t) => {
                const on = activeTags.has(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={`font-mono text-[10px] tracking-[0.2em] border px-2 py-1 transition-colors ${
                      on
                        ? "bg-ink text-paper border-ink"
                        : "border-line hover:border-ink"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          )}
          {anyFilter && (
            <div className="font-mono text-[9px] tracking-[0.25em] text-muted">
              SHOWING {String(filtered.length).padStart(2, "0")} OF{" "}
              {String(quotes.length).padStart(2, "0")}
            </div>
          )}
        </div>
      )}

      <ol className="flex flex-col gap-8">
        {filtered.map((q, i) => (
          <QuoteRow key={q.id} quote={q} index={i} sourceId={sourceId} />
        ))}
        {quotes.length === 0 && (
          <li className="font-mono text-xs text-muted">
            NO LINES YET / 아직 수집된 문장이 없습니다.
          </li>
        )}
        {quotes.length > 0 && filtered.length === 0 && (
          <li className="font-mono text-xs text-muted">
            필터에 맞는 문장이 없어요.
          </li>
        )}
      </ol>
    </>
  );
}
