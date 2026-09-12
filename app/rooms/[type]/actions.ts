"use server";

import type { SourceType } from "@/lib/data/types";

const READONLY_MSG = "Write operations are not available (Notion read-only mode)";

export async function deleteSourcesBulkAction(
  _ids: string[],
  _type: SourceType,
): Promise<{ deleted: number }> {
  throw new Error(READONLY_MSG);
}

export async function moveSourcesBulkAction(
  _ids: string[],
  _fromType: SourceType,
  _toType: SourceType,
): Promise<{ moved: number }> {
  throw new Error(READONLY_MSG);
}
