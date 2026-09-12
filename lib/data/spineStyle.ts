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

export function resolveSpineStyle(source: Source): SpineStyle {
  const h = hashCode(source.id);
  const isKorean = HAS_KOREAN.test(source.title);
  const presets = isKorean ? KR_PRESETS : EN_PRESETS;
  const preset = pick(presets, h, 0);

  const width = pick(WIDTH_STEPS, h, 4);
  const height = pick(HEIGHT_STEPS, h, 8);

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
