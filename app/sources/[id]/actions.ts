"use server";

import { revalidatePath } from "next/cache";
import type { ReadingStatus, SourceType } from "@/lib/data/types";
import {
  updateSourceInNotion,
  updateSourceNoteInNotion,
  updateQuoteInNotion,
  deletePageInNotion,
} from "@/lib/notion";

function revalidateAll() {
  revalidatePath("/", "layout");
}

export async function setRatingAction(
  sourceId: string,
  rating: number | null,
): Promise<void> {
  await updateSourceNoteInNotion(sourceId, { rating });
  revalidateAll();
}

type NoteTextField = "summary" | "personal_note";
export async function updateNoteTextAction(
  sourceId: string,
  field: NoteTextField,
  value: string,
): Promise<void> {
  await updateSourceNoteInNotion(sourceId, { [field]: value });
  revalidateAll();
}

export async function setStatusAction(
  sourceId: string,
  status: ReadingStatus | null,
): Promise<void> {
  await updateSourceNoteInNotion(sourceId, { status });
  revalidateAll();
}

type NoteDateField = "started_at" | "finished_at";
export async function setNoteDateAction(
  _sourceId: string,
  _field: NoteDateField,
  _value: string | null,
): Promise<void> {
  // Notion schema has no date fields for started/finished — no-op
}

export interface QuoteEditFields {
  text?: string;
  page?: string | null;
  note?: string | null;
  mood_tags?: string[];
  is_favorite?: boolean;
}

export async function updateQuoteAction(
  quoteId: string,
  _sourceId: string,
  fields: QuoteEditFields,
): Promise<void> {
  await updateQuoteInNotion(quoteId, {
    text: fields.text,
    mood_tags: fields.mood_tags,
    is_favorite: fields.is_favorite,
  });
  revalidateAll();
}

export async function deleteQuoteAction(
  quoteId: string,
  _sourceId: string,
): Promise<void> {
  await deletePageInNotion(quoteId);
  revalidateAll();
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
  sourceId: string,
  field: SourceTextField,
  value: string,
): Promise<void> {
  const fieldMap: Partial<Record<SourceTextField, string>> = {
    title: "title",
    creator: "creator",
    publisher: "publisher",
    genre: "genre",
  };
  const mapped = fieldMap[field];
  if (mapped) {
    await updateSourceInNotion(sourceId, { [mapped]: value });
    revalidateAll();
  }
}

export async function deleteSourceAction(
  sourceId: string,
  _type: SourceType,
): Promise<void> {
  await deletePageInNotion(sourceId);
  revalidateAll();
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
  sourceId: string,
  fields: EditSourceFields,
): Promise<void> {
  await updateSourceInNotion(sourceId, {
    title: fields.title,
    creator: fields.creator,
    publisher: fields.publisher,
    genre: fields.genre,
  });
  revalidateAll();
}

export async function updateSourceSpineColorAction(
  _sourceId: string,
  _color: string | null,
): Promise<void> {
  // spine_color is computed from cover image, not stored in Notion
  revalidateAll();
}

export async function changeSourceTypeAction(
  _sourceId: string,
  _fromType: SourceType,
  _toType: SourceType,
): Promise<void> {
  // Source type is fixed as "book" in Notion schema
}
