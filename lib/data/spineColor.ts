// Single source of truth for "what color is this source's spine?"
// Used by both the shelf spine (SourceSpine) and the library card so the same
// source always shows the same accent in both places.

import type { Source } from "./types";

export const SPINE_PALETTE = [
  "var(--blue)",
  "var(--red)",
  "var(--green)",
  "var(--yellow)",
  "var(--orange)",
  "var(--cyan)",
];

// Colors that would render invisible against the paper background — fall
// back to the palette when we see one stored on a source.
const INVISIBLE_BGS = new Set([
  "",
  "auto",
  "transparent",
  "none",
  "var(--paper)",
  "var(--white)",
  "var(--bg)",
  "#f5f1e8",
  "#ffffff",
  "#fff",
]);

const LIGHT_BGS = new Set([
  "var(--yellow)",
  "var(--cyan)",
  "var(--paper)",
  "var(--white)",
  "#e8a08e", // salmon
]);

// Deterministic palette index from a source id so the same source always
// resolves to the same fallback color across surfaces.
function paletteIndexFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % SPINE_PALETTE.length;
}

export function resolveSpineColor(source: Pick<Source, "id" | "spine_color">): string {
  const raw = (source.spine_color ?? "").trim().toLowerCase();
  if (raw && !INVISIBLE_BGS.has(raw)) return source.spine_color!.trim();
  return SPINE_PALETTE[paletteIndexFromId(source.id)];
}

export function isLightSpineColor(color: string): boolean {
  return LIGHT_BGS.has(color);
}
