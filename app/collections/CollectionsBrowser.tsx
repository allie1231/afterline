"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ROOM_CATEGORIES } from "@/lib/data/categories";
import { SourceCover } from "@/components/SourceCover";
import type { CollectionsItem } from "@/lib/data/repository";
import type { SourceType } from "@/lib/data/types";

const STATUS_LABEL: Record<string, string> = {
  to_read: "TO READ",
  reading: "READING",
  finished: "FINISHED",
  archived: "ARCHIVED",
};

type SortKey = "recent" | "oldest" | "title" | "lines";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "RECENT / 최근" },
  { value: "oldest", label: "OLDEST / 오래된" },
  { value: "title", label: "TITLE A→Z / 제목" },
  { value: "lines", label: "MOST LINES / 라인 많은" },
];

export function CollectionsBrowser({ items }: { items: CollectionsItem[] }) {
  const [type, setType] = useState<SourceType | "all">("all");
  const [favOnly, setFavOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");

  // Per-type counts shown in the filter chips
  const countsByType = useMemo(() => {
    const c = new Map<SourceType, number>();
    for (const it of items) {
      c.set(it.source.type, (c.get(it.source.type) ?? 0) + 1);
    }
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (type !== "all") list = list.filter((it) => it.source.type === type);
    if (favOnly) list = list.filter((it) => it.favorites > 0);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (it) =>
          it.source.title.toLowerCase().includes(q) ||
          (it.source.creator ?? "").toLowerCase().includes(q),
      );
    }
    list = [...list];
    switch (sort) {
      case "recent":
        list.sort((a, b) => b.last_touch.localeCompare(a.last_touch));
        break;
      case "oldest":
        list.sort((a, b) => a.last_touch.localeCompare(b.last_touch));
        break;
      case "title":
        list.sort((a, b) => a.source.title.localeCompare(b.source.title, "ko"));
        break;
      case "lines":
        list.sort((a, b) => b.lines - a.lines);
        break;
    }
    return list;
  }, [items, type, favOnly, query, sort]);

  return (
    <div>
      {/* Type filter row */}
      <div className="flex flex-wrap gap-px bg-ink border border-ink mb-4">
        <FilterChip
          active={type === "all"}
          onClick={() => setType("all")}
          color={null}
          label="ALL"
          ko="전체"
          count={items.length}
        />
        {ROOM_CATEGORIES.map((cat) => (
          <FilterChip
            key={cat.type}
            active={type === cat.type}
            onClick={() => setType(cat.type)}
            color={cat.accent}
            contrast={cat.contrast}
            label={cat.en}
            ko={cat.ko}
            count={countsByType.get(cat.type) ?? 0}
          />
        ))}
      </div>

      {/* Search + favorites + sort */}
      <div className="flex flex-wrap items-center gap-3 mb-8 border-b border-line pb-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목 / 저자 검색..."
          className="flex-1 min-w-[200px] border border-ink bg-paper px-3 py-2 font-serif text-base focus:outline-none focus:border-blue"
        />
        <button
          type="button"
          onClick={() => setFavOnly((v) => !v)}
          className={`font-mono text-[10px] tracking-[0.3em] border px-3 py-2 transition-colors ${
            favOnly
              ? "bg-red border-red text-paper"
              : "border-ink hover:bg-ink hover:text-paper"
          }`}
        >
          ★ FAVS ONLY
        </button>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="font-mono text-[10px] tracking-[0.2em] border border-ink bg-paper px-3 py-2 focus:outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-4">
        {String(filtered.length).padStart(3, "0")} ITEMS
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div className="font-mono text-xs tracking-[0.2em] text-muted py-20 text-center">
          NO ITEMS / 조건에 맞는 출처가 없습니다.
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line">
          {filtered.map((it) => (
            <CollectionCard key={it.source.id} item={it} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  color,
  contrast,
  label,
  ko,
  count,
}: {
  active: boolean;
  onClick: () => void;
  color: string | null;
  contrast?: "light" | "dark";
  label: string;
  ko: string;
  count: number;
}) {
  const isLight = contrast === "light";
  const activeColor = color ?? "var(--ink)";
  const activeText =
    color == null ? "var(--paper)" : isLight ? "var(--ink)" : "var(--white)";
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-2.5 text-left transition-colors flex flex-col"
      style={{
        background: active ? activeColor : "var(--paper)",
        color: active ? activeText : "var(--ink)",
      }}
    >
      <span className="font-serif text-sm leading-none tracking-tight">
        {label}
      </span>
      <span
        className="font-mono text-[9px] tracking-[0.25em] mt-1"
        style={{ opacity: 0.7 }}
      >
        {ko} · {String(count).padStart(2, "0")}
      </span>
    </button>
  );
}

// Types whose cards stay typographic — no thumbnail block on the left.
const NO_THUMB_TYPES = new Set<SourceType>(["article", "conversation"]);

function CollectionCard({ item }: { item: CollectionsItem }) {
  const cat = ROOM_CATEGORIES.find((c) => c.type === item.source.type)!;
  const statusLabel = item.note?.status
    ? STATUS_LABEL[item.note.status]
    : null;
  const showThumb = !NO_THUMB_TYPES.has(item.source.type);

  return (
    <li className="bg-paper hover:bg-line/30 transition-colors">
      <Link
        href={`/sources/${item.source.id}`}
        className="flex gap-4 items-start p-4 h-full"
      >
        {showThumb && (
          <div className="shrink-0">
            <SourceCover source={item.source} category={cat} size="sm" />
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <span
              className="font-mono text-[9px] tracking-[0.3em]"
              style={{ color: cat.accent }}
            >
              {cat.en}
            </span>
            {item.favorites > 0 && (
              <span className="font-mono text-[9px] tracking-[0.25em] text-red">
                ★ {item.favorites}
              </span>
            )}
          </div>
          <div className="font-serif text-lg leading-tight tracking-tight line-clamp-2">
            {item.source.title}
          </div>
          {item.source.creator && (
            <div className="font-mono text-[10px] tracking-[0.2em] text-muted mt-1 truncate">
              {item.source.creator}
            </div>
          )}
          <div className="mt-auto pt-3 flex gap-3 flex-wrap font-mono text-[9px] tracking-[0.25em] text-muted">
            <span>{String(item.lines).padStart(2, "0")} LINES</span>
            {statusLabel && <span>· {statusLabel}</span>}
            {item.note?.rating != null && (
              <span>· {"★".repeat(Math.round(item.note.rating))}</span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
