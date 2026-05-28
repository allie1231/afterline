// POST /api/quick-add
//
// External clients (chrome extension, bookmarklet, scripts) hit this with a
// Personal Token from /settings. The token is validated via the service-role
// key (RLS-bypass), then we find-or-create an `article` source by URL and
// drop a new quote under it.

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, init: ResponseInit = {}) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...CORS, ...(init.headers ?? {}) },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

type Body = {
  text?: string;
  page_url?: string;
  page_title?: string;
  page_creator?: string;
  note?: string;
};

export async function POST(req: NextRequest) {
  const match = /^Bearer\s+(\S+)$/.exec(req.headers.get("authorization") ?? "");
  if (!match) {
    return json({ error: "missing or malformed bearer token" }, { status: 401 });
  }
  const token = match[1];

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: "invalid JSON body" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return json({ error: "`text` is required" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return json({ error: "server not configured" }, { status: 500 });
  }

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1) Validate the token, resolve the owning user.
  const { data: tokenRow } = await sb
    .from("api_tokens")
    .select("user_id")
    .eq("token", token)
    .maybeSingle();
  if (!tokenRow) {
    return json({ error: "invalid token" }, { status: 401 });
  }
  const userId = tokenRow.user_id as string;

  // 2) Find or create the source by URL. Extension defaults to the
  //    "other" room — the user can re-file from inside the app.
  let sourceId: string | undefined;
  const pageUrl = body.page_url?.trim() || null;
  if (pageUrl) {
    const { data: existing } = await sb
      .from("sources")
      .select("id")
      .eq("user_id", userId)
      .eq("url", pageUrl)
      .maybeSingle();
    if (existing?.id) sourceId = existing.id as string;
  }
  if (!sourceId) {
    const title =
      (body.page_title?.trim() || pageUrl || "Untitled").slice(0, 200);
    const { data: created, error: srcErr } = await sb
      .from("sources")
      .insert({
        user_id: userId,
        type: "other",
        title,
        creator: body.page_creator?.trim() || null,
        url: pageUrl,
      })
      .select("id")
      .single();
    if (srcErr || !created) {
      return json(
        { error: srcErr?.message ?? "failed to create source" },
        { status: 500 },
      );
    }
    sourceId = created.id as string;
  }

  // 3) Insert the quote.
  const { data: quote, error: qErr } = await sb
    .from("quotes")
    .insert({
      user_id: userId,
      source_id: sourceId,
      text,
      note: body.note?.trim() || null,
      mood_tags: [],
      is_favorite: false,
      visibility: "private",
    })
    .select("id")
    .single();
  if (qErr || !quote) {
    return json(
      { error: qErr?.message ?? "failed to create quote" },
      { status: 500 },
    );
  }

  // 4) Best-effort: mark the token as used.
  await sb
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token", token);

  return json({ ok: true, source_id: sourceId, quote_id: quote.id });
}
