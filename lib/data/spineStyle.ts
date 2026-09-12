import type { Source } from "./types";

export type SpineFont = "serif" | "sans" | "mono" | "kr-serif" | "kr-sans";

export interface SpineStyle {
  fontFamily: SpineFont;
  fontSize: number;
  fontWeight: number;
  letterSpacing: string;
  textTransform: "uppercase" | "none";
  width: number;
  height: number;
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pick<T>(arr: readonly T[], hash: number, shift: number): T {
  return arr[((hash >>> shift) ^ (hash >>> (shift + 8))) % arr.length];
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

const HAS_KOREAN = /[가-힯ㄱ-ㅣ]/;

interface FontPreset {
  fontFamily: SpineFont;
  fontSize: number;
  fontWeight: number;
  letterSpacing: string;
  textTransform: "uppercase" | "none";
}

const KR_PRESETS: readonly FontPreset[] = [
  { fontFamily: "kr-serif", fontSize: 18, fontWeight: 700, letterSpacing: "0.02em", textTransform: "none" },
  { fontFamily: "kr-serif", fontSize: 14, fontWeight: 400, letterSpacing: "0.04em", textTransform: "none" },
  { fontFamily: "kr-serif", fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em", textTransform: "none" },
  { fontFamily: "kr-sans", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "none" },
  { fontFamily: "kr-sans", fontSize: 16, fontWeight: 500, letterSpacing: "0.02em", textTransform: "none" },
  { fontFamily: "kr-sans", fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", textTransform: "none" },
  { fontFamily: "kr-sans", fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em", textTransform: "none" },
  { fontFamily: "kr-serif", fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", textTransform: "none" },
];

const EN_PRESETS: readonly FontPreset[] = [
  { fontFamily: "serif", fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", textTransform: "none" },
  { fontFamily: "serif", fontSize: 14, fontWeight: 400, letterSpacing: "0.02em", textTransform: "none" },
  { fontFamily: "serif", fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", textTransform: "none" },
  { fontFamily: "sans", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" },
  { fontFamily: "sans", fontSize: 16, fontWeight: 500, letterSpacing: "0.01em", textTransform: "none" },
  { fontFamily: "sans", fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" },
  { fontFamily: "mono", fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" },
  { fontFamily: "mono", fontSize: 14, fontWeight: 400, letterSpacing: "0.02em", textTransform: "none" },
  { fontFamily: "serif", fontSize: 26, fontWeight: 700, letterSpacing: "-0.04em", textTransform: "none" },
  { fontFamily: "sans", fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", textTransform: "none" },
];

const WIDTH_STEPS = [36, 40, 44, 48, 52, 56, 64, 72] as const;
const HEIGHT_STEPS = [280, 300, 320, 340, 360, 380, 400] as const;

function widthFromPageCount(pages: number): number {
  if (pages <= 100) return 28;
  if (pages <= 150) return 32;
  if (pages <= 200) return 36;
  if (pages <= 280) return 40;
  if (pages <= 350) return 44;
  if (pages <= 450) return 48;
  if (pages <= 550) return 56;
  if (pages <= 700) return 64;
  return 72;
}

function heightFromBookSize(heightMm: number): number {
  // Common Korean book formats mapped to pixel heights:
  // 문고판 ~150mm → 240px
  // 46판  188mm → 280px
  // A5    210mm → 310px
  // 신국판 225mm → 340px
  // 크라운 257mm → 380px
  // A4    297mm → 420px
  const px = Math.round((heightMm / 225) * 340);
  return clamp(px, 220, 440);
}

export function resolveSpineStyle(source: Source): SpineStyle {
  const h = hashCode(source.id);
  const isKorean = HAS_KOREAN.test(source.title);
  const presets = isKorean ? KR_PRESETS : EN_PRESETS;
  const preset = pick(presets, h, 0);

  const hasRealData = source.page_count || source.book_height_mm;

  const width = source.page_count
    ? widthFromPageCount(source.page_count)
    : pick(WIDTH_STEPS, h, 4);

  const height = source.book_height_mm
    ? heightFromBookSize(source.book_height_mm)
    : pick(HEIGHT_STEPS, h, 8);

  const titleLen = source.title.length;
  let fontSize = preset.fontSize;

  const verticalBudget = height - 32;
  const maxByHeight = Math.floor(verticalBudget / (titleLen * 1.3));
  const maxByWidth = width - 6;
  fontSize = Math.max(9, Math.min(fontSize, maxByHeight, maxByWidth));

  return {
    ...preset,
    fontSize,
    width,
    height,
  };
}
