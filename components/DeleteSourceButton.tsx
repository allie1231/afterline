"use client";

import { useTransition } from "react";
import { deleteSourceAction } from "@/app/sources/[id]/actions";
import type { SourceType } from "@/lib/data/types";

export function DeleteSourceButton({
  sourceId,
  type,
  title,
}: {
  sourceId: string;
  type: SourceType;
  title: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const ok = confirm(
      `『${title}』 출처와 거기 담긴 모든 문장을 삭제할까요?\n되돌릴 수 없어요.`,
    );
    if (!ok) return;
    startTransition(async () => {
      await deleteSourceAction(sourceId, type);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="font-mono text-[10px] tracking-[0.3em] text-muted hover:text-red transition-colors disabled:opacity-50"
    >
      {pending ? "DELETING…" : "× DELETE THIS SOURCE"}
    </button>
  );
}
