"use client";

import { useState } from "react";
import { SourceCover } from "./SourceCover";
import { ChangeCoverDialog } from "./ChangeCoverDialog";
import type { RoomCategory, Source } from "@/lib/data/types";

const IMAGE_TYPES = new Set(["book", "lyrics", "movie"]);

export function CoverEditor({
  source,
  category,
}: {
  source: Source;
  category: RoomCategory;
}) {
  const [open, setOpen] = useState(false);
  const editable = IMAGE_TYPES.has(source.type);

  if (!editable) {
    // Article / conversation / other render their stylized cards;
    // changing a "cover" doesn't apply.
    return <SourceCover source={source} category={category} />;
  }

  return (
    <>
      <div className="relative group inline-block">
        <SourceCover source={source} category={category} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute inset-0 flex items-center justify-center bg-ink/70 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
          aria-label="Change cover"
        >
          <span className="font-mono text-[10px] tracking-[0.3em] text-paper border border-paper px-3 py-2">
            CHANGE COVER
          </span>
        </button>
      </div>
      {open && (
        <ChangeCoverDialog source={source} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
