"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Markdown } from "@/components/Markdown";
import type { NoteWithSource } from "@/lib/data/repository";
import type { SourceType } from "@/lib/data/types";
import { ROOM_CATEGORIES } from "@/lib/data/categories";

const ROOM_TYPES: SourceType[] = ROOM_CATEGORIES.map((c) => c.type);

function fmtDate(iso: string) {
  return iso.slice(0, 10).replace(/-/g, ".");
}

export function NotesBrowser({ items }: { items: NoteWithSource[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<SourceType | "all">("all");

  const kinds = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) if (it.note.kind) s.add(it.note.kind);
    return [...s].sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (typeFilter !== "all" && it.source?.type !== typeFilter) return false;
      if (kind && it.note.kind !== kind) return false;
      if (q) {
        const hay =
          (it.note.title ?? "").toLowerCase() +
          " " +
          it.note.body.toLowerCase() +
          " " +
          (it.source?.title ?? "").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, query, kind, typeFilter]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6 border-b border-line pb-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목 / 본문 / 출처 검색…"
          className="flex-1 min-w-[200px] border border-ink bg-paper px-3 py-2 font-serif text-base focus:outline-none focus:border-blue"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as SourceType | "all")}
          className="font-mono text-[10px] tracking-[0.2em] border border-ink bg-paper px-3 py-2 focus:outline-none cursor-pointer"
        >
          <option value="all">ALL ROOMS</option>
          {ROOM_TYPES.map((t) => {
            const cat = ROOM_CATEGORIES.find((c) => c.type === t)!;
            return (
              <option key={t} value={t}>
                {cat.en} / {cat.ko}
              </option>
            );
          })}
        </select>
        {kinds.length > 0 && (
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="font-mono text-[10px] tracking-[0.2em] border border-ink bg-paper px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="">ALL KINDS</option>
            {kinds.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-4">
        {String(filtered.length).padStart(3, "0")} NOTES
      </div>

      {filtered.length === 0 ? (
        <div className="font-mono text-xs tracking-[0.2em] text-muted py-20 text-center">
          {items.length === 0
            ? "NO NOTES YET / 아직 작성된 노트가 없어요. 소스 페이지에서 + NEW NOTE 를 눌러보세요."
            : "필터에 맞는 노트가 없어요."}
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {filtered.map((it) => (
            <li key={it.note.id}>
              <NoteRow item={it} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NoteRow({ item }: { item: NoteWithSource }) {
  const { note, source } = item;
  // Strip [[q:id]] tokens from the preview so raw refs don't leak. Full
  // resolved embeds live on the source page.
  const preview = note.body
    .replace(/\[\[q:[0-9a-fA-F-]{8,36}\]\]/g, "(인용)")
    .slice(0, 240);

  return (
    <article className="border border-line bg-paper p-4 hover:border-ink transition-colors">
      <header className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-baseline gap-3 flex-wrap">
          {note.kind && (
            <span className="font-mono text-[10px] tracking-[0.25em] border border-ink px-2 py-0.5">
              {note.kind}
            </span>
          )}
          <span className="font-mono text-[10px] tracking-[0.25em] text-muted">
            {fmtDate(note.created_at)}
          </span>
        </div>
        {source && (
          <Link
            href={`/sources/${source.id}#notes`}
            className="font-mono text-[10px] tracking-[0.25em] text-muted hover:text-ink truncate max-w-[60%]"
            title={source.title}
          >
            {source.title} ↗
          </Link>
        )}
      </header>

      {note.title && (
        <h3 className="font-serif text-xl tracking-tight leading-tight mb-2">
          {note.title}
        </h3>
      )}

      <div className="text-base text-muted line-clamp-4">
        <Markdown source={preview} />
      </div>

      {source && (
        <Link
          href={`/sources/${source.id}#notes`}
          className="mt-3 inline-block font-mono text-[10px] tracking-[0.3em] text-muted hover:text-ink"
        >
          READ MORE →
        </Link>
      )}
    </article>
  );
}
