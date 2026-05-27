"use client";

import { useTransition } from "react";
import { setStatusAction } from "@/app/sources/[id]/actions";
import type { ReadingStatus } from "@/lib/data/types";

const OPTIONS: { value: ReadingStatus | ""; label: string }[] = [
  { value: "", label: "UNFILED" },
  { value: "to_read", label: "TO READ" },
  { value: "reading", label: "READING" },
  { value: "finished", label: "FINISHED" },
  { value: "archived", label: "ARCHIVED" },
];

export function StatusPicker({
  sourceId,
  initialStatus,
}: {
  sourceId: string;
  initialStatus: ReadingStatus | null | undefined;
}) {
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value as ReadingStatus | "";
    startTransition(async () => {
      await setStatusAction(sourceId, v === "" ? null : v);
    });
  }

  return (
    <div>
      <div className="font-mono text-[9px] tracking-[0.3em] text-muted">
        STATUS
      </div>
      <select
        value={initialStatus ?? ""}
        onChange={handleChange}
        disabled={pending}
        className="font-mono text-sm tracking-[0.15em] mt-1 border border-ink px-2 py-0.5 bg-paper focus:outline-none cursor-pointer disabled:opacity-50"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
