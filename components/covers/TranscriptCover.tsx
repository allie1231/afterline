import type { Source } from "@/lib/data/types";

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getFullYear()).slice(2)}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function FakeLine({ width = 80 }: { width?: number }) {
  return (
    <div className="flex flex-col gap-[3px]">
      <div className="h-px bg-ink/35" style={{ width: `${width}%` }} />
      <div className="h-px bg-ink/30" style={{ width: `${width - 18}%` }} />
    </div>
  );
}

export function TranscriptCover({
  source,
  accent,
}: {
  source: Source;
  accent: string;
}) {
  return (
    <div className="relative w-full h-full bg-paper text-ink overflow-hidden flex">
      {/* Accent stripe on the left edge */}
      <div className="w-2 h-full" style={{ background: accent }} />

      <div className="flex-1 flex flex-col p-3 min-w-0">
        {/* Header */}
        <div className="flex justify-between font-mono text-[7px] tracking-[0.3em] text-muted border-b border-ink/30 pb-1.5">
          <span>TRANSCRIPT</span>
          <span>NO. {source.id.slice(-3).toUpperCase()}</span>
        </div>

        {/* Title */}
        <div className="mt-3">
          <div className="font-serif text-[18px] leading-[0.98] tracking-tight uppercase break-words">
            {source.title}
          </div>
          {source.creator && (
            <div className="font-mono text-[7px] tracking-[0.28em] uppercase mt-1.5 text-muted">
              WITH {source.creator}
            </div>
          )}
        </div>

        {/* Fake dialog */}
        <div className="mt-4 flex flex-col gap-3 flex-1 min-h-0">
          <div>
            <div className="font-mono text-[7px] tracking-[0.3em] text-muted mb-1">
              A —
            </div>
            <FakeLine width={92} />
          </div>
          <div className="pl-3">
            <div className="font-mono text-[7px] tracking-[0.3em] text-muted mb-1">
              B —
            </div>
            <FakeLine width={78} />
          </div>
          <div>
            <div className="font-mono text-[7px] tracking-[0.3em] text-muted mb-1">
              A —
            </div>
            <FakeLine width={64} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 border-t border-ink/30 pt-1.5 flex justify-between font-mono text-[7px] tracking-[0.3em] text-muted">
          <span>{fmtDate(source.created_at)}</span>
          <span>AFTERLINE</span>
        </div>
      </div>
    </div>
  );
}
