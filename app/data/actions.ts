"use server";

import { revalidatePath } from "next/cache";
import type { SourceType } from "@/lib/data/types";
import {
  getData,
  createSourceInNotion,
  createQuoteInNotion,
  invalidateNotionCache,
} from "@/lib/notion";

export type ImportRow = {
  text?: string;
  source_type?: string;
  source_title?: string;
  creator?: string;
  page?: string;
  url?: string;
  note?: string;
  mood_tags?: string;
  is_favorite?: string;
  created_at?: string;
};

export type ImportResult = {
  imported: number;
  skipped: number;
  newSources: number;
  errors: { row: number; reason: string }[];
};

export async function runImportAction(
  rows: ImportRow[],
  _defaultType: SourceType = "other",
): Promise<ImportResult> {
  const { sources } = await getData();
  const sourceMap = new Map(sources.map((s) => [s.title.toLowerCase(), s.id]));

  let imported = 0;
  let skipped = 0;
  let newSources = 0;
  const errors: { row: number; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const text = (row.text ?? "").trim();
    if (!text) {
      skipped++;
      continue;
    }

    try {
      let sourceId: string | null = null;
      const title = (row.source_title ?? "").trim();

      if (title) {
        const existing = sourceMap.get(title.toLowerCase());
        if (existing) {
          sourceId = existing;
        } else {
          sourceId = await createSourceInNotion({
            title,
            creator: row.creator?.trim() || undefined,
          });
          sourceMap.set(title.toLowerCase(), sourceId);
          newSources++;
        }
      }

      const tags = row.mood_tags
        ? row.mood_tags.split(",").map((t) => t.trim()).filter(Boolean)
        : undefined;

      await createQuoteInNotion({
        text,
        sourceId,
        mood_tags: tags,
        is_favorite: row.is_favorite === "true" || row.is_favorite === "1",
      });
      imported++;
    } catch (e) {
      errors.push({
        row: i + 1,
        reason: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  invalidateNotionCache();
  revalidatePath("/", "layout");
  return { imported, skipped, newSources, errors };
}
