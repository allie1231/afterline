import type { Source } from "@/lib/data/types";

export function LPCover({
  source,
  accent,
  contrast,
}: {
  source: Source;
  accent: string;
  contrast: "light" | "dark";
}) {
  const initial = source.title.trim()[0]?.toUpperCase() ?? "A";
  const labelFg = contrast === "dark" ? "var(--white)" : "var(--ink)";

  return (
    <div className="relative w-full h-full bg-paper text-ink overflow-hidden">
      {/* Vinyl record — sits BEHIND the sleeve, peeking from the right */}
      <div
        className="absolute rounded-full"
        style={{
          width: 150,
          height: 150,
          left: 80,
          top: 20,
          background: "#0a0a0a",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        {/* concentric grooves */}
        <div className="absolute inset-[6px] rounded-full border border-white/12" />
        <div className="absolute inset-[14px] rounded-full border border-white/10" />
        <div className="absolute inset-[22px] rounded-full border border-white/10" />
        <div className="absolute inset-[32px] rounded-full border border-white/8" />
        <div className="absolute inset-[42px] rounded-full border border-white/8" />
        {/* center label */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[42px] h-[42px] rounded-full flex items-center justify-center"
          style={{ background: accent, color: labelFg }}
        >
          <span className="font-mono text-[6px] tracking-[0.25em]">A·1</span>
          {/* spindle hole */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[#0a0a0a]" />
        </div>
      </div>

      {/* Square sleeve — in front, hides left half of vinyl */}
      <div
        className="absolute left-[8px] top-[12px] w-[130px] h-[165px] bg-paper border border-ink flex flex-col p-2.5"
      >
        <div className="flex justify-between font-mono text-[6px] tracking-[0.3em]">
          <span className="truncate max-w-[80px]">
            {source.creator?.toUpperCase() ?? "AFTERLINE"}
          </span>
          <span className="text-muted">A / 1</span>
        </div>

        <div className="flex-1 flex items-center justify-center relative">
          <span className="font-serif text-[96px] leading-none tracking-tight">
            {initial}
          </span>
        </div>

        <div className="flex justify-between font-mono text-[6px] tracking-[0.3em] text-muted">
          <span>SIDE A</span>
          <span>33⅓</span>
        </div>
      </div>

      {/* Bottom block: title + artist */}
      <div className="absolute left-3 right-3 bottom-3">
        <div className="font-mono text-[7px] tracking-[0.3em] text-muted">
          TRACK
        </div>
        <div className="font-serif text-[15px] leading-[1.05] tracking-tight uppercase break-words mt-1">
          {source.title}
        </div>
        {source.creator && (
          <div className="font-mono text-[7px] tracking-[0.28em] uppercase mt-1.5 text-muted truncate">
            {source.creator}
            {source.publisher ? ` · ${source.publisher}` : ""}
          </div>
        )}
      </div>
    </div>
  );
}
