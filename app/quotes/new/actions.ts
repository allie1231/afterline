"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createQuote, createSource } from "@/lib/data/repository";
import type { SourceType } from "@/lib/data/types";

function str(formData: FormData, name: string): string | undefined {
  const v = formData.get(name);
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  return trimmed === "" ? undefined : trimmed;
}

function parseMoodTags(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export async function createQuoteAction(formData: FormData): Promise<void> {
  const mode = formData.get("mode") as "existing" | "new";
  const type = formData.get("type") as SourceType;

  let sourceId: string;

  if (mode === "existing") {
    const existing = str(formData, "existing_source_id");
    if (!existing) throw new Error("Pick an existing source");
    sourceId = existing;
  } else {
    const title = str(formData, "title");
    if (!title) throw new Error("Source title is required");

    const spineColorRaw = str(formData, "spine_color");
    const spine_color = !spineColorRaw || spineColorRaw === "auto" ? null : spineColorRaw;

    const newSource = await createSource({
      type,
      title,
      creator: str(formData, "creator"),
      publisher: str(formData, "publisher"),
      published_date: str(formData, "published_date"),
      isbn: str(formData, "isbn"),
      cover_url: str(formData, "cover_url"),
      url: str(formData, "url"),
      spine_color,
    });
    sourceId = newSource.id;
  }

  const text = str(formData, "text");
  if (!text) throw new Error("Quote text is required");

  await createQuote({
    source_id: sourceId,
    text,
    page: str(formData, "page"),
    note: str(formData, "note"),
    mood_tags: parseMoodTags(str(formData, "mood_tags")),
    is_favorite: formData.get("is_favorite") === "on",
  });

  revalidatePath("/rooms");
  revalidatePath(`/rooms/${type}`);
  revalidatePath(`/sources/${sourceId}`);

  redirect(`/sources/${sourceId}`);
}
