// 데이터 접근 레이어.
// 모든 화면은 이 함수들만 호출한다. 내부 구현은 Supabase 호출이며,
// RLS 정책 덕분에 로그인된 사용자의 데이터만 반환된다.
import { createClient } from "@/lib/supabase/server";
import { ROOM_CATEGORIES } from "./categories";
import type {
  CollectionNote,
  Quote,
  RoomCategory,
  Source,
  SourceType,
} from "./types";

export async function getRoomCategories(): Promise<RoomCategory[]> {
  return ROOM_CATEGORIES;
}

export async function getRoomCategory(
  type: SourceType,
): Promise<RoomCategory | null> {
  return ROOM_CATEGORIES.find((c) => c.type === type) ?? null;
}

export async function getSourcesByType(type: SourceType): Promise<Source[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("type", type)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Source[];
}

export async function getAllSources(): Promise<Source[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Source[];
}

export async function getSourceById(id: string): Promise<Source | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Source | null) ?? null;
}

export async function getQuotesBySource(sourceId: string): Promise<Quote[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("source_id", sourceId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Quote[];
}

export async function getAllQuotes(): Promise<Quote[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Quote[];
}

export async function getCollectionNoteBySource(
  sourceId: string,
): Promise<CollectionNote | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collection_notes")
    .select("*")
    .eq("source_id", sourceId)
    .maybeSingle();
  if (error) throw error;
  return (data as CollectionNote | null) ?? null;
}

export async function getAllCollectionNotes(): Promise<CollectionNote[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collection_notes")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CollectionNote[];
}

export async function countByRoom(): Promise<
  Record<SourceType, { sources: number; lines: number }>
> {
  const supabase = await createClient();
  const [{ data: sources }, { data: quotes }] = await Promise.all([
    supabase.from("sources").select("id, type"),
    supabase.from("quotes").select("source_id"),
  ]);

  const typeBySourceId = new Map<string, SourceType>();
  for (const s of sources ?? []) {
    typeBySourceId.set(s.id as string, s.type as SourceType);
  }

  const result = {} as Record<SourceType, { sources: number; lines: number }>;
  for (const cat of ROOM_CATEGORIES) {
    result[cat.type] = { sources: 0, lines: 0 };
  }
  for (const s of sources ?? []) {
    result[s.type as SourceType].sources += 1;
  }
  for (const q of quotes ?? []) {
    if (q.source_id) {
      const t = typeBySourceId.get(q.source_id as string);
      if (t) result[t].lines += 1;
    }
  }
  return result;
}

export async function getMoodTagsWithCounts(): Promise<
  { tag: string; count: number }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("quotes").select("mood_tags");
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const q of data ?? []) {
    for (const tag of (q.mood_tags ?? []) as string[]) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}
