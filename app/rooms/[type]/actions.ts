"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SourceType } from "@/lib/data/types";

export async function deleteSourcesBulkAction(
  ids: string[],
  type: SourceType,
): Promise<{ deleted: number }> {
  if (ids.length === 0) return { deleted: 0 };
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("sources")
    .delete({ count: "exact" })
    .in("id", ids);
  if (error) throw error;
  revalidatePath("/rooms");
  revalidatePath(`/rooms/${type}`);
  return { deleted: count ?? 0 };
}
