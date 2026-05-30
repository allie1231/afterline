// Public JSON endpoint for the Scriptable widget (iOS home screen).
// GET /api/today?token=<personal-token>
//
// Returns one line for the day, picked deterministically by day-of-year so
// the widget shows the same quote across refreshes within a single day.
//
// The token is the same Personal Token used by the Chrome extension and
// /api/quick-add. Anyone with the URL can read the user's lines, so it
// must stay private. Rotate via /settings if it leaks.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  // Wrap everything so Scriptable / other JSON clients always get JSON,
  // never an HTML error page. A thrown exception here used to surface as
  // Next's default 500 HTML, which crashed JSON parsers on the consumer
  // side with "올바른 포맷이 아니기 때문에 …" / "Invalid JSON".
  try {
    const { searchParams } = new URL(request.url);
    const token = (searchParams.get("token") ?? "").trim();
    if (!token) return jsonError("missing token", 401);

    let sb;
    try {
      sb = createAdminClient();
    } catch (e) {
      return jsonError(
        e instanceof Error ? e.message : "service not configured",
        500,
      );
    }

    const { data: tokenRow, error: tokenErr } = await sb
      .from("api_tokens")
      .select("user_id")
      .eq("token", token)
      .maybeSingle();
    if (tokenErr) return jsonError(`db: ${tokenErr.message}`, 500);
    if (!tokenRow) return jsonError("invalid token", 401);
    const userId = tokenRow.user_id as string;

    const { data: quotes, error: qErr } = await sb
      .from("quotes")
      .select("id, text, page, source_id")
      .eq("user_id", userId)
      .limit(200)
      .order("created_at", { ascending: false });
    if (qErr) return jsonError(`db: ${qErr.message}`, 500);
    if (!quotes || quotes.length === 0) {
      return NextResponse.json({ text: null }, { headers: CORS_HEADERS });
    }

    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        86400000,
    );
    const pick = quotes[dayOfYear % quotes.length] as {
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

    return NextResponse.json(
      {
        id: pick.id,
        text: pick.text,
        page: pick.page,
        source_title,
        source_creator,
        source_type,
        day: today.toISOString().slice(0, 10),
      },
      { headers: CORS_HEADERS },
    );
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "unknown", 500);
  }
}
