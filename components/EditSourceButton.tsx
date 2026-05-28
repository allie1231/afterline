"use client";

import { useState } from "react";
import { EditSourceDialog } from "./EditSourceDialog";
import type { Source } from "@/lib/data/types";

export function EditSourceButton({ source }: { source: Source }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-[10px] tracking-[0.3em] border border-ink px-3 py-1.5 hover:bg-ink hover:text-paper transition-colors"
      >
        [ EDIT INFO ]
      </button>
      {open && (
        <EditSourceDialog source={source} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
