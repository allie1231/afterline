"use server";

import { revalidatePath } from "next/cache";
import { regenerateApiToken } from "@/lib/data/repository";

export async function regenerateTokenAction() {
  await regenerateApiToken();
  revalidatePath("/settings");
}
