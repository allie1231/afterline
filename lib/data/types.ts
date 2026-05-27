export type SourceType =
  | "book"
  | "article"
  | "lyrics"
  | "movie"
  | "conversation"
  | "other";

export type Visibility = "private" | "public";

export type ReadingStatus = "to_read" | "reading" | "finished" | "archived";

export interface Source {
  id: string;
  user_id: string;
  type: SourceType;
  title: string;
  creator?: string;
  publisher?: string;
  published_date?: string;
  isbn?: string;
  cover_url?: string;
  url?: string;
  spine_color?: string | null;
  external_provider?: string;
  external_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  user_id: string;
  source_id: string | null;
  text: string;
  page?: string;
  note?: string;
  mood_tags: string[];
  color_mood?: string;
  is_favorite: boolean;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
}

export interface CollectionNote {
  id: string;
  user_id: string;
  source_id: string;
  title?: string;
  summary?: string;
  personal_note?: string;
  keywords: string[];
  status?: ReadingStatus;
  rating?: number;
  started_at?: string;
  finished_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RoomCategory {
  type: SourceType;
  en: string;
  ko: string;
  description: string;
  accent: string;
  /** "light" = put dark text on the accent. "dark" = put light text. */
  contrast: "light" | "dark";
}
