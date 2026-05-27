import Link from "next/link";
import type { Source, SourceType } from "@/lib/data/types";

const PALETTE = [
  "var(--blue)",
  "var(--red)",
  "var(--green)",
  "var(--yellow)",
  "var(--orange)",
  "var(--cyan)",
];

// All spines share the same book-spine dimensions. Type only affects the
// small label printed at the top of the spine.
const SPINE_SIZE = { width: "w-12", height: "h-[360px]" };
const SPINE_LABEL: Record<SourceType, string> = {
  book: "BK",
  article: "ART",
  lyrics: "LYR",
  movie: "MOV",
  conversation: "CNV",
  other: "OTH",
};

export function SourceSpine({
  source,
  lines,
  index,
}: {
  source: Source;
  lines: number;
  index: number;
}) {
  // User-picked color wins; otherwise rotate through the default palette.
  const bg = source.spine_color ?? PALETTE[index % PALETTE.length];
  const label = SPINE_LABEL[source.type];
  // Light backgrounds need dark ink; everything else gets white text.
  const LIGHT_BGS = new Set([
    "var(--yellow)",
    "var(--cyan)",
    "var(--paper)",
    "var(--white)",
    "#e8a08e", // salmon
  ]);
  const isLight = LIGHT_BGS.has(bg);
  const fg = isLight ? "var(--ink)" : "var(--white)";
  const fgMuted = isLight ? "rgba(17,17,17,0.55)" : "rgba(255,255,255,0.7)";

  return (
    <Link
      href={`/sources/${source.id}`}
      className={`group relative shrink-0 ${SPINE_SIZE.width} ${SPINE_SIZE.height} hover:-translate-y-2 transition-transform`}
      style={{ background: bg, color: fg }}
      aria-label={`${source.title} — ${lines} lines`}
    >
      <span
        className="absolute top-2 left-0 right-0 text-center font-mono text-[8px] tracking-widest"
        style={{ color: fgMuted }}
      >
        {label}
      </span>

      <span
        className="absolute inset-x-0 inset-y-8 flex items-center justify-center px-1"
        style={{ writingMode: "vertical-rl" }}
      >
        <span className="font-serif text-[15px] leading-tight tracking-tight text-center">
          {source.title}
        </span>
      </span>

      <span
        className="absolute bottom-2 left-0 right-0 text-center font-mono text-[8px] tracking-widest"
        style={{ color: fgMuted }}
      >
        {String(lines).padStart(2, "0")}
      </span>
    </Link>
  );
}
