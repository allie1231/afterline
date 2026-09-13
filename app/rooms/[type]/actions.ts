"use server";

import { revalidatePath } from "next/cache";
import type { RoomSlug } from "@/lib/data/types";
import { deletePageInNotion } from "@/lib/notion";

export async function deleteSourcesBulkAction(
  ids: string[],
  _slug: RoomSlug,
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
  _fromSlug: RoomSlug,
  _toSlug: RoomSlug,
): Promise<{ moved: number }> {
  throw new Error("Source type is determined by Notion schema and cannot be changed in bulk");
}
