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

export interface CollectionsItem {
  source: Source;
  lines: number;
  favorites: number;
  note: CollectionNote | null;
  /** ISO string used for sorting; max of source.updated_at + note.updated_at */
  last_touch: string;
}

/**
 * Composite query for the /collections index — every source with its
 * line count, favorite count, and (optional) collection note.
 */
export async function getCollectionsItems(): Promise<CollectionsItem[]> {
  const supabase = await createClient();
  const [sourcesRes, quotesRes, notesRes] = await Promise.all([
    supabase.from("sources").select("*"),
    supabase.from("quotes").select("source_id, is_favorite"),
    supabase.from("collection_notes").select("*"),
  ]);
  if (sourcesRes.error) throw sourcesRes.error;
  if (quotesRes.error) throw quotesRes.error;
  if (notesRes.error) throw notesRes.error;

  const linesById = new Map<string, number>();
  const favsById = new Map<string, number>();
  for (const q of quotesRes.data ?? []) {
    if (!q.source_id) continue;
    const sid = q.source_id as string;
    linesById.set(sid, (linesById.get(sid) ?? 0) + 1);
    if (q.is_favorite) favsById.set(sid, (favsById.get(sid) ?? 0) + 1);
  }

  const noteById = new Map<string, CollectionNote>();
  for (const n of (notesRes.data ?? []) as CollectionNote[]) {
    noteById.set(n.source_id, n);
  }

  const items: CollectionsItem[] = (sourcesRes.data ?? []).map((s) => {
    const note = noteById.get(s.id as string) ?? null;
    const last_touch =
      note?.updated_at && note.updated_at > (s.updated_at ?? "")
        ? note.updated_at
        : (s.updated_at as string) ?? (s.created_at as string);
    return {
      source: s as Source,
      lines: linesById.get(s.id as string) ?? 0,
      favorites: favsById.get(s.id as string) ?? 0,
      note,
      last_touch,
    };
  });

  // Default: most recently touched first.
  items.sort((a, b) => b.last_touch.localeCompare(a.last_touch));
  return items;
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

// ---------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------

export interface CreateSourceInput {
  type: SourceType;
  title: string;
  creator?: string;
  publisher?: string;
  published_date?: string;
  isbn?: string;
  cover_url?: string;
  url?: string;
  spine_color?: string | null;
}

export async function createSource(input: CreateSourceInput): Promise<Source> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("sources")
    .insert({ ...input, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data as Source;
}

export interface CreateQuoteInput {
  source_id: string;
  text: string;
  page?: string;
  note?: string;
  mood_tags?: string[];
  is_favorite?: boolean;
}

export interface CollectionNoteFields {
  summary?: string | null;
  personal_note?: string | null;
  rating?: number | null;
  status?: CollectionNote["status"];
  started_at?: string | null;
  finished_at?: string | null;
  keywords?: string[];
}

export async function upsertCollectionNote(
  sourceId: string,
  fields: CollectionNoteFields,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("collection_notes")
    .select("id")
    .eq("source_id", sourceId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("collection_notes")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("collection_notes").insert({
      ...fields,
      source_id: sourceId,
      user_id: user.id,
    });
    if (error) throw error;
  }
}

export async function createQuote(input: CreateQuoteInput): Promise<Quote> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      source_id: input.source_id,
      text: input.text,
      page: input.page ?? null,
      note: input.note ?? null,
      mood_tags: input.mood_tags ?? [],
      is_favorite: input.is_favorite ?? false,
      visibility: "private",
      user_id: user.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Quote;
}

export async function getAllTags(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("quotes").select("mood_tags");
  const seen = new Set<string>();
  for (const q of data ?? []) {
    for (const t of (q.mood_tags ?? []) as string[]) {
      if (t.trim()) seen.add(t);
    }
  }
  return [...seen].sort();
}

export interface RandomLine {
  id: string;
  text: string;
  page: string | null;
  mood_tags: string[];
  is_favorite: boolean;
  source_id: string | null;
  source_title: string | null;
  source_type: SourceType | null;
  source_creator: string | null;
}

/**
 * Pool used by the entrance page's "Today's Line" panel. Fetches a
 * reasonable cap so the entire pool can ship to the client for shuffling
 * without a round-trip per click.
 */
export async function getRandomLinePool(
  limit = 200,
): Promise<RandomLine[]> {
  const supabase = await createClient();
  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, text, page, mood_tags, is_favorite, source_id")
    .order("created_at", { ascending: false })
    .limit(limit);

  const sourceIds = Array.from(
    new Set(
      (quotes ?? [])
        .map((q) => q.source_id as string | null)
        .filter((id): id is string => !!id),
    ),
  );

  let sourcesById = new Map<
    string,
    { title: string; type: SourceType; creator: string | null }
  >();
  if (sourceIds.length > 0) {
    const { data: sources } = await supabase
      .from("sources")
      .select("id, title, type, creator")
      .in("id", sourceIds);
    sourcesById = new Map(
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

  return (quotes ?? []).map((q) => {
    const src = q.source_id ? sourcesById.get(q.source_id as string) : null;
    return {
      id: q.id as string,
      text: q.text as string,
      page: (q.page as string | null) ?? null,
      mood_tags: ((q.mood_tags ?? []) as string[]) ?? [],
      is_favorite: !!q.is_favorite,
      source_id: (q.source_id as string | null) ?? null,
      source_title: src?.title ?? null,
      source_type: src?.type ?? null,
      source_creator: src?.creator ?? null,
    };
  });
}

export interface QuoteWithSource {
  quote: Quote;
  source: Source | null;
}

/**
 * All quotes carrying a given mood tag, joined with their source.
 * Used by /mood/[tag] tag drill-in pages.
 */
export async function getQuotesByTag(tag: string): Promise<QuoteWithSource[]> {
  const supabase = await createClient();
  const { data: quotes, error } = await supabase
    .from("quotes")
    .select("*")
    .contains("mood_tags", [tag])
    .order("created_at", { ascending: false });
  if (error) throw error;

  const sourceIds = Array.from(
    new Set(
      (quotes ?? [])
        .map((q) => q.source_id as string | null)
        .filter((id): id is string => !!id),
    ),
  );
  let byId = new Map<string, Source>();
  if (sourceIds.length > 0) {
    const { data: sources } = await supabase
      .from("sources")
      .select("*")
      .in("id", sourceIds);
    byId = new Map(
      ((sources ?? []) as Source[]).map((s) => [s.id, s]),
    );
  }
  return ((quotes ?? []) as Quote[]).map((q) => ({
    quote: q,
    source: q.source_id ? byId.get(q.source_id) ?? null : null,
  }));
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
