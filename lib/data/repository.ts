// 데이터 접근 레이어.
// 모든 화면은 이 함수들만 호출한다. 내부 구현은 Supabase 호출이며,
// RLS 정책 덕분에 로그인된 사용자의 데이터만 반환된다.
import { createClient } from "@/lib/supabase/server";
import { ROOM_CATEGORIES } from "./categories";
import type {
  CollectionNote,
  Note,
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
  genre?: string | null;
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

export interface StatsData {
  totalLines: number;
  totalSources: number;
  totalTags: number;
  favoriteLines: number;
  linesByType: Record<SourceType, number>;
  sourcesByType: Record<SourceType, number>;
  topTags: { tag: string; count: number }[];
  // Top tags grouped by source type — empty array when a room has no tagged quotes.
  tagsByType: Record<SourceType, { tag: string; count: number }[]>;
  // Genre × type buckets — built from sources.genre (auto-filled or manual).
  // Map: SourceType → array of {genre, sources, lines} sorted by line count desc.
  genresByType: Record<
    SourceType,
    { genre: string; sources: number; lines: number }[]
  >;
  topSources: { source: Source; lines: number }[];
  activity: { date: string; count: number }[]; // last 30 days, oldest → newest
  latestLineAt: string | null;
}

export async function getStatsData(): Promise<StatsData> {
  const supabase = await createClient();
  const [{ data: sources }, { data: quotes }] = await Promise.all([
    supabase.from("sources").select("*"),
    supabase
      .from("quotes")
      .select("id, source_id, mood_tags, is_favorite, created_at"),
  ]);

  const allSources = (sources ?? []) as Source[];
  const allQuotes = quotes ?? [];

  // Init type buckets
  const linesByType = {} as Record<SourceType, number>;
  const sourcesByType = {} as Record<SourceType, number>;
  for (const cat of ROOM_CATEGORIES) {
    linesByType[cat.type] = 0;
    sourcesByType[cat.type] = 0;
  }

  const sourceTypeById = new Map<string, SourceType>();
  for (const s of allSources) {
    sourceTypeById.set(s.id, s.type);
    sourcesByType[s.type] = (sourcesByType[s.type] ?? 0) + 1;
  }

  const linesBySourceId = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  const tagCountsByType = new Map<SourceType, Map<string, number>>();
  for (const cat of ROOM_CATEGORIES) tagCountsByType.set(cat.type, new Map());
  const activityByDay = new Map<string, number>();
  let favoriteLines = 0;
  let latestLineAt: string | null = null;

  for (const q of allQuotes) {
    const sType = q.source_id
      ? sourceTypeById.get(q.source_id as string)
      : undefined;
    if (q.source_id) {
      if (sType) linesByType[sType] = (linesByType[sType] ?? 0) + 1;
      linesBySourceId.set(
        q.source_id as string,
        (linesBySourceId.get(q.source_id as string) ?? 0) + 1,
      );
    }
    if (q.is_favorite) favoriteLines += 1;
    const created = q.created_at as string;
    if (created) {
      if (!latestLineAt || created > latestLineAt) latestLineAt = created;
      const day = created.slice(0, 10);
      activityByDay.set(day, (activityByDay.get(day) ?? 0) + 1);
    }
    for (const tag of (q.mood_tags ?? []) as string[]) {
      if (!tag.trim()) continue;
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      if (sType) {
        const bucket = tagCountsByType.get(sType)!;
        bucket.set(tag, (bucket.get(tag) ?? 0) + 1);
      }
    }
  }

  const topTags = [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const tagsByType = {} as Record<SourceType, { tag: string; count: number }[]>;
  for (const [type, bucket] of tagCountsByType.entries()) {
    tagsByType[type] = [...bucket.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // Genres × type — count source records and total lines per (type, genre).
  const genreCountsByType = new Map<
    SourceType,
    Map<string, { sources: number; lines: number }>
  >();
  for (const cat of ROOM_CATEGORIES) genreCountsByType.set(cat.type, new Map());
  for (const s of allSources) {
    const g = (s.genre ?? "").trim();
    if (!g) continue;
    const bucket = genreCountsByType.get(s.type)!;
    const prev = bucket.get(g) ?? { sources: 0, lines: 0 };
    bucket.set(g, {
      sources: prev.sources + 1,
      lines: prev.lines + (linesBySourceId.get(s.id) ?? 0),
    });
  }
  const genresByType = {} as Record<
    SourceType,
    { genre: string; sources: number; lines: number }[]
  >;
  for (const [type, bucket] of genreCountsByType.entries()) {
    genresByType[type] = [...bucket.entries()]
      .map(([genre, v]) => ({ genre, ...v }))
      .sort((a, b) => b.lines - a.lines || b.sources - a.sources);
  }

  const topSources = [...linesBySourceId.entries()]
    .map(([sourceId, lines]) => ({
      source: allSources.find((s) => s.id === sourceId)!,
      lines,
    }))
    .filter((x) => !!x.source)
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 5);

  // Build last-30-day activity array (oldest → newest), filling zeros for empty days.
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const activity: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const iso = d.toISOString().slice(0, 10);
    activity.push({ date: iso, count: activityByDay.get(iso) ?? 0 });
  }

  return {
    totalLines: allQuotes.length,
    totalSources: allSources.length,
    totalTags: tagCounts.size,
    favoriteLines,
    linesByType,
    sourcesByType,
    topTags,
    tagsByType,
    genresByType,
    topSources,
    activity,
    latestLineAt,
  };
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

// ---------------------------------------------------------------------
// Personal API tokens (extension / external clients)
// ---------------------------------------------------------------------

function generateApiToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `afterline_${Buffer.from(bytes).toString("base64url")}`;
}

export async function getOrCreateApiToken(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("api_tokens")
    .select("token")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing?.token) return existing.token as string;

  const token = generateApiToken();
  const { error } = await supabase
    .from("api_tokens")
    .insert({ user_id: user.id, token });
  if (error) throw error;
  return token;
}

export async function regenerateApiToken(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("api_tokens").delete().eq("user_id", user.id);
  const token = generateApiToken();
  const { error } = await supabase
    .from("api_tokens")
    .insert({ user_id: user.id, token });
  if (error) throw error;
  return token;
}

// ─────────────────────────────────────────────────────────────────────
// Notes — long-form journal entries attached to a source
// ─────────────────────────────────────────────────────────────────────

export async function getNotesBySource(sourceId: string): Promise<Note[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("source_id", sourceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Note[];
}

export async function getNoteById(id: string): Promise<Note | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Note | null) ?? null;
}

export interface NoteWithSource {
  note: Note;
  source: Source | null;
}

export async function getAllNotesWithSource(): Promise<NoteWithSource[]> {
  const supabase = await createClient();
  const { data: notes, error } = await supabase
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const noteList = (notes ?? []) as Note[];

  const sourceIds = Array.from(
    new Set(
      noteList
        .map((n) => n.source_id)
        .filter((id): id is string => !!id),
    ),
  );
  let sourcesById = new Map<string, Source>();
  if (sourceIds.length > 0) {
    const { data: sources } = await supabase
      .from("sources")
      .select("*")
      .in("id", sourceIds);
    sourcesById = new Map(
      ((sources ?? []) as Source[]).map((s) => [s.id, s]),
    );
  }
  return noteList.map((n) => ({
    note: n,
    source: n.source_id ? (sourcesById.get(n.source_id) ?? null) : null,
  }));
}

export interface CreateNoteInput {
  source_id: string | null;
  kind?: string | null;
  title?: string | null;
  body: string;
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const payload = {
    user_id: user.id,
    source_id: input.source_id,
    kind: input.kind?.trim() || null,
    title: input.title?.trim() || null,
    body: input.body,
  };
  const { data, error } = await supabase
    .from("notes")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Note;
}

export interface UpdateNoteInput {
  kind?: string | null;
  title?: string | null;
  body?: string;
}

export async function updateNote(
  id: string,
  fields: UpdateNoteInput,
): Promise<void> {
  const supabase = await createClient();
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (fields.kind !== undefined) patch.kind = fields.kind?.trim() || null;
  if (fields.title !== undefined) patch.title = fields.title?.trim() || null;
  if (fields.body !== undefined) patch.body = fields.body;
  const { error } = await supabase.from("notes").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteNote(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}

// Fetch quotes by IDs in one round trip, with their parent source attached.
// Used to resolve [[q:id]] references embedded in note bodies. IDs that
// don't exist (or that the user can't see via RLS) are silently dropped.
export async function getQuotesWithSourceByIds(
  ids: string[],
): Promise<Map<string, { quote: Quote; source: Source | null }>> {
  if (ids.length === 0) return new Map();
  const supabase = await createClient();
  const { data: quotes } = await supabase
    .from("quotes")
    .select("*")
    .in("id", ids);
  const quoteList = (quotes ?? []) as Quote[];
  const sourceIds = Array.from(
    new Set(
      quoteList.map((q) => q.source_id).filter((s): s is string => !!s),
    ),
  );
  let sourcesById = new Map<string, Source>();
  if (sourceIds.length > 0) {
    const { data: sources } = await supabase
      .from("sources")
      .select("*")
      .in("id", sourceIds);
    sourcesById = new Map(
      ((sources ?? []) as Source[]).map((s) => [s.id, s]),
    );
  }
  const map = new Map<string, { quote: Quote; source: Source | null }>();
  for (const q of quoteList) {
    map.set(q.id, {
      quote: q,
      source: q.source_id ? (sourcesById.get(q.source_id) ?? null) : null,
    });
  }
  return map;
}

// ─────────────────────────────────────────────────────────────────────
// People — surface every source by a single creator together
// ─────────────────────────────────────────────────────────────────────

// Movie's `creator` field stores the FORMAT (영화/드라마/애니메이션) — not a
// person. Excluded from author/people aggregation so "영화" isn't a "person".
const PEOPLE_EXCLUDED_TYPES = new Set<SourceType>(["movie"]);

export interface CreatorSummary {
  name: string;
  sources: number;
  lines: number;
  types: SourceType[]; // distinct, sorted
}

export async function getAllCreators(): Promise<CreatorSummary[]> {
  const supabase = await createClient();
  const [{ data: sources }, { data: quotes }] = await Promise.all([
    supabase.from("sources").select("id, type, creator"),
    supabase.from("quotes").select("source_id"),
  ]);
  const linesBySource = new Map<string, number>();
  for (const q of quotes ?? []) {
    const sid = q.source_id as string | null;
    if (!sid) continue;
    linesBySource.set(sid, (linesBySource.get(sid) ?? 0) + 1);
  }
  const byName = new Map<
    string,
    { sources: number; lines: number; types: Set<SourceType> }
  >();
  for (const s of sources ?? []) {
    const type = s.type as SourceType;
    if (PEOPLE_EXCLUDED_TYPES.has(type)) continue;
    const name = ((s.creator as string | null) ?? "").trim();
    if (!name) continue;
    const id = s.id as string;
    const entry = byName.get(name) ?? {
      sources: 0,
      lines: 0,
      types: new Set<SourceType>(),
    };
    entry.sources += 1;
    entry.lines += linesBySource.get(id) ?? 0;
    entry.types.add(type);
    byName.set(name, entry);
  }
  return [...byName.entries()]
    .map(([name, v]) => ({
      name,
      sources: v.sources,
      lines: v.lines,
      types: [...v.types].sort(),
    }))
    .sort((a, b) => b.lines - a.lines || b.sources - a.sources);
}

export interface PersonPage {
  name: string;
  sources: Source[];
  lines: number;
  notesCount: number;
  recentQuotes: Array<{ quote: Quote; source: Source }>;
}

export async function getPersonPage(name: string): Promise<PersonPage | null> {
  const supabase = await createClient();
  // Sources where creator matches exactly (case-sensitive — names tend to be
  // canonical from search results so this is fine for v1).
  const { data: sources, error: sErr } = await supabase
    .from("sources")
    .select("*")
    .eq("creator", name)
    .order("created_at", { ascending: false });
  if (sErr) throw sErr;
  const sourceList = (sources ?? []) as Source[];
  if (sourceList.length === 0) return null;

  const ids = sourceList.map((s) => s.id);
  const [{ data: quotes }, { count: notesCount }] = await Promise.all([
    supabase
      .from("quotes")
      .select("*")
      .in("source_id", ids)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("notes")
      .select("*", { count: "exact", head: true })
      .in("source_id", ids),
  ]);
  const quotesList = (quotes ?? []) as Quote[];
  const sourceById = new Map(sourceList.map((s) => [s.id, s]));

  const recentQuotes = quotesList
    .filter((q) => q.source_id && sourceById.has(q.source_id))
    .map((q) => ({ quote: q, source: sourceById.get(q.source_id!)! }));

  // Best estimate of total line count: a separate count query would be exact,
  // but the limit:40 above covers the displayed slice. Use total with a
  // dedicated count query for the stats strip.
  const { count: totalLines } = await supabase
    .from("quotes")
    .select("*", { count: "exact", head: true })
    .in("source_id", ids);

  return {
    name,
    sources: sourceList,
    lines: totalLines ?? quotesList.length,
    notesCount: notesCount ?? 0,
    recentQuotes,
  };
}
