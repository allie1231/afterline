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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = (searchParams.get("token") ?? "").trim();
  if (!token) {
    return NextResponse.json({ error: "missing token" }, { status: 401 });
  }

  const sb = createAdminClient();
  const { data: tokenRow } = await sb
    .from("api_tokens")
    .select("user_id")
    .eq("token", token)
    .maybeSingle();
  if (!tokenRow) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }
  const userId = tokenRow.user_id as string;

  const { data: quotes } = await sb
    .from("quotes")
    .select("id, text, page, source_id")
    .eq("user_id", userId)
    .limit(200)
    .order("created_at", { ascending: false });

  if (!quotes || quotes.length === 0) {
    return NextResponse.json({ text: null });
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
    {
      headers: {
        // Allow Scriptable / other clients to fetch from any origin.
        "Access-Control-Allow-Origin": "*",
        "Cache-Control":
          "public, s-maxage=300, stale-while-revalidate=3600",
      },
    },
  );
}
