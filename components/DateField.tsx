"use client";

import { useTransition } from "react";
import { setNoteDateAction } from "@/app/sources/[id]/actions";

export function DateField({
  sourceId,
  field,
  label,
  initialDate,
}: {
  sourceId: string;
  field: "started_at" | "finished_at";
  label: string;
  initialDate: string | null | undefined;
}) {
  const [pending, startTransition] = useTransition();
  const dateValue = initialDate ? initialDate.slice(0, 10) : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    startTransition(async () => {
      await setNoteDateAction(sourceId, field, v || null);
    });
  }

  return (
    <div>
      <div className="font-mono text-[9px] tracking-[0.3em] text-muted">
        {label}
      </div>
      <input
        type="date"
        value={dateValue}
        onChange={handleChange}
        disabled={pending}
        className="font-mono text-sm tracking-normal mt-1 bg-transparent border-b border-line focus:border-ink focus:outline-none disabled:opacity-50 w-full"
      />
    </div>
  );
}
