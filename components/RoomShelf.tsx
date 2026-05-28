"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { SourceSpine } from "./SourceSpine";
import {
  deleteSourcesBulkAction,
  moveSourcesBulkAction,
} from "@/app/rooms/[type]/actions";
import { updateSourceSpineColorAction } from "@/app/sources/[id]/actions";
import { ROOM_CATEGORIES } from "@/lib/data/categories";
import { SPINE_COLORS } from "@/lib/data/spine-colors";
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
  const [moveOpen, setMoveOpen] = useState(false);
  const [colorPickerForId, setColorPickerForId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const moveRef = useRef<HTMLDivElement>(null);

  // Close MOVE TO dropdown on outside click
  useEffect(() => {
    if (!moveOpen) return;
    function onClick(e: MouseEvent) {
      if (moveRef.current && !moveRef.current.contains(e.target as Node)) {
        setMoveOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [moveOpen]);

  // Close color picker on Escape
  useEffect(() => {
    if (!colorPickerForId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setColorPickerForId(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [colorPickerForId]);

  const colorPickerTarget = useMemo(
    () =>
      colorPickerForId
        ? sourceCounts.find(({ source }) => source.id === colorPickerForId)
            ?.source ?? null
        : null,
    [colorPickerForId, sourceCounts],
  );

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
    setMoveOpen(false);
    setColorPickerForId(null);
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

  function handleBulkMove(targetType: SourceType) {
    if (selected.size === 0 || targetType === type) return;
    const target = ROOM_CATEGORIES.find((c) => c.type === targetType);
    const ok = confirm(
      `${selected.size}개의 출처를 ${target?.en} (${target?.ko}) 룸으로 옮길까요?`,
    );
    if (!ok) return;
    startTransition(async () => {
      await moveSourcesBulkAction([...selected], type, targetType);
      setSelected(new Set());
      setEditMode(false);
      setMoveOpen(false);
    });
  }

  function applyColor(value: string) {
    if (!colorPickerForId) return;
    const next = value === "auto" ? null : value;
    const id = colorPickerForId;
    startTransition(async () => {
      await updateSourceSpineColorAction(id, next);
      setColorPickerForId(null);
    });
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-end gap-3 mb-3 min-h-[28px] flex-wrap">
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

            {/* MOVE TO */}
            <div ref={moveRef} className="relative">
              <button
                type="button"
                onClick={() => setMoveOpen((o) => !o)}
                disabled={pending || selected.size === 0}
                className="font-mono text-[10px] tracking-[0.3em] border border-ink px-3 py-1.5 hover:bg-ink hover:text-paper transition-colors disabled:opacity-40"
              >
                MOVE {String(selected.size).padStart(2, "0")} ▾
              </button>
              {moveOpen && (
                <div className="absolute top-full right-0 mt-2 z-30 bg-paper border border-ink min-w-[220px] shadow-[4px_4px_0_var(--ink)]">
                  <div className="font-mono text-[9px] tracking-[0.3em] text-muted px-3 py-2 border-b border-line">
                    MOVE TO ROOM / 룸 이동
                  </div>
                  {ROOM_CATEGORIES.map((cat) => {
                    const active = cat.type === type;
                    return (
                      <button
                        type="button"
                        key={cat.type}
                        disabled={active || pending}
                        onClick={() => handleBulkMove(cat.type)}
                        className={`flex w-full items-center justify-between px-3 py-2 font-mono text-[10px] tracking-[0.25em] border-b border-line last:border-b-0 transition-colors ${
                          active
                            ? "bg-line/30 text-muted cursor-default"
                            : "hover:bg-ink hover:text-paper cursor-pointer"
                        }`}
                      >
                        <span>
                          {cat.en} / {cat.ko}
                        </span>
                        {active ? (
                          <span className="text-[9px]">HERE</span>
                        ) : (
                          <span
                            className="w-2 h-2 inline-block"
                            style={{ background: cat.accent }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={pending || selected.size === 0}
              className="font-mono text-[10px] tracking-[0.3em] border border-ink px-3 py-1.5 hover:bg-red hover:text-paper hover:border-red transition-colors disabled:opacity-40"
            >
              {pending
                ? "WORKING…"
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

      {/* Inline palette panel — appears above shelf when a spine is being recolored */}
      {colorPickerForId && colorPickerTarget && (
        <div className="border border-ink bg-paper p-4 mb-3 shadow-[4px_4px_0_var(--ink)]">
          <div className="flex items-baseline justify-between mb-3">
            <div className="font-mono text-[10px] tracking-[0.3em] text-muted">
              SPINE COLOR / 책등 색
              <span className="text-ink ml-3 font-serif text-base">
                {colorPickerTarget.title}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setColorPickerForId(null)}
              className="text-base leading-none text-muted hover:text-ink"
              aria-label="Close color picker"
            >
              ×
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {SPINE_COLORS.map((c) => {
              // Highlight the spine's current color so the user sees what's set.
              const current = colorPickerTarget.spine_color ?? null;
              const isAuto = c.value === "auto";
              const matches =
                (isAuto && (current == null || current === "")) ||
                current === c.value;
              return (
                <button
                  type="button"
                  key={c.value}
                  disabled={pending}
                  onClick={() => applyColor(c.value)}
                  className="w-9 h-9 border border-ink flex items-center justify-center transition-transform hover:scale-110 disabled:opacity-50"
                  style={{
                    background: c.color ?? "var(--paper)",
                    outline: matches ? "2px solid var(--ink)" : "none",
                    outlineOffset: "2px",
                  }}
                  aria-label={c.label ?? "color"}
                  title={c.label ?? c.value}
                >
                  {!c.color && (
                    <span className="font-mono text-[8px] tracking-[0.2em]">
                      AUTO
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="border-y-2 border-ink">
        <div className="flex items-end gap-3 py-6 overflow-x-auto">
          {sourceCounts.map(({ source, lines }) => {
            const currentColor = source.spine_color?.trim();
            const isAuto = !currentColor;
            return (
              <div key={source.id} className="relative">
                <SourceSpine source={source} lines={lines} />
                {editMode && (
                  // Two-zone overlay: top toggles selection, bottom opens picker.
                  <div className="absolute inset-0 z-20 flex flex-col items-stretch pointer-events-none">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggle(source.id);
                      }}
                      className={`pointer-events-auto h-1/2 flex items-start justify-center pt-3 transition-colors ${
                        selected.has(source.id)
                          ? "bg-paper/60"
                          : "bg-paper/20 hover:bg-paper/45"
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
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setColorPickerForId(source.id);
                      }}
                      className={`pointer-events-auto h-1/2 flex items-end justify-center pb-3 transition-colors ${
                        colorPickerForId === source.id
                          ? "bg-paper/60"
                          : "bg-paper/20 hover:bg-paper/45"
                      }`}
                      aria-label={`Change spine color for ${source.title}`}
                      title={
                        isAuto
                          ? "AUTO — click to change"
                          : `${currentColor} — click to change`
                      }
                    >
                      <div className="w-5 h-5 rounded-full border-2 border-ink bg-paper flex items-center justify-center overflow-hidden">
                        {isAuto ? (
                          <span className="font-mono text-[6px] tracking-[0.15em] leading-none">
                            AUTO
                          </span>
                        ) : (
                          <div
                            className="w-full h-full"
                            style={{ background: currentColor }}
                          />
                        )}
                      </div>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 font-mono text-[10px] tracking-[0.25em] text-muted">
        SHELF · {String(sourceCounts.length).padStart(2, "0")} ITEMS
      </div>
    </div>
  );
}
