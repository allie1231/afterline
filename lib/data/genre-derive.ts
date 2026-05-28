// Derive a short Korean genre label from TMDB / iTunes raw responses.
// Used at the moment a search hit is mapped into a CoverHit/source draft.

// TMDB genre IDs we care about (we only need broad strokes).
const TMDB_ANIMATION_IDS = new Set([16]); // shared between movie and TV

export function deriveMovieGenre(input: {
  media_type: "movie" | "tv";
  original_language?: string;
  genre_ids?: number[];
}): string {
  const ko = input.original_language === "ko";
  const isAnimation = (input.genre_ids ?? []).some((g) =>
    TMDB_ANIMATION_IDS.has(g),
  );
  if (isAnimation) return "애니메이션";
  if (input.media_type === "tv") return ko ? "한국드라마" : "외국드라마";
  return ko ? "한국영화" : "외국영화";
}

// iTunes returns a genre name directly (e.g. "K-Pop", "Hip-Hop/Rap", "J-Pop").
// We pass it through, just trimmed.
export function deriveLyricsGenre(primaryGenreName?: string): string | undefined {
  const v = primaryGenreName?.trim();
  return v && v.length > 0 ? v : undefined;
}
