"use server";

import { revalidatePath } from "next/cache";
import type { SourceType } from "@/lib/data/types";
import { deletePageInNotion } from "@/lib/notion";

export async function deleteSourcesBulkAction(
  ids: string[],
  _type: SourceType,
): Promise<{ deleted: number }> {
  let deleted = 0;
  for (const id of ids) {
    await deletePageInNotion(id);
    deleted++;
  }
  revalidatePath("/", "layout");
  return { deleted };
}

export async function moveSourcesBulkAction(
  _ids: string[],
  _fromType: SourceType,
  _toType: SourceType,
): Promise<{ moved: number }> {
  throw new Error("Source type is determined by Notion schema and cannot be changed in bulk");
}
