import type { Source } from "@/lib/data/types";

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")} ${d.getFullYear()}`;
}

function FakeColumn({ rows = 16 }: { rows?: number }) {
  return (
    <div className="flex-1 flex flex-col gap-[3px] overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-px bg-ink/30"
          style={{ width: `${65 + ((i * 23) % 35)}%` }}
        />
      ))}
    </div>
  );
}

export function NewspaperCover({
  source,
  accent,
  contrast,
}: {
  source: Source;
  accent: string;
  contrast: "light" | "dark";
}) {
  const stampFg = contrast === "dark" ? "var(--white)" : "var(--ink)";
  const domain = source.url
    ? (() => {
        try {
          return new URL(source.url!).hostname.replace(/^www\./, "").toUpperCase();
        } catch {
          return "AFTERLINE";
        }
      })()
    : "AFTERLINE";

  return (
    <div className="relative w-full h-full bg-paper text-ink overflow-hidden flex flex-col">
      {/* Masthead */}
      <div className="px-3 pt-3 pb-2 border-b-2 border-ink">
        <div className="flex items-center justify-between font-mono text-[7px] tracking-[0.3em] text-muted">
          <span>VOL. I</span>
          <span>NO. {source.id.slice(-3).toUpperCase()}</span>
        </div>
        <div className="font-serif text-[22px] text-center leading-none tracking-tight mt-1 italic">
          The Gazette
        </div>
        <div className="flex justify-between font-mono text-[6px] tracking-[0.3em] text-muted mt-1.5">
          <span>EST. 2026</span>
          <span>{fmtDate(source.created_at)}</span>
        </div>
      </div>

      {/* Section tag in accent */}
      <div className="px-3 mt-2.5">
        <span
          className="inline-block font-mono text-[7px] tracking-[0.3em] px-1.5 py-[3px]"
          style={{ background: accent, color: stampFg }}
        >
          EDITORIAL
        </span>
      </div>

      {/* Headline */}
      <div className="px-3 mt-2 flex-1 flex flex-col min-h-0">
        <h3 className="font-serif text-[18px] leading-[0.98] tracking-tight break-words">
          {source.title}
        </h3>
        {source.creator && (
          <div className="font-mono text-[7px] tracking-[0.28em] uppercase mt-1.5 text-muted">
            BY {source.creator}
          </div>
        )}

        {/* Fake body columns */}
        <div className="mt-2.5 flex gap-2 flex-1 min-h-0 pb-2">
          <FakeColumn />
          <div className="w-px bg-ink/15" />
          <FakeColumn />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-ink mx-3" />
      <div className="px-3 py-1.5 flex justify-between font-mono text-[6px] tracking-[0.3em] text-muted">
        <span>{domain}</span>
        <span>AFTERLINE CLIPPING</span>
      </div>
    </div>
  );
}
