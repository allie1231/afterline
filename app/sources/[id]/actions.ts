"use server";

import type { ReadingStatus, SourceType } from "@/lib/data/types";

const READONLY_MSG = "Write operations are not available (Notion read-only mode)";

export async function setRatingAction(
  _sourceId: string,
  _rating: number | null,
): Promise<void> {
  throw new Error(READONLY_MSG);
}

type NoteTextField = "summary" | "personal_note";
export async function updateNoteTextAction(
  _sourceId: string,
  _field: NoteTextField,
  _value: string,
): Promise<void> {
  throw new Error(READONLY_MSG);
}

export async function setStatusAction(
  _sourceId: string,
  _status: ReadingStatus | null,
): Promise<void> {
  throw new Error(READONLY_MSG);
}

type NoteDateField = "started_at" | "finished_at";
export async function setNoteDateAction(
  _sourceId: string,
  _field: NoteDateField,
  _value: string | null,
): Promise<void> {
  throw new Error(READONLY_MSG);
}

export interface QuoteEditFields {
  text?: string;
  page?: string | null;
  note?: string | null;
  mood_tags?: string[];
  is_favorite?: boolean;
}

export async function updateQuoteAction(
  _quoteId: string,
  _sourceId: string,
  _fields: QuoteEditFields,
): Promise<void> {
  throw new Error(READONLY_MSG);
}

export async function deleteQuoteAction(
  _quoteId: string,
  _sourceId: string,
): Promise<void> {
  throw new Error(READONLY_MSG);
}

type SourceTextField =
  | "title"
  | "creator"
  | "publisher"
  | "published_date"
  | "isbn"
  | "url"
  | "cover_url"
  | "genre";

export async function updateSourceTextAction(
  _sourceId: string,
  _field: SourceTextField,
  _value: string,
): Promise<void> {
  throw new Error(READONLY_MSG);
}

export async function deleteSourceAction(
  _sourceId: string,
  _type: SourceType,
): Promise<void> {
  throw new Error(READONLY_MSG);
}

export interface EditSourceFields {
  title?: string;
  creator?: string | null;
  publisher?: string | null;
  published_date?: string | null;
  isbn?: string | null;
  url?: string | null;
  genre?: string | null;
  spine_color?: string | null;
}

export async function updateSourceBulkAction(
  _sourceId: string,
  _fields: EditSourceFields,
): Promise<void> {
  throw new Error(READONLY_MSG);
}

export async function updateSourceSpineColorAction(
  _sourceId: string,
  _color: string | null,
): Promise<void> {
  throw new Error(READONLY_MSG);
}

export async function changeSourceTypeAction(
  _sourceId: string,
  _fromType: SourceType,
  _toType: SourceType,
): Promise<void> {
  throw new Error(READONLY_MSG);
}
