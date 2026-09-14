"use client";

import { useEffect, useState } from "react";
import { SearchDialog } from "./SearchDialog";

export function SearchTrigger() {
  const [open, setOpen] = useState(false);

  // Open with ⌘K / Ctrl+K from anywhere.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-[11px] tracking-[0.2em] text-ink hover:text-red transition-colors flex flex-col items-start leading-tight cursor-pointer py-2"
        aria-label="Search"
        title="Search (⌘K)"
      >
        <span>⌕ SEARCH</span>
        <span className="text-muted text-[11px] mt-0.5">
          <span className="tracking-normal">검색</span>
          <span className="hidden md:inline"> ⌘K</span>
        </span>
      </button>
      <SearchDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
