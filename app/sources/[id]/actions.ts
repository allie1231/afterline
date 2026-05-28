"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { upsertCollectionNote } from "@/lib/data/repository";
import type { ReadingStatus, SourceType } from "@/lib/data/types";

// ─────────────────────────────────────────────────────────────────────
// Collection note edits
// ─────────────────────────────────────────────────────────────────────

export async function setRatingAction(
  sourceId: string,
  rating: number | null,
): Promise<void> {
  await upsertCollectionNote(sourceId, { rating });
  revalidatePath(`/sources/${sourceId}`);
}

type NoteTextField = "summary" | "personal_note";
export async function updateNoteTextAction(
  sourceId: string,
  field: NoteTextField,
  value: string,
): Promise<void> {
  const v = value.trim();
  await upsertCollectionNote(sourceId, { [field]: v.length === 0 ? null : v });
  revalidatePath(`/sources/${sourceId}`);
}

export async function setStatusAction(
  sourceId: string,
  status: ReadingStatus | null,
): Promise<void> {
  await upsertCollectionNote(sourceId, { status: status ?? undefined });
  revalidatePath(`/sources/${sourceId}`);
}

type NoteDateField = "started_at" | "finished_at";
export async function setNoteDateAction(
  sourceId: string,
  field: NoteDateField,
  value: string | null,
): Promise<void> {
  // value is YYYY-MM-DD (date input). Send as timestamp midnight UTC, or null.
  const iso = value ? new Date(`${value}T00:00:00.000Z`).toISOString() : null;
  await upsertCollectionNote(sourceId, { [field]: iso });
  revalidatePath(`/sources/${sourceId}`);
}

// ─────────────────────────────────────────────────────────────────────
// Quote edits
// ─────────────────────────────────────────────────────────────────────

export interface QuoteEditFields {
  text?: string;
  page?: string | null;
  note?: string | null;
  mood_tags?: string[];
  is_favorite?: boolean;
}

export async function updateQuoteAction(
  quoteId: string,
  sourceId: string,
  fields: QuoteEditFields,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("quotes")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", quoteId);
  if (error) throw error;
  revalidatePath(`/sources/${sourceId}`);
}

export async function deleteQuoteAction(
  quoteId: string,
  sourceId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("quotes").delete().eq("id", quoteId);
  if (error) throw error;
  revalidatePath(`/sources/${sourceId}`);
}

// ─────────────────────────────────────────────────────────────────────
// Source edits
// ─────────────────────────────────────────────────────────────────────

type SourceTextField =
  | "title"
  | "creator"
  | "publisher"
  | "published_date"
  | "isbn"
  | "url"
  | "cover_url";

export async function updateSourceTextAction(
  sourceId: string,
  field: SourceTextField,
  value: string,
): Promise<void> {
  const v = value.trim();
  const supabase = await createClient();
  const { error } = await supabase
    .from("sources")
    .update({
      [field]: v.length === 0 ? null : v,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sourceId);
  if (error) throw error;
  revalidatePath(`/sources/${sourceId}`);
  revalidatePath(`/rooms`);
}

export async function deleteSourceAction(
  sourceId: string,
  type: SourceType,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("sources").delete().eq("id", sourceId);
  if (error) throw error;
  revalidatePath("/rooms");
  revalidatePath(`/rooms/${type}`);
  redirect(`/rooms/${type}`);
}

export interface EditSourceFields {
  title?: string;
  creator?: string | null;
  publisher?: string | null;
  published_date?: string | null;
  isbn?: string | null;
  url?: string | null;
  spine_color?: string | null;
}

export async function updateSourceBulkAction(
  sourceId: string,
  fields: EditSourceFields,
): Promise<void> {
  const supabase = await createClient();
  const update: Record<string, string | null> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined) continue;
    const t = typeof v === "string" ? v.trim() : v;
    update[k] = t === "" ? null : (t as string | null);
  }
  if ("title" in update && (update.title === null || !update.title)) {
    throw new Error("title cannot be empty");
  }
  update.updated_at = new Date().toISOString();
  const { error } = await supabase
    .from("sources")
    .update(update)
    .eq("id", sourceId);
  if (error) throw error;
  revalidatePath(`/sources/${sourceId}`);
  revalidatePath("/rooms");
}

export async function updateSourceSpineColorAction(
  sourceId: string,
  color: string | null,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sources")
    .update({
      spine_color: color,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sourceId);
  if (error) throw error;
  revalidatePath(`/sources/${sourceId}`);
  revalidatePath("/rooms");
}

export async function changeSourceTypeAction(
  sourceId: string,
  fromType: SourceType,
  toType: SourceType,
): Promise<void> {
  if (fromType === toType) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("sources")
    .update({ type: toType, updated_at: new Date().toISOString() })
    .eq("id", sourceId);
  if (error) throw error;
  revalidatePath("/rooms");
  revalidatePath(`/rooms/${fromType}`);
  revalidatePath(`/rooms/${toType}`);
  revalidatePath(`/sources/${sourceId}`);
}
