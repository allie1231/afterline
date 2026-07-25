"use server";

import { createClient } from "@/lib/supabase/server";
import type { SourceType } from "@/lib/data/types";

export type SearchHit = {
  source_id: string;
  source_title: string;
  source_type: SourceType;
  source_creator: string | null;
  // Quote-level fields populated when the hit is matched via a quote
  quote_id?: string;
  quote_text?: string;
  quote_note?: string | null;
  quote_tags?: string[];
  matched_on: "title" | "creator" | "text" | "note" | "tag";
};

function escapeLikePattern(s: string): string {
  // Escape Postgres LIKE wildcards so user input is treated literally.
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function searchAction(rawQuery: string): Promise<SearchHit[]> {
  const q = rawQuery.trim();
  if (q.length < 1) return [];

  const supabase = await createClient();
  const pattern = `%${escapeLikePattern(q)}%`;

  // 5 parallel queries: source title, source creator, quote text, quote note, mood tags.
  const [titleRes, creatorRes, textRes, noteRes, tagRes] = await Promise.all([
    supabase
      .from("sources")
      .select("id, title, creator, type")
      .ilike("title", pattern)
      .limit(20),
    supabase
      .from("sources")
      .select("id, title, creator, type")
      .ilike("creator", pattern)
      .limit(20),
    supabase
      .from("quotes")
      .select("id, text, note, mood_tags, source_id")
      .ilike("text", pattern)
      .limit(30),
    supabase
      .from("quotes")
      .select("id, text, note, mood_tags, source_id")
      .ilike("note", pattern)
      .limit(20),
    supabase
      .from("quotes")
      .select("id, text, note, mood_tags, source_id")
      .not("mood_tags", "eq", "{}")
      .limit(500),
  ]);

  // Resolve source meta for quote-hits.
  const quoteSourceIds = new Set<string>();
  for (const q of textRes.data ?? []) {
    if (q.source_id) quoteSourceIds.add(q.source_id as string);
  }
  for (const q of noteRes.data ?? []) {
    if (q.source_id) quoteSourceIds.add(q.source_id as string);
  }
  for (const q of tagRes.data ?? []) {
    if (q.source_id) quoteSourceIds.add(q.source_id as string);
  }
  let sourceMap = new Map<
    string,
    { title: string; type: SourceType; creator: string | null }
  >();
  if (quoteSourceIds.size > 0) {
    const { data: sources } = await supabase
      .from("sources")
      .select("id, title, type, creator")
      .in("id", [...quoteSourceIds]);
    sourceMap = new Map(
      (sources ?? []).map((s) => [
        s.id as string,
        {
          title: s.title as string,
          type: s.type as SourceType,
          creator: (s.creator as string | null) ?? null,
        },
      ]),
    );
  }

  const hits: SearchHit[] = [];
  const seenKey = new Set<string>();

  // Helper to dedupe the same quote appearing in multiple match buckets.
  function push(h: SearchHit) {
    const key = h.quote_id ? `q:${h.quote_id}` : `s:${h.source_id}`;
    if (seenKey.has(key)) return;
    seenKey.add(key);
    hits.push(h);
  }

  // Source title matches → source-level hits (no quote attached)
  for (const s of titleRes.data ?? []) {
    push({
      source_id: s.id as string,
      source_title: s.title as string,
      source_type: s.type as SourceType,
      source_creator: (s.creator as string | null) ?? null,
      matched_on: "title",
    });
  }
  for (const s of creatorRes.data ?? []) {
    push({
      source_id: s.id as string,
      source_title: s.title as string,
      source_type: s.type as SourceType,
      source_creator: (s.creator as string | null) ?? null,
      matched_on: "creator",
    });
  }

  // Quote text / note matches → quote-level hits
  function fromQuote(
    q: {
      id: string;
      text: string;
      note: string | null;
      mood_tags: string[] | null;
      source_id: string | null;
    },
    matched_on: "text" | "note" | "tag",
  ): SearchHit | null {
    if (!q.source_id) return null;
    const src = sourceMap.get(q.source_id);
    if (!src) return null;
    return {
      source_id: q.source_id,
      source_title: src.title,
      source_type: src.type,
      source_creator: src.creator,
      quote_id: q.id,
      quote_text: q.text,
      quote_note: q.note ?? null,
      quote_tags: q.mood_tags ?? [],
      matched_on,
    };
  }
  for (const q of (textRes.data ?? []) as Array<{
    id: string;
    text: string;
    note: string | null;
    mood_tags: string[] | null;
    source_id: string | null;
  }>) {
    const h = fromQuote(q, "text");
    if (h) push(h);
  }
  for (const q of (noteRes.data ?? []) as Array<{
    id: string;
    text: string;
    note: string | null;
    mood_tags: string[] | null;
    source_id: string | null;
  }>) {
    const h = fromQuote(q, "note");
    if (h) push(h);
  }

  // Mood tag matches — supabase-js can't do "array element ilike", so
  // we fetched quotes with non-empty tags and filter client-side.
  const lowQ = q.toLowerCase();
  for (const qt of (tagRes.data ?? []) as Array<{
    id: string;
    text: string;
    note: string | null;
    mood_tags: string[] | null;
    source_id: string | null;
  }>) {
    const tags = (qt.mood_tags ?? []) as string[];
    if (tags.some((t) => t.toLowerCase().includes(lowQ))) {
      const h = fromQuote(qt, "tag");
      if (h) push(h);
    }
  }

  return hits;
}
