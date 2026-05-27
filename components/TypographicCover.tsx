import type { SourceType } from "@/lib/data/types";

const TYPE_LABEL: Record<SourceType, string> = {
  book: "BOOK SOURCE",
  article: "ARTICLE SOURCE",
  lyrics: "LYRICS SOURCE",
  movie: "MOVIE SOURCE",
  conversation: "CONVERSATION",
  other: "OTHER SOURCE",
};

export function TypographicCover({
  title,
  creator,
  type,
  accent,
  contrast = "dark",
  size = "lg",
}: {
  title: string;
  creator?: string;
  type: SourceType;
  accent: string;
  contrast?: "light" | "dark";
  size?: "lg" | "sm";
}) {
  const fg = contrast === "dark" ? "var(--white)" : "var(--ink)";
  const fgMuted = contrast === "dark" ? "rgba(255,255,255,0.65)" : "rgba(17,17,17,0.55)";
  const isLg = size === "lg";

  // Title size shrinks for long titles so a 3-word title still fits a 200px box.
  const titleSize = isLg
    ? title.length > 18
      ? "text-[20px]"
      : title.length > 12
        ? "text-[26px]"
        : "text-[32px]"
    : "text-[11px]";

  const padding = isLg ? "p-5" : "p-2.5";
  const labelSize = isLg ? "text-[9px]" : "text-[6px]";
  const creatorSize = isLg ? "text-[10px]" : "text-[7px]";
  const ruleMargin = isLg ? "my-3" : "my-1.5";
  const ruleWidth = isLg ? "w-10" : "w-5";

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between ${padding} select-none overflow-hidden`}
      style={{ background: accent, color: fg }}
    >
      <div
        className={`font-mono ${labelSize} tracking-[0.3em]`}
        style={{ color: fgMuted }}
      >
        AFTERLINE
      </div>

      <div className="flex flex-col items-start min-w-0">
        <div
          className={`font-serif uppercase leading-[0.95] tracking-tight break-words ${titleSize}`}
        >
          {title}
        </div>
        {creator && (
          <>
            <div
              className={`h-px ${ruleWidth} ${ruleMargin}`}
              style={{ background: fgMuted }}
            />
            <div
              className={`font-mono ${creatorSize} tracking-[0.25em] uppercase`}
            >
              {creator}
            </div>
          </>
        )}
      </div>

      <div
        className={`font-mono ${labelSize} tracking-[0.3em]`}
        style={{ color: fgMuted }}
      >
        {TYPE_LABEL[type]}
      </div>
    </div>
  );
}
