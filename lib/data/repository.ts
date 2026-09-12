import { getData } from "@/lib/notion";
import { ROOM_CATEGORIES } from "./categories";
import type {
  CollectionNote,
  Note,
  Quote,
  RoomCategory,
  Source,
  SourceType,
} from "./types";

// ─────────────────────────────────────────────────────────────────────
// Room categories (static)
// ─────────────────────────────────────────────────────────────────────

export async function getRoomCategories(): Promise<RoomCategory[]> {
  return ROOM_CATEGORIES;
}

export async function getRoomCategory(
  type: SourceType,
): Promise<RoomCategory | null> {
  return ROOM_CATEGORIES.find((c) => c.type === type) ?? null;
}

// ─────────────────────────────────────────────────────────────────────
// Sources
// ─────────────────────────────────────────────────────────────────────

export async function getSourcesByType(type: SourceType): Promise<Source[]> {
  const { sources } = await getData();
  return sources.filter((s) => s.type === type);
}

export async function getAllSources(): Promise<Source[]> {
  const { sources } = await getData();
  return sources;
}

export async function getSourceById(id: string): Promise<Source | null> {
  const { sourceById } = await getData();
  return sourceById.get(id) ?? null;
}

// ─────────────────────────────────────────────────────────────────────
// Quotes
// ─────────────────────────────────────────────────────────────────────

export async function getQuotesBySource(sourceId: string): Promise<Quote[]> {
  const { quotes } = await getData();
  return quotes
    .filter((q) => q.source_id === sourceId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function getAllQuotes(): Promise<Quote[]> {
  const { quotes } = await getData();
  return quotes;
}

// ─────────────────────────────────────────────────────────────────────
// Collection notes
// ─────────────────────────────────────────────────────────────────────

export async function getCollectionNoteBySource(
  sourceId: string,
): Promise<CollectionNote | null> {
  const { collectionNotes } = await getData();
  return collectionNotes.find((n) => n.source_id === sourceId) ?? null;
}

export async function getAllCollectionNotes(): Promise<CollectionNote[]> {
  const { collectionNotes } = await getData();
  return collectionNotes;
}

// ─────────────────────────────────────────────────────────────────────
// Collections composite view
// ─────────────────────────────────────────────────────────────────────

export interface CollectionsItem {
  source: Source;
  lines: number;
  favorites: number;
  note: CollectionNote | null;
  last_touch: string;
}

export async function getCollectionsItems(): Promise<CollectionsItem[]> {
  const { sources, quotes, collectionNotes } = await getData();

  const linesById = new Map<string, number>();
  const favsById = new Map<string, number>();
  for (const q of quotes) {
    if (!q.source_id) continue;
    linesById.set(q.source_id, (linesById.get(q.source_id) ?? 0) + 1);
    if (q.is_favorite)
      favsById.set(q.source_id, (favsById.get(q.source_id) ?? 0) + 1);
  }

  const noteById = new Map<string, CollectionNote>();
  for (const n of collectionNotes) noteById.set(n.source_id, n);

  const items: CollectionsItem[] = sources.map((s) => {
    const note = noteById.get(s.id) ?? null;
    const last_touch =
      note?.updated_at && note.updated_at > (s.updated_at ?? "")
        ? note.updated_at
        : s.updated_at ?? s.created_at;
    return {
      source: s,
      lines: linesById.get(s.id) ?? 0,
      favorites: favsById.get(s.id) ?? 0,
      note,
      last_touch,
    };
  });

  items.sort((a, b) => b.last_touch.localeCompare(a.last_touch));
  return items;
}

// ─────────────────────────────────────────────────────────────────────
// Room counts
// ─────────────────────────────────────────────────────────────────────

export async function countByRoom(): Promise<
  Record<SourceType, { sources: number; lines: number }>
> {
  const { sources, quotes, sourceById } = await getData();

  const result = {} as Record<SourceType, { sources: number; lines: number }>;
  for (const cat of ROOM_CATEGORIES)
    result[cat.type] = { sources: 0, lines: 0 };

  for (const s of sources) {
    result[s.type].sources += 1;
  }
  for (const q of quotes) {
    if (q.source_id) {
      const s = sourceById.get(q.source_id);
      if (s) result[s.type].lines += 1;
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────
// Tags
// ─────────────────────────────────────────────────────────────────────

export async function getAllTags(): Promise<string[]> {
  const { quotes } = await getData();
  const seen = new Set<string>();
  for (const q of quotes) {
    for (const t of q.mood_tags) {
      if (t.trim()) seen.add(t);
    }
  }
  return [...seen].sort();
}

export async function getMoodTagsWithCounts(): Promise<
  { tag: string; count: number }[]
> {
  const { quotes } = await getData();
  const counts = new Map<string, number>();
  for (const q of quotes) {
    for (const tag of q.mood_tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// ─────────────────────────────────────────────────────────────────────
// Random line pool
// ─────────────────────────────────────────────────────────────────────

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

export async function getRandomLinePool(limit = 200): Promise<RandomLine[]> {
  const { quotes, sourceById } = await getData();
  return quotes.slice(0, limit).map((q) => {
    const src = q.source_id ? sourceById.get(q.source_id) : undefined;
    return {
      id: q.id,
      text: q.text,
      page: q.page ?? null,
      mood_tags: q.mood_tags,
      is_favorite: q.is_favorite,
      source_id: q.source_id,
      source_title: src?.title ?? null,
      source_type: src?.type ?? null,
      source_creator: src?.creator ?? null,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────
// Quotes by tag
// ─────────────────────────────────────────────────────────────────────

export interface QuoteWithSource {
  quote: Quote;
  source: Source | null;
}

export async function getQuotesByTag(tag: string): Promise<QuoteWithSource[]> {
  const { quotes, sourceById } = await getData();
  return quotes
    .filter((q) => q.mood_tags.includes(tag))
    .map((q) => ({
      quote: q,
      source: q.source_id ? sourceById.get(q.source_id) ?? null : null,
    }));
}

// ─────────────────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────────────────

export interface StatsData {
  totalLines: number;
  totalSources: number;
  totalTags: number;
  favoriteLines: number;
  linesByType: Record<SourceType, number>;
  sourcesByType: Record<SourceType, number>;
  topTags: { tag: string; count: number }[];
  tagsByType: Record<SourceType, { tag: string; count: number }[]>;
  genresByType: Record<
    SourceType,
    { genre: string; sources: number; lines: number }[]
  >;
  topSources: { source: Source; lines: number }[];
  activity: { date: string; count: number }[];
  latestLineAt: string | null;
  notes: {
    total: number;
    avgWords: number;
    longest: number;
    byType: Record<SourceType, number>;
    byKind: { kind: string; count: number }[];
  };
}

export async function getStatsData(): Promise<StatsData> {
  const { sources, quotes, sourceById } = await getData();

  const linesByType = {} as Record<SourceType, number>;
  const sourcesByType = {} as Record<SourceType, number>;
  for (const cat of ROOM_CATEGORIES) {
    linesByType[cat.type] = 0;
    sourcesByType[cat.type] = 0;
  }

  for (const s of sources) {
    sourcesByType[s.type] = (sourcesByType[s.type] ?? 0) + 1;
  }

  const linesBySourceId = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  const tagCountsByType = new Map<SourceType, Map<string, number>>();
  for (const cat of ROOM_CATEGORIES) tagCountsByType.set(cat.type, new Map());
  const activityByDay = new Map<string, number>();
  let favoriteLines = 0;
  let latestLineAt: string | null = null;

  for (const q of quotes) {
    const sType = q.source_id
      ? sourceById.get(q.source_id)?.type
      : undefined;
    if (q.source_id) {
      if (sType) linesByType[sType] = (linesByType[sType] ?? 0) + 1;
      linesBySourceId.set(
        q.source_id,
        (linesBySourceId.get(q.source_id) ?? 0) + 1,
      );
    }
    if (q.is_favorite) favoriteLines += 1;
    if (q.created_at) {
      if (!latestLineAt || q.created_at > latestLineAt)
        latestLineAt = q.created_at;
      const day = q.created_at.slice(0, 10);
      activityByDay.set(day, (activityByDay.get(day) ?? 0) + 1);
    }
    for (const tag of q.mood_tags) {
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

  const tagsByType = {} as Record<
    SourceType,
    { tag: string; count: number }[]
  >;
  for (const [type, bucket] of tagCountsByType.entries()) {
    tagsByType[type] = [...bucket.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  const genreCountsByType = new Map<
    SourceType,
    Map<string, { sources: number; lines: number }>
  >();
  for (const cat of ROOM_CATEGORIES)
    genreCountsByType.set(cat.type, new Map());
  for (const s of sources) {
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
      source: sourceById.get(sourceId)!,
      lines,
    }))
    .filter((x) => !!x.source)
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 5);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const activity: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const iso = d.toISOString().slice(0, 10);
    activity.push({ date: iso, count: activityByDay.get(iso) ?? 0 });
  }

  const notesByType = {} as Record<SourceType, number>;
  for (const cat of ROOM_CATEGORIES) notesByType[cat.type] = 0;

  return {
    totalLines: quotes.length,
    totalSources: sources.length,
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
    notes: {
      total: 0,
      avgWords: 0,
      longest: 0,
      byType: notesByType,
      byKind: [],
    },
  };
}

// ─────────────────────────────────────────────────────────────────────
// Year in Review
// ─────────────────────────────────────────────────────────────────────

export interface YearInReview {
  year: number;
  totalLines: number;
  totalSources: number;
  totalNotes: number;
  favoriteCount: number;
  byType: Record<SourceType, number>;
  byMonth: { month: number; count: number }[];
  busiestMonth: { month: number; count: number } | null;
  topSources: { source: Source; lines: number }[];
  topTags: { tag: string; count: number }[];
  topGenres: { genre: string; count: number }[];
  topPeople: { name: string; lines: number }[];
  firstLine: { quote: Quote; source: Source | null } | null;
  latestLine: { quote: Quote; source: Source | null } | null;
  favorites: { quote: Quote; source: Source | null }[];
}

export async function getYearInReview(year: number): Promise<YearInReview> {
  const { sources, quotes, sourceById } = await getData();
  const start = `${year}-01-01`;
  const end = `${year + 1}-01-01`;

  const yearQuotes = quotes.filter(
    (q) => q.created_at >= start && q.created_at < end,
  );
  const yearSources = sources.filter(
    (s) => s.created_at >= start && s.created_at < end,
  );

  const byType = {} as Record<SourceType, number>;
  for (const cat of ROOM_CATEGORIES) byType[cat.type] = 0;
  const byMonthMap = new Map<number, number>();
  const linesBySource = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  const genreCounts = new Map<string, number>();
  const peopleCounts = new Map<string, number>();
  let favoriteCount = 0;

  for (const q of yearQuotes) {
    if (q.is_favorite) favoriteCount += 1;
    const m = new Date(q.created_at).getMonth() + 1;
    byMonthMap.set(m, (byMonthMap.get(m) ?? 0) + 1);
    const s = q.source_id ? sourceById.get(q.source_id) : null;
    if (s) {
      byType[s.type] = (byType[s.type] ?? 0) + 1;
      linesBySource.set(s.id, (linesBySource.get(s.id) ?? 0) + 1);
      const g = (s.genre ?? "").trim();
      if (g) genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
      const creator = (s.creator ?? "").trim();
      if (creator && s.type !== "movie") {
        peopleCounts.set(creator, (peopleCounts.get(creator) ?? 0) + 1);
      }
    }
    for (const t of q.mood_tags) {
      if (t.trim()) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }
  }

  const byMonth: { month: number; count: number }[] = [];
  for (let i = 1; i <= 12; i++)
    byMonth.push({ month: i, count: byMonthMap.get(i) ?? 0 });
  const busiestMonth = byMonth.reduce<{
    month: number;
    count: number;
  } | null>(
    (best, cur) =>
      cur.count > 0 && (!best || cur.count > best.count) ? cur : best,
    null,
  );

  const topSources = [...linesBySource.entries()]
    .map(([id, lines]) => ({ source: sourceById.get(id)!, lines }))
    .filter((x) => !!x.source)
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 5);

  const topTags = [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topGenres = [...genreCounts.entries()]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const topPeople = [...peopleCounts.entries()]
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 8);

  const sorted = [...yearQuotes].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
  const firstQ = sorted[0] ?? null;
  const lastQ = sorted[sorted.length - 1] ?? null;
  const firstLine = firstQ
    ? {
        quote: firstQ,
        source: firstQ.source_id
          ? sourceById.get(firstQ.source_id) ?? null
          : null,
      }
    : null;
  const latestLine = lastQ
    ? {
        quote: lastQ,
        source: lastQ.source_id
          ? sourceById.get(lastQ.source_id) ?? null
          : null,
      }
    : null;

  const favList = yearQuotes
    .filter((q) => q.is_favorite)
    .sort((a, b) => a.id.localeCompare(b.id));
  const favorites = favList.slice(0, 5).map((q) => ({
    quote: q,
    source: q.source_id ? sourceById.get(q.source_id) ?? null : null,
  }));

  return {
    year,
    totalLines: yearQuotes.length,
    totalSources: yearSources.length,
    totalNotes: 0,
    favoriteCount,
    byType,
    byMonth,
    busiestMonth,
    topSources,
    topTags,
    topGenres,
    topPeople,
    firstLine,
    latestLine,
    favorites,
  };
}

export async function getCollectedYears(): Promise<number[]> {
  const { quotes } = await getData();
  const years = new Set<number>();
  for (const q of quotes) {
    years.add(new Date(q.created_at).getFullYear());
  }
  return [...years].sort((a, b) => b - a);
}

// ─────────────────────────────────────────────────────────────────────
// Home panels
// ─────────────────────────────────────────────────────────────────────

export interface PastLine {
  id: string;
  text: string;
  page: string | null;
  is_favorite: boolean;
  created_at: string;
  source_id: string | null;
  source_title: string | null;
  source_creator: string | null;
  source_type: SourceType | null;
}

function toPastLine(q: Quote, sourceById: Map<string, Source>): PastLine {
  const src = q.source_id ? sourceById.get(q.source_id) : undefined;
  return {
    id: q.id,
    text: q.text,
    page: q.page ?? null,
    is_favorite: q.is_favorite,
    created_at: q.created_at,
    source_id: q.source_id,
    source_title: src?.title ?? null,
    source_creator: src?.creator ?? null,
    source_type: src?.type ?? null,
  };
}

export async function getOnThisDay(): Promise<PastLine[]> {
  const { quotes, sourceById } = await getData();
  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  return quotes
    .filter((q) => {
      const d = new Date(q.created_at);
      if (
        String(d.getMonth() + 1).padStart(2, "0") !== mm ||
        String(d.getDate()).padStart(2, "0") !== dd
      )
        return false;
      return d.getFullYear() !== today.getFullYear();
    })
    .map((q) => toPastLine(q, sourceById));
}

export async function getRediscoveredFavorite(): Promise<PastLine | null> {
  const { quotes, sourceById } = await getData();
  const favorites = quotes.filter((q) => q.is_favorite);
  if (favorites.length === 0) return null;
  const thirtyDaysAgo = Date.now() - 30 * 86_400_000;
  const stale = favorites.filter(
    (q) => new Date(q.created_at).getTime() < thirtyDaysAgo,
  );
  const pool = stale.length > 0 ? stale : favorites;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return toPastLine(pick, sourceById);
}

// ─────────────────────────────────────────────────────────────────────
// Reading pulse
// ─────────────────────────────────────────────────────────────────────

export interface ReadingPulseItem {
  source: Source;
  lines: number;
  started_at: string | null;
}

export async function getReadingPulse(): Promise<ReadingPulseItem[]> {
  const { sources, quotes, collectionNotes } = await getData();

  const readingNotes = collectionNotes.filter((n) => n.status === "reading");
  if (readingNotes.length === 0) return [];

  const readingSourceIds = new Set(readingNotes.map((n) => n.source_id));
  const linesBySource = new Map<string, number>();
  for (const q of quotes) {
    if (q.source_id && readingSourceIds.has(q.source_id)) {
      linesBySource.set(
        q.source_id,
        (linesBySource.get(q.source_id) ?? 0) + 1,
      );
    }
  }

  const sourceMap = new Map(sources.map((s) => [s.id, s]));
  return readingNotes
    .map((n) => ({
      source: sourceMap.get(n.source_id)!,
      lines: linesBySource.get(n.source_id) ?? 0,
      started_at: n.started_at ?? null,
    }))
    .filter((x) => !!x.source)
    .sort((a, b) => {
      const av = a.started_at ?? "";
      const bv = b.started_at ?? "";
      return bv.localeCompare(av);
    });
}

// ─────────────────────────────────────────────────────────────────────
// Quotes by IDs
// ─────────────────────────────────────────────────────────────────────

export async function getQuotesWithSourceByIds(
  ids: string[],
): Promise<Map<string, { quote: Quote; source: Source | null }>> {
  if (ids.length === 0) return new Map();
  const { quotes, sourceById } = await getData();
  const idSet = new Set(ids);
  const map = new Map<string, { quote: Quote; source: Source | null }>();
  for (const q of quotes) {
    if (idSet.has(q.id)) {
      map.set(q.id, {
        quote: q,
        source: q.source_id ? sourceById.get(q.source_id) ?? null : null,
      });
    }
  }
  return map;
}

// ─────────────────────────────────────────────────────────────────────
// People
// ─────────────────────────────────────────────────────────────────────

const PEOPLE_EXCLUDED_TYPES = new Set<SourceType>(["movie"]);

export interface CreatorSummary {
  name: string;
  sources: number;
  lines: number;
  types: SourceType[];
}

export async function getAllCreators(): Promise<CreatorSummary[]> {
  const { sources, quotes } = await getData();
  const linesBySource = new Map<string, number>();
  for (const q of quotes) {
    if (q.source_id)
      linesBySource.set(
        q.source_id,
        (linesBySource.get(q.source_id) ?? 0) + 1,
      );
  }

  const byName = new Map<
    string,
    { sources: number; lines: number; types: Set<SourceType> }
  >();
  for (const s of sources) {
    if (PEOPLE_EXCLUDED_TYPES.has(s.type)) continue;
    const name = (s.creator ?? "").trim();
    if (!name) continue;
    const entry = byName.get(name) ?? {
      sources: 0,
      lines: 0,
      types: new Set<SourceType>(),
    };
    entry.sources += 1;
    entry.lines += linesBySource.get(s.id) ?? 0;
    entry.types.add(s.type);
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
  const { sources, quotes } = await getData();
  const personSources = sources.filter((s) => s.creator === name);
  if (personSources.length === 0) return null;

  const sourceIds = new Set(personSources.map((s) => s.id));
  const sourceMap = new Map(personSources.map((s) => [s.id, s]));
  const personQuotes = quotes.filter(
    (q) => q.source_id && sourceIds.has(q.source_id),
  );

  const recentQuotes = personQuotes.slice(0, 40).map((q) => ({
    quote: q,
    source: sourceMap.get(q.source_id!)!,
  }));

  return {
    name,
    sources: personSources,
    lines: personQuotes.length,
    notesCount: 0,
    recentQuotes,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Notes (no standalone notes in Notion — return empty)
// ─────────────────────────────────────────────────────────────────────

export async function getNotesBySource(_sourceId: string): Promise<Note[]> {
  return [];
}

export async function getNoteById(_id: string): Promise<Note | null> {
  return null;
}

export interface NoteWithSource {
  note: Note;
  source: Source | null;
}

export async function getAllNotesWithSource(): Promise<NoteWithSource[]> {
  return [];
}

// ─────────────────────────────────────────────────────────────────────
// Writes (disabled — read-only Notion viewer)
// ─────────────────────────────────────────────────────────────────────

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

export async function createSource(_input: CreateSourceInput): Promise<Source> {
  throw new Error("Write operations are not available (Notion read-only mode)");
}

export interface CreateQuoteInput {
  source_id: string;
  text: string;
  page?: string;
  note?: string;
  mood_tags?: string[];
  is_favorite?: boolean;
}

export async function createQuote(_input: CreateQuoteInput): Promise<Quote> {
  throw new Error("Write operations are not available (Notion read-only mode)");
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
  _sourceId: string,
  _fields: CollectionNoteFields,
): Promise<void> {
  throw new Error("Write operations are not available (Notion read-only mode)");
}

export interface CreateNoteInput {
  source_id: string | null;
  kind?: string | null;
  title?: string | null;
  body: string;
}

export async function createNote(_input: CreateNoteInput): Promise<Note> {
  throw new Error("Write operations are not available (Notion read-only mode)");
}

export interface UpdateNoteInput {
  kind?: string | null;
  title?: string | null;
  body?: string;
}

export async function updateNote(
  _id: string,
  _fields: UpdateNoteInput,
): Promise<void> {
  throw new Error("Write operations are not available (Notion read-only mode)");
}

export async function deleteNote(_id: string): Promise<void> {
  throw new Error("Write operations are not available (Notion read-only mode)");
}

// ─────────────────────────────────────────────────────────────────────
// API tokens (static — no Supabase auth)
// ─────────────────────────────────────────────────────────────────────

export async function getOrCreateApiToken(): Promise<string> {
  return process.env.QUICK_ADD_TOKEN ?? "no-token";
}

export async function regenerateApiToken(): Promise<string> {
  throw new Error("Token management is not available (Notion read-only mode)");
}
