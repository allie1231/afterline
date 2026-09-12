import Link from "next/link";
import { isLightSpineColor, resolveSpineColor } from "@/lib/data/spineColor";
import { resolveSpineStyle } from "@/lib/data/spineStyle";
import type { Source, SourceType } from "@/lib/data/types";

const SPINE_LABEL: Record<SourceType, string> = {
  book: "BK",
  article: "ART",
  lyrics: "LYR",
  movie: "MOV",
  conversation: "CNV",
  other: "OTH",
};

const FONT_FAMILY: Record<string, string> = {
  serif: "var(--font-serif)",
  sans: "var(--font-sans)",
  mono: "var(--font-mono)",
  "kr-serif": "var(--font-kr-serif)",
  "kr-sans": "var(--font-kr-sans)",
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

  const style = resolveSpineStyle(source);
  const fontFam = FONT_FAMILY[style.fontFamily];

  return (
    <Link
      href={`/sources/${source.id}`}
      className="group relative block shrink-0 transition-[transform] duration-300 ease-out will-change-transform hover:-translate-y-4 hover:scale-[1.04] hover:rotate-[-1.5deg] hover:z-10"
      style={{
        background: bg,
        color: fg,
        width: style.width,
        height: style.height,
        borderLeft: "1px solid rgba(0,0,0,0.08)",
        borderRight: "1px solid rgba(0,0,0,0.08)",
        borderTop: "1px solid rgba(0,0,0,0.05)",
        boxShadow: "0 6px 0 var(--line), 0 7px 0 rgba(0,0,0,0.12)",
      }}
      aria-label={`${source.title} — ${lines} lines`}
    >
      <span
        className="absolute top-2 left-0 right-0 text-center font-mono text-[8px] tracking-widest"
        style={{ color: fgMuted }}
      >
        {label}
      </span>

      <span
        className="absolute inset-0 flex items-center justify-center"
        style={{ writingMode: "vertical-rl" }}
      >
        <span
          className="leading-tight text-center"
          style={{
            fontFamily: fontFam,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            letterSpacing: style.letterSpacing,
            textTransform: style.textTransform,
            maxHeight: style.height - 32,
            overflow: "hidden",
          }}
        >
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
