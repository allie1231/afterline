import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { invalidateNotionCache } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function POST() {
  invalidateNotionCache();
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, message: "Cache invalidated" });
}
