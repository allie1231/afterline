import Link from "next/link";
import { isLightSpineColor, resolveSpineColor } from "@/lib/data/spineColor";
import type { Source, SourceType } from "@/lib/data/types";

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
}: {
  source: Source;
  lines: number;
}) {
  const bg = resolveSpineColor(source);
  const label = SPINE_LABEL[source.type];
  const isLight = isLightSpineColor(bg);
  const fg = isLight ? "var(--ink)" : "var(--white)";
  const fgMuted = isLight ? "rgba(17,17,17,0.55)" : "rgba(255,255,255,0.7)";

  return (
    <Link
      href={`/sources/${source.id}`}
      className={`group relative block shrink-0 ${SPINE_SIZE.width} ${SPINE_SIZE.height} overflow-hidden transition-[transform,box-shadow] duration-300 ease-out will-change-transform hover:-translate-y-4 hover:scale-[1.04] hover:rotate-[-1.5deg] hover:shadow-[5px_5px_0_var(--ink)] hover:z-10`}
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
