"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SourceType } from "@/lib/data/types";

const VALID_TYPES: SourceType[] = [
  "book",
  "article",
  "lyrics",
  "movie",
  "conversation",
  "other",
];

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
): Promise<ImportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Build lookup of existing sources + dupe quote keys
  const [{ data: existingSources }, { data: existingQuotes }] =
    await Promise.all([
      supabase.from("sources").select("id, type, title"),
      supabase.from("quotes").select("text, source_id"),
    ]);

  const sourceIdByKey = new Map<string, string>(); // `type|title` → id
  const keyBySourceId = new Map<string, string>();
  for (const s of existingSources ?? []) {
    const k = `${s.type}|${s.title}`;
    sourceIdByKey.set(k, s.id as string);
    keyBySourceId.set(s.id as string, k);
  }

  const dupeKeys = new Set<string>();
  for (const q of existingQuotes ?? []) {
    if (q.source_id) {
      const k = keyBySourceId.get(q.source_id as string);
      if (k) dupeKeys.add(`${k}||${q.text}`);
    }
  }

  let imported = 0;
  let skipped = 0;
  let newSources = 0;
  const errors: { row: number; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const text = (row.text ?? "").trim();
    const sourceTitle = (row.source_title ?? "").trim();
    const rawType = (row.source_type ?? "").toLowerCase().trim();
    const sourceType: SourceType = (VALID_TYPES as string[]).includes(rawType)
      ? (rawType as SourceType)
      : "other";

    if (!text) {
      errors.push({ row: i + 1, reason: "문장 비어있음" });
      continue;
    }
    if (!sourceTitle) {
      errors.push({ row: i + 1, reason: "출처 제목 비어있음" });
      continue;
    }

    const sourceKey = `${sourceType}|${sourceTitle}`;
    const dupeKey = `${sourceKey}||${text}`;
    if (dupeKeys.has(dupeKey)) {
      skipped++;
      continue;
    }

    // Find or create source
    let sourceId = sourceIdByKey.get(sourceKey);
    if (!sourceId) {
      const { data: newSource, error: srcErr } = await supabase
        .from("sources")
        .insert({
          type: sourceType,
          title: sourceTitle,
          creator: row.creator?.trim() || null,
          url: row.url?.trim() || null,
          user_id: user.id,
        })
        .select("id")
        .single();
      if (srcErr || !newSource) {
        errors.push({
          row: i + 1,
          reason: `출처 생성 실패: ${srcErr?.message ?? "unknown"}`,
        });
        continue;
      }
      sourceId = newSource.id as string;
      sourceIdByKey.set(sourceKey, sourceId);
      newSources++;
    }

    const moodTags = (row.mood_tags ?? "")
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const isFavorite = /^(true|1|yes|y|favorite|favourite)$/i.test(
      (row.is_favorite ?? "").trim(),
    );

    let createdAtIso: string | undefined;
    if (row.created_at) {
      const d = new Date(row.created_at);
      if (!Number.isNaN(d.getTime())) createdAtIso = d.toISOString();
    }

    const { error: qErr } = await supabase.from("quotes").insert({
      source_id: sourceId,
      text,
      page: row.page?.trim() || null,
      note: row.note?.trim() || null,
      mood_tags: moodTags,
      is_favorite: isFavorite,
      visibility: "private",
      ...(createdAtIso ? { created_at: createdAtIso } : {}),
      user_id: user.id,
    });

    if (qErr) {
      errors.push({ row: i + 1, reason: qErr.message });
      continue;
    }

    dupeKeys.add(dupeKey);
    imported++;
  }

  revalidatePath("/rooms");
  revalidatePath("/data");

  return { imported, skipped, newSources, errors };
}
