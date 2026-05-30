// Alias of /api/today for the iOS Scriptable widget — same logic,
// fresh path. We can't just re-export GET from the original module
// because Next.js's route detection inspects the source file directly
// at build time and won't pick up an imported handler.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const token = (searchParams.get("token") ?? "").trim();
    if (!token) return json({ error: "missing token" }, 401);

    let sb;
    try {
      sb = createAdminClient();
    } catch (e) {
      return json(
        { error: e instanceof Error ? e.message : "service not configured" },
        500,
      );
    }

    const { data: tokenRow, error: tokenErr } = await sb
      .from("api_tokens")
      .select("user_id")
      .eq("token", token)
      .maybeSingle();
    if (tokenErr) return json({ error: `db: ${tokenErr.message}` }, 500);
    if (!tokenRow) return json({ error: "invalid token" }, 401);
    const userId = tokenRow.user_id as string;

    const { data: quotes, error: qErr } = await sb
      .from("quotes")
      .select("id, text, page, source_id")
      .eq("user_id", userId)
      .limit(200)
      .order("created_at", { ascending: false });
    if (qErr) return json({ error: `db: ${qErr.message}` }, 500);
    if (!quotes || quotes.length === 0) return json({ text: null });

    const now = Date.now();
    // Selection strategy:
    //   ?random=1        → pure random (one-shot tap-to-refresh)
    //   ?period=hour     → deterministic per hour-of-epoch
    //   (default)        → deterministic per day-of-year
    // All three return the same line for any call within the same bucket,
    // so iOS widget refreshes within a bucket don't thrash.
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
    const pick = quotes[index] as {
      id: string;
      text: string;
      page: string | null;
      source_id: string | null;
    };

    let source_title: string | null = null;
    let source_creator: string | null = null;
    let source_type: string | null = null;
    if (pick.source_id) {
      const { data: s } = await sb
        .from("sources")
        .select("title, creator, type")
        .eq("id", pick.source_id)
        .maybeSingle();
      source_title = (s?.title as string | null) ?? null;
      source_creator = (s?.creator as string | null) ?? null;
      source_type = (s?.type as string | null) ?? null;
    }

    return json({
      id: pick.id,
      text: pick.text,
      page: pick.page,
      source_title,
      source_creator,
      source_type,
      day: new Date(now).toISOString().slice(0, 10),
    });
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : "unknown" },
      500,
    );
  }
}
