import type { Source } from "@/lib/data/types";

export function ArchiveCover({
  source,
  accent,
  contrast,
}: {
  source: Source;
  accent: string;
  contrast: "light" | "dark";
}) {
  const tabFg = contrast === "dark" ? "var(--white)" : "var(--ink)";
  const fileNo = source.id.slice(-5).toUpperCase();

  return (
    <div className="relative w-full h-full bg-paper text-ink overflow-hidden flex flex-col border border-ink/15">
      {/* Folder tab */}
      <div className="relative h-7">
        <div
          className="absolute left-3 top-0 px-3 h-7 flex items-center font-mono text-[8px] tracking-[0.3em]"
          style={{
            background: accent,
            color: tabFg,
            clipPath:
              "polygon(0 0, calc(100% - 8px) 0, 100% 100%, 0 100%)",
          }}
        >
          FILE
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-3 min-h-0">
        {/* Stamp row */}
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-[7px] tracking-[0.3em] border border-ink px-1.5 py-[2px]">
            ARCHIVE
          </span>
          <span className="font-mono text-[7px] tracking-[0.3em] text-muted">
            NO. {fileNo}
          </span>
        </div>

        {/* Title */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="font-mono text-[7px] tracking-[0.28em] text-muted mb-1">
            SUBJECT
          </div>
          <div className="font-serif text-[20px] uppercase leading-[0.95] tracking-tight break-words">
            {source.title}
          </div>
          {source.creator && (
            <div className="font-mono text-[7px] tracking-[0.28em] uppercase mt-2 text-muted">
              FROM {source.creator}
            </div>
          )}
        </div>

        {/* Lined entry section (like an index card) */}
        <div className="flex flex-col gap-[6px] mt-3">
          <div className="h-px bg-ink/25" />
          <div className="h-px bg-ink/25" />
          <div className="h-px bg-ink/25" />
        </div>

        {/* Footer */}
        <div className="mt-3 pt-1.5 border-t border-ink/30 flex justify-between font-mono text-[7px] tracking-[0.3em] text-muted">
          <span>UNCATEGORIZED</span>
          <span>AFTERLINE</span>
        </div>
      </div>

      {/* Tilted "FILED" stamp */}
      <div
        className="absolute right-2 bottom-14 font-mono text-[9px] tracking-[0.3em] border px-1.5 py-[2px] rotate-[-12deg] opacity-50"
        style={{ borderColor: accent, color: accent }}
      >
        FILED
      </div>
    </div>
  );
}
