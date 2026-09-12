import { NextResponse } from "next/server";
import { getData } from "@/lib/notion";

export const dynamic = "force-dynamic";

const HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store, max-age=0",
};

function json(body: unknown, status = 200) {
  return new NextResponse(JSON.stringify(body), { status, headers: HEADERS });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { quotes, sourceById } = await getData();
    if (quotes.length === 0) return json({ text: null });

    const now = Date.now();
    const random = searchParams.get("random") === "1";
    const period = searchParams.get("period");
    let index: number;
    if (random) {
      index = Math.floor(Math.random() * quotes.length);
    } else if (period === "hour") {
      index = Math.floor(now / 3_600_000) % quotes.length;
    } else {
      const today = new Date(now);
      index =
        Math.floor(
          (today.getTime() -
            new Date(today.getFullYear(), 0, 0).getTime()) /
            86_400_000,
        ) % quotes.length;
    }
    const pick = quotes[index];
    const src = pick.source_id ? sourceById.get(pick.source_id) : null;

    return json({
      id: pick.id,
      text: pick.text,
      page: pick.page ?? null,
      source_title: src?.title ?? null,
      source_creator: src?.creator ?? null,
      source_type: src?.type ?? null,
      day: new Date(now).toISOString().slice(0, 10),
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
}
