import { NextResponse } from "next/server";
import { getData } from "@/lib/notion";
import { AFTERLINE_CSV_HEADERS, buildCsv } from "@/lib/csv";

export async function GET() {
  const { quotes, sourceById } = await getData();

  const rows = quotes.map((q) => {
    const s = q.source_id ? sourceById.get(q.source_id) : null;
    return {
      text: q.text,
      source_type: s?.type ?? "",
      source_title: s?.title ?? "",
      creator: s?.creator ?? "",
      page: q.page ?? "",
      url: s?.url ?? "",
      note: q.note ?? "",
      mood_tags: q.mood_tags.join(";"),
      color_mood: q.color_mood ?? "",
      is_favorite: q.is_favorite ? "true" : "false",
      visibility: q.visibility ?? "private",
      created_at: q.created_at,
    };
  });

  const csv = "﻿" + buildCsv([...AFTERLINE_CSV_HEADERS], rows);
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="afterline-${today}.csv"`,
    },
  });
}
