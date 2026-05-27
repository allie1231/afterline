import { NextResponse } from "next/server";
import { AFTERLINE_CSV_HEADERS, buildCsv } from "@/lib/csv";

export async function GET() {
  const example = {
    text: 'Each man had only one genuine vocation — to find the way to himself.',
    source_type: "book",
    source_title: "Demian",
    creator: "Hermann Hesse",
    page: "132",
    url: "",
    note: "안쪽으로 내려가는 길.",
    mood_tags: "quiet courage;strange hope",
    color_mood: "",
    is_favorite: "true",
    visibility: "private",
    created_at: "2026-01-05",
  };

  const csv = "﻿" + buildCsv([...AFTERLINE_CSV_HEADERS], [example]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="afterline-template.csv"`,
    },
  });
}
