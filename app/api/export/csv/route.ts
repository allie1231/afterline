import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AFTERLINE_CSV_HEADERS, buildCsv } from "@/lib/csv";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const [quotesRes, sourcesRes] = await Promise.all([
    supabase
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase.from("sources").select("*"),
  ]);

  if (quotesRes.error) {
    return new NextResponse(`Error: ${quotesRes.error.message}`, {
      status: 500,
    });
  }

  const sourcesById = new Map<string, Record<string, unknown>>(
    (sourcesRes.data ?? []).map((s) => [s.id as string, s]),
  );

  const rows = (quotesRes.data ?? []).map((q) => {
    const s = q.source_id ? sourcesById.get(q.source_id as string) : null;
    return {
      text: q.text,
      source_type: (s?.type as string) ?? "",
      source_title: (s?.title as string) ?? "",
      creator: (s?.creator as string) ?? "",
      page: q.page ?? "",
      url: (s?.url as string) ?? "",
      note: q.note ?? "",
      mood_tags: ((q.mood_tags ?? []) as string[]).join(";"),
      color_mood: q.color_mood ?? "",
      is_favorite: q.is_favorite ? "true" : "false",
      visibility: q.visibility ?? "private",
      created_at: q.created_at,
    };
  });

  const csv = "﻿" + buildCsv([...AFTERLINE_CSV_HEADERS], rows); // BOM for Excel/한글
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="afterline-${today}.csv"`,
    },
  });
}
