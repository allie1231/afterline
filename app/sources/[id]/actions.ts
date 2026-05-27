"use server";

import { revalidatePath } from "next/cache";
import { upsertCollectionNote } from "@/lib/data/repository";

export async function setRatingAction(
  sourceId: string,
  rating: number | null,
): Promise<void> {
  await upsertCollectionNote(sourceId, { rating });
  revalidatePath(`/sources/${sourceId}`);
}
