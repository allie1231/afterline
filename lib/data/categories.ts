import type { RoomCategory, RoomSlug, SourceType } from "./types";

export interface SourceTypeCategory {
  type: SourceType;
  en: string;
  ko: string;
  accent: string;
  contrast: "light" | "dark";
}

export const SOURCE_TYPE_CATEGORIES: SourceTypeCategory[] = [
  { type: "book", en: "BOOKS", ko: "책", accent: "var(--blue)", contrast: "dark" },
  { type: "article", en: "ARTICLES", ko: "아티클", accent: "var(--orange)", contrast: "dark" },
  { type: "lyrics", en: "LYRICS", ko: "가사", accent: "var(--yellow)", contrast: "light" },
  { type: "movie", en: "MOVIES", ko: "영화", accent: "var(--red)", contrast: "dark" },
  { type: "conversation", en: "TALK", ko: "대화", accent: "var(--green)", contrast: "dark" },
  { type: "other", en: "OTHERS", ko: "기타", accent: "var(--cyan)", contrast: "light" },
];

const TYPE_TO_ROOM_SLUG: Record<SourceType, RoomSlug> = {
  book: "books",
  article: "articles",
  lyrics: "others",
  movie: "others",
  conversation: "others",
  other: "others",
};

export function roomSlugForType(type: SourceType): RoomSlug {
  return TYPE_TO_ROOM_SLUG[type];
}

export const ROOM_CATEGORIES: RoomCategory[] = [
  {
    slug: "books",
    en: "BOOKS",
    ko: "책",
    description: "Collected lines from printed pages.",
    accent: "var(--blue)",
    contrast: "dark",
  },
  {
    slug: "articles",
    en: "ARTICLES",
    ko: "아티클",
    description: "Lines clipped from articles and essays.",
    accent: "var(--orange)",
    contrast: "dark",
  },
  {
    slug: "others",
    en: "OTHERS",
    ko: "기타",
    description: "Lines from lyrics, movies, talks, and more.",
    accent: "var(--cyan)",
    contrast: "light",
  },
  {
    slug: "want-to",
    en: "WANT TO",
    ko: "읽고 싶은 책",
    description: "Books waiting on the shelf.",
    accent: "var(--yellow)",
    contrast: "light",
  },
  {
    slug: "done",
    en: "DONE",
    ko: "완독",
    description: "Books read cover to cover.",
    accent: "var(--green)",
    contrast: "dark",
  },
  {
    slug: "year",
    en: "YEAR",
    ko: "연도별",
    description: "A year-by-year reading archive.",
    accent: "var(--red)",
    contrast: "dark",
  },
];
