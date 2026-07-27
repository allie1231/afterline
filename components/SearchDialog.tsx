"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchAction, type SearchHit } from "@/app/search/actions";
import { ROOM_CATEGORIES } from "@/lib/data/categories";
import type { SourceType } from "@/lib/data/types";

const CAT_BY_TYPE = Object.fromEntries(
  ROOM_CATEGORIES.map((c) => [c.type, c]),
) as Record<SourceType, (typeof ROOM_CATEGORIES)[number]>;

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow text-ink px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function snippet(text: string, query: string, radius = 60): string {
  if (!query.trim()) return text.slice(0, radius * 2);
  const lower = text.toLowerCase();
  const i = lower.indexOf(query.toLowerCase());
  if (i === -1) return text.slice(0, radius * 2);
  const start = Math.max(0, i - radius);
  const end = Math.min(text.length, i + query.length + radius);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return prefix + text.slice(start, end) + suffix;
}

const MATCH_LABEL: Record<SearchHit["matched_on"], string> = {
  title: "TITLE",
  creator: "CREATOR",
  text: "QUOTE",
  note: "NOTE",
  tag: "TAG",
};

export function SearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [selected, setSelected] = useState(0);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus the input each time the dialog opens, reset query.
  useEffect(() => {
    if (open) {
      setSelected(0);
      // Delay so the input is mounted.
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    } else {
      setQuery("");
      setHits([]);
    }
  }, [open]);

  // Debounced search on every keystroke.
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length === 0) {
      setHits([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const results = await searchAction(q);
        setHits(results);
        setSelected(0);
      });
    }, 180);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  function goTo(h: SearchHit) {
    onClose();
    router.push(`/sources/${h.source_id}`);
  }

  // Esc / arrows / enter
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => Math.min(hits.length - 1, s + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => Math.max(0, s - 1));
      } else if (e.key === "Enter") {
        const h = hits[selected];
        if (h) {
          e.preventDefault();
          goTo(h);
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, hits, selected]);

  const grouped = useMemo(() => {
    const sources = hits.filter((h) => !h.quote_id);
    const quotes = hits.filter((h) => !!h.quote_id);
    return { sources, quotes };
  }, [hits]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-ink/55"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed left-1/2 top-[15%] -translate-x-1/2 z-50 w-[min(720px,92vw)] max-h-[70vh] flex flex-col bg-paper border border-ink shadow-[6px_6px_0_var(--ink)]"
      >
        <header className="flex items-center gap-3 border-b border-ink px-4 py-3">
          <span className="font-mono text-[10px] tracking-[0.3em] text-muted">
            SEARCH
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="문장 · 출처 · 저자 · 메모 검색…"
            className="flex-1 bg-paper font-serif text-xl focus:outline-none"
          />
          <span className="font-mono text-[9px] tracking-[0.25em] text-muted">
            ⌘K · ESC
          </span>
        </header>

        <div className="flex-1 overflow-y-auto">
          {query.trim().length === 0 ? (
            <div className="px-4 py-10 text-center font-mono text-[10px] tracking-[0.3em] text-muted">
              TYPE TO SEARCH ACROSS EVERYTHING
            </div>
          ) : pending && hits.length === 0 ? (
            <div className="px-4 py-10 text-center font-mono text-[10px] tracking-[0.3em] text-muted">
              SEARCHING…
            </div>
          ) : hits.length === 0 ? (
            <div className="px-4 py-10 text-center font-mono text-[10px] tracking-[0.3em] text-muted">
              NO RESULTS / 결과 없음
            </div>
          ) : (
            <>
              {grouped.sources.length > 0 && (
                <>
                  <div className="font-mono text-[9px] tracking-[0.3em] text-muted px-4 pt-3 pb-1">
                    SOURCES · {String(grouped.sources.length).padStart(2, "0")}
                  </div>
                  <ul>
                    {grouped.sources.map((h) => (
                      <ResultRow
                        key={`s-${h.source_id}-${h.matched_on}`}
                        hit={h}
                        query={query}
                        active={hits.indexOf(h) === selected}
                        onSelect={() => goTo(h)}
                        onHover={() => setSelected(hits.indexOf(h))}
                      />
                    ))}
                  </ul>
                </>
              )}
              {grouped.quotes.length > 0 && (
                <>
                  <div className="font-mono text-[9px] tracking-[0.3em] text-muted px-4 pt-3 pb-1 border-t border-line">
                    QUOTES · {String(grouped.quotes.length).padStart(2, "0")}
                  </div>
                  <ul>
                    {grouped.quotes.map((h) => (
                      <ResultRow
                        key={`q-${h.quote_id}-${h.matched_on}`}
                        hit={h}
                        query={query}
                        active={hits.indexOf(h) === selected}
                        onSelect={() => goTo(h)}
                        onHover={() => setSelected(hits.indexOf(h))}
                      />
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>

        <footer className="border-t border-line px-4 py-2 flex items-center justify-between font-mono text-[9px] tracking-[0.25em] text-muted">
          <span>↑↓ NAVIGATE · ↵ OPEN · ESC CLOSE</span>
          <span>
            {hits.length > 0 &&
              `${String(selected + 1).padStart(2, "0")} / ${String(hits.length).padStart(2, "0")}`}
          </span>
        </footer>
      </div>
    </>
  );
}

function ResultRow({
  hit,
  query,
  active,
  onSelect,
  onHover,
}: {
  hit: SearchHit;
  query: string;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const cat = CAT_BY_TYPE[hit.source_type];
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        onMouseEnter={onHover}
        className={`w-full text-left px-4 py-3 border-b border-line transition-colors ${
          active ? "bg-line/60" : "hover:bg-line/30"
        }`}
      >
        <div className="flex items-baseline gap-2 mb-1">
          <span
            className="font-mono text-[9px] tracking-[0.3em] px-1.5 py-0.5"
            style={{
              background: cat?.accent,
              color: cat?.contrast === "dark" ? "var(--white)" : "var(--ink)",
            }}
          >
            {cat?.en ?? hit.source_type.toUpperCase()}
          </span>
          <span className="font-mono text-[9px] tracking-[0.25em] text-muted">
            · {MATCH_LABEL[hit.matched_on]}
          </span>
        </div>

        {hit.quote_text ? (
          <p className="font-sans text-sm leading-relaxed line-clamp-2">
            {highlight(snippet(hit.quote_text, query), query)}
          </p>
        ) : (
          <p className="font-serif text-lg leading-tight">
            {highlight(hit.source_title, query)}
          </p>
        )}

        <div className="font-mono text-[10px] tracking-[0.2em] text-muted mt-1.5 truncate">
          {hit.quote_text ? (
            <>
              — {hit.source_title}
              {hit.source_creator && <> · {highlight(hit.source_creator, query)}</>}
            </>
          ) : (
            hit.source_creator && <>{highlight(hit.source_creator, query)}</>
          )}
        </div>
      </button>
    </li>
  );
}
