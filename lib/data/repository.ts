// 데이터 접근 레이어.
// 지금은 in-memory mock 을 반환하지만, 뒤에서 Supabase 로 교체할 때
// 이 함수들의 시그니처만 유지하면 화면 코드는 한 줄도 바꾸지 않아도 된다.

import {
  MOCK_COLLECTION_NOTES,
  MOCK_QUOTES,
  MOCK_SOURCES,
  ROOM_CATEGORIES,
} from "./mock";
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
  return MOCK_SOURCES.filter((s) => s.type === type);
}

export async function getAllSources(): Promise<Source[]> {
  return MOCK_SOURCES;
}

export async function getSourceById(id: string): Promise<Source | null> {
  return MOCK_SOURCES.find((s) => s.id === id) ?? null;
}

export async function getQuotesBySource(sourceId: string): Promise<Quote[]> {
  return MOCK_QUOTES.filter((q) => q.source_id === sourceId);
}

export async function getAllQuotes(): Promise<Quote[]> {
  return MOCK_QUOTES;
}

export async function getCollectionNoteBySource(
  sourceId: string,
): Promise<CollectionNote | null> {
  return MOCK_COLLECTION_NOTES.find((n) => n.source_id === sourceId) ?? null;
}

export async function getAllCollectionNotes(): Promise<CollectionNote[]> {
  return MOCK_COLLECTION_NOTES;
}

export async function countByRoom(): Promise<
  Record<SourceType, { sources: number; lines: number }>
> {
  const result = {} as Record<SourceType, { sources: number; lines: number }>;
  for (const cat of ROOM_CATEGORIES) {
    const sources = MOCK_SOURCES.filter((s) => s.type === cat.type);
    const sourceIds = new Set(sources.map((s) => s.id));
    const lines = MOCK_QUOTES.filter(
      (q) => q.source_id && sourceIds.has(q.source_id),
    ).length;
    result[cat.type] = { sources: sources.length, lines };
  }
  return result;
}

export async function getMoodTagsWithCounts(): Promise<
  { tag: string; count: number }[]
> {
  const counts = new Map<string, number>();
  for (const q of MOCK_QUOTES) {
    for (const tag of q.mood_tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}
