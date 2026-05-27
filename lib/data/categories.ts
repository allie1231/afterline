import type { RoomCategory } from "./types";

export const ROOM_CATEGORIES: RoomCategory[] = [
  {
    type: "book",
    en: "BOOKS",
    ko: "책",
    description: "Collected lines from printed pages.",
    accent: "var(--blue)",
    contrast: "dark",
  },
  {
    type: "article",
    en: "ARTICLES",
    ko: "아티클",
    description: "Lines clipped from articles and essays.",
    accent: "var(--orange)",
    contrast: "dark",
  },
  {
    type: "lyrics",
    en: "LYRICS",
    ko: "가사",
    description: "Lines that played on repeat.",
    accent: "var(--yellow)",
    contrast: "light",
  },
  {
    type: "movie",
    en: "MOVIES",
    ko: "영화",
    description: "Lines spoken between scenes.",
    accent: "var(--red)",
    contrast: "dark",
  },
  {
    type: "conversation",
    en: "TALK",
    ko: "대화",
    description: "Lines that stayed after speaking.",
    accent: "var(--green)",
    contrast: "dark",
  },
  {
    type: "other",
    en: "OTHERS",
    ko: "기타",
    description: "Lines from everywhere else.",
    accent: "var(--cyan)",
    contrast: "light",
  },
];
