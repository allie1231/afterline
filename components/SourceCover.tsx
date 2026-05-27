import { TypographicCover } from "./TypographicCover";
import { NewspaperCover } from "./covers/NewspaperCover";
import { TranscriptCover } from "./covers/TranscriptCover";
import { ArchiveCover } from "./covers/ArchiveCover";
import type { RoomCategory, Source } from "@/lib/data/types";

/**
 * Cover/poster for a source.
 *
 * Shape:
 *   - lyrics  → square (album cover proportions)
 *   - others  → portrait (book / poster proportions)
 *
 * Image-based types — use uploaded cover_url if present, else typographic fallback:
 *   - book   (cover)
 *   - lyrics (album cover)
 *   - movie  (poster)
 *
 * Editorial-treatment types — always rendered as a styled card:
 *   - article: newspaper clipping
 *   - conversation: transcript card
 *   - other: archive file label
 */
export function SourceCover({
  source,
  category,
  size = "lg",
}: {
  source: Source;
  category: RoomCategory;
  size?: "lg" | "sm";
}) {
  const isLyrics = source.type === "lyrics";

  const dims =
    size === "lg"
      ? isLyrics
        ? "w-[200px] h-[200px]"
        : "w-[200px] h-[300px]"
      : isLyrics
        ? "w-[80px] h-[80px]"
        : "w-[80px] h-[120px]";

  const imageTypes = ["book", "lyrics", "movie"] as const;
  const isImageType = (imageTypes as readonly string[]).includes(source.type);

  if (isImageType && source.cover_url) {
    return (
      <div className={`${dims} shrink-0 overflow-hidden bg-ink`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={source.cover_url}
          alt={`${source.title} cover`}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`${dims} shrink-0`}>
      {source.type === "article" ? (
        <NewspaperCover
          source={source}
          accent={category.accent}
          contrast={category.contrast}
        />
      ) : source.type === "conversation" ? (
        <TranscriptCover source={source} accent={category.accent} />
      ) : source.type === "other" ? (
        <ArchiveCover
          source={source}
          accent={category.accent}
          contrast={category.contrast}
        />
      ) : (
        <TypographicCover
          title={source.title}
          creator={source.creator}
          type={source.type}
          accent={category.accent}
          contrast={category.contrast}
          size={size}
        />
      )}
    </div>
  );
}
