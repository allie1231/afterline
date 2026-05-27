// Tiny CSV helpers — escape a single value, then build a row.

export function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const headerLine = headers.map(csvEscape).join(",");
  const dataLines = rows.map((row) =>
    headers.map((h) => csvEscape(row[h])).join(","),
  );
  return [headerLine, ...dataLines].join("\n");
}

export const AFTERLINE_CSV_HEADERS = [
  "text",
  "source_type",
  "source_title",
  "creator",
  "page",
  "url",
  "note",
  "mood_tags",
  "color_mood",
  "is_favorite",
  "visibility",
  "created_at",
] as const;
