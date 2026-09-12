import { NextResponse } from "next/server";
import { invalidateNotionCache } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function POST() {
  invalidateNotionCache();
  return NextResponse.json({ ok: true, message: "Cache invalidated" });
}
