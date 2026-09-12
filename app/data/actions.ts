"use server";

import type { SourceType } from "@/lib/data/types";

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
  _rows: ImportRow[],
  _defaultType: SourceType = "other",
): Promise<ImportResult> {
  throw new Error("Import is not available (Notion read-only mode)");
}
