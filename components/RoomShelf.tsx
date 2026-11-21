"use client";

import { SourceSpine } from "./SourceSpine";
import type { RoomSlug, Source } from "@/lib/data/types";

export function RoomShelf({
  sourceCounts,
}: {
  slug: RoomSlug;
  sourceCounts: { source: Source; lines: number }[];
}) {
  return (
    <div className="relative">
      <div className="flex items-center justify-end mb-3 min-h-[28px]">
        <button
          type="button"
          onClick={() => {
            fetch("/api/revalidate", { method: "POST" }).then(() =>
              window.location.reload(),
            );
          }}
          className="font-mono text-[11px] tracking-[0.3em] text-muted hover:text-ink py-2"
        >
          REFRESH / <span className="tracking-normal">새로고침</span>
        </button>
      </div>

      <div className="border-y-2 border-ink">
        <div className="flex flex-wrap items-end gap-y-5 py-6 pb-2">
          {sourceCounts.map(({ source, lines }) => (
            <SourceSpine key={source.id} source={source} lines={lines} />
          ))}
        </div>
      </div>
      <div className="mt-3 font-mono text-[11px] tracking-[0.25em] text-muted">
        SHELF · {String(sourceCounts.length).padStart(2, "0")} ITEMS
      </div>
    </div>
  );
}
