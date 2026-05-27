"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ROOM_CATEGORIES } from "@/lib/data/categories";
import { changeSourceTypeAction } from "@/app/sources/[id]/actions";
import type { SourceType } from "@/lib/data/types";

export function SourceTypeChanger({
  sourceId,
  currentType,
}: {
  sourceId: string;
  currentType: SourceType;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const current = ROOM_CATEGORIES.find((c) => c.type === currentType)!;

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function handleMove(newType: SourceType) {
    if (newType === currentType) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      await changeSourceTypeAction(sourceId, currentType, newType);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="font-mono text-[10px] tracking-[0.25em] text-muted hover:text-ink transition-colors flex items-center gap-1 disabled:opacity-50"
      >
        <span>
          {current.en} / {current.ko}
        </span>
        <span className="opacity-50 text-[8px]">▾</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-30 bg-paper border border-ink min-w-[220px] shadow-[4px_4px_0_var(--ink)]">
          <div className="font-mono text-[9px] tracking-[0.3em] text-muted px-3 py-2 border-b border-line">
            MOVE TO ROOM / 룸 이동
          </div>
          {ROOM_CATEGORIES.map((cat) => {
            const active = cat.type === currentType;
            return (
              <button
                type="button"
                key={cat.type}
                disabled={pending || active}
                onClick={() => handleMove(cat.type)}
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
                  <span className="text-[9px]">CURRENT</span>
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
  );
}
