"use server";

import { getData } from "@/lib/notion";
import type { SourceType } from "@/lib/data/types";

export type SearchHit = {
  source_id: string;
  source_title: string;
  source_type: SourceType;
  source_creator: string | null;
  quote_id?: string;
  quote_text?: string;
  quote_note?: string | null;
  quote_tags?: string[];
  matched_on: "title" | "creator" | "text" | "note" | "tag";
};

export async function searchAction(rawQuery: string): Promise<SearchHit[]> {
  const q = rawQuery.trim().toLowerCase();
  if (q.length < 1) return [];

  const { sources, quotes, sourceById } = await getData();

  const hits: SearchHit[] = [];
  const seenKey = new Set<string>();

  function push(h: SearchHit) {
    const key = h.quote_id ? `q:${h.quote_id}` : `s:${h.source_id}`;
    if (seenKey.has(key)) return;
    seenKey.add(key);
    hits.push(h);
  }

  for (const s of sources) {
    if (s.title.toLowerCase().includes(q)) {
      push({
        source_id: s.id,
        source_title: s.title,
        source_type: s.type,
        source_creator: s.creator ?? null,
        matched_on: "title",
      });
    }
    if (s.creator && s.creator.toLowerCase().includes(q)) {
      push({
        source_id: s.id,
        source_title: s.title,
        source_type: s.type,
        source_creator: s.creator ?? null,
        matched_on: "creator",
      });
    }
  }

  for (const qt of quotes) {
    if (!qt.source_id) continue;
    const src = sourceById.get(qt.source_id);
    if (!src) continue;

    if (qt.text.toLowerCase().includes(q)) {
      push({
        source_id: qt.source_id,
        source_title: src.title,
        source_type: src.type,
        source_creator: src.creator ?? null,
        quote_id: qt.id,
        quote_text: qt.text,
        quote_note: qt.note ?? null,
        quote_tags: qt.mood_tags,
        matched_on: "text",
      });
    } else if (qt.note && qt.note.toLowerCase().includes(q)) {
      push({
        source_id: qt.source_id,
        source_title: src.title,
        source_type: src.type,
        source_creator: src.creator ?? null,
        quote_id: qt.id,
        quote_text: qt.text,
        quote_note: qt.note,
        quote_tags: qt.mood_tags,
        matched_on: "note",
      });
    }
    if (hits.length >= 50) break;
  }

  return hits;
}
