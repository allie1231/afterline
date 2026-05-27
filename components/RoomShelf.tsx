"use client";

import { useState, useTransition } from "react";
import { SourceSpine } from "./SourceSpine";
import { deleteSourcesBulkAction } from "@/app/rooms/[type]/actions";
import type { Source, SourceType } from "@/lib/data/types";

export function RoomShelf({
  type,
  sourceCounts,
}: {
  type: SourceType;
  sourceCounts: { source: Source; lines: number }[];
}) {
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(sourceCounts.map(({ source }) => source.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function exitEditMode() {
    setSelected(new Set());
    setEditMode(false);
  }

  function handleBulkDelete() {
    if (selected.size === 0) return;
    const ok = confirm(
      `${selected.size}개의 출처와 거기 담긴 모든 문장을 삭제할까요?\n되돌릴 수 없어요.`,
    );
    if (!ok) return;
    startTransition(async () => {
      await deleteSourcesBulkAction([...selected], type);
      setSelected(new Set());
      setEditMode(false);
    });
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-end gap-3 mb-3 min-h-[28px]">
        {editMode ? (
          <>
            <span className="font-mono text-[10px] tracking-[0.25em] text-muted">
              {selected.size} SELECTED · {sourceCounts.length} TOTAL
            </span>
            <button
              type="button"
              onClick={
                selected.size === sourceCounts.length
                  ? clearSelection
                  : selectAll
              }
              className="font-mono text-[10px] tracking-[0.3em] text-muted hover:text-ink"
            >
              {selected.size === sourceCounts.length
                ? "DESELECT ALL"
                : "SELECT ALL"}
            </button>
            <button
              type="button"
              onClick={exitEditMode}
              className="font-mono text-[10px] tracking-[0.3em] text-muted hover:text-ink"
            >
              × DONE
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={pending || selected.size === 0}
              className="font-mono text-[10px] tracking-[0.3em] border border-ink px-3 py-1.5 hover:bg-red hover:text-paper hover:border-red transition-colors disabled:opacity-40"
            >
              {pending
                ? "DELETING…"
                : `DELETE ${String(selected.size).padStart(2, "0")}`}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEditMode(true)}
            className="font-mono text-[10px] tracking-[0.3em] text-muted hover:text-ink"
          >
            EDIT / 정리
          </button>
        )}
      </div>

      <div className="border-y-2 border-ink">
        <div className="flex items-end gap-3 py-6 overflow-x-auto">
          {sourceCounts.map(({ source, lines }, i) => (
            <div key={source.id} className="relative">
              <SourceSpine source={source} lines={lines} index={i} />
              {editMode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggle(source.id);
                  }}
                  className={`absolute inset-0 z-20 flex items-start justify-center pt-3 transition-colors ${
                    selected.has(source.id)
                      ? "bg-paper/55"
                      : "bg-paper/20 hover:bg-paper/40"
                  }`}
                  aria-label={`Select ${source.title}`}
                >
                  <div
                    className={`w-5 h-5 border-2 border-ink flex items-center justify-center font-mono text-xs ${
                      selected.has(source.id)
                        ? "bg-ink text-paper"
                        : "bg-paper"
                    }`}
                  >
                    {selected.has(source.id) && "✓"}
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 font-mono text-[10px] tracking-[0.25em] text-muted">
        SHELF · {String(sourceCounts.length).padStart(2, "0")} ITEMS
      </div>
    </div>
  );
}
