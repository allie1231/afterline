"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createNote,
  deleteNote,
  getNoteById,
  updateNote,
} from "@/lib/data/repository";

function str(formData: FormData, name: string): string | undefined {
  const v = formData.get(name);
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  return trimmed === "" ? undefined : trimmed;
}

export async function createNoteAction(formData: FormData): Promise<void> {
  const sourceId = str(formData, "source_id");
  const body = formData.get("body");
  if (typeof body !== "string" || body.trim().length === 0) {
    throw new Error("본문을 비울 수 없어요.");
  }
  const note = await createNote({
    source_id: sourceId ?? null,
    kind: str(formData, "kind"),
    title: str(formData, "title"),
    body,
  });
  revalidatePath("/notes");
  if (sourceId) revalidatePath(`/sources/${sourceId}`);
  redirect(sourceId ? `/sources/${sourceId}#notes` : "/notes");
}

export async function updateNoteAction(
  noteId: string,
  fields: { kind?: string | null; title?: string | null; body?: string },
): Promise<void> {
  const existing = await getNoteById(noteId);
  if (!existing) throw new Error("Note not found");
  await updateNote(noteId, fields);
  revalidatePath("/notes");
  revalidatePath(`/notes/${noteId}`);
  if (existing.source_id) revalidatePath(`/sources/${existing.source_id}`);
}

export async function deleteNoteAction(noteId: string): Promise<void> {
  const existing = await getNoteById(noteId);
  if (!existing) return;
  await deleteNote(noteId);
  revalidatePath("/notes");
  if (existing.source_id) revalidatePath(`/sources/${existing.source_id}`);
}
