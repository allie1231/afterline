import { Client } from "@notionhq/client";
import { createHash } from "crypto";
import sharp from "sharp";
import type {
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints/common";
import type { QueryDataSourceResponse } from "@notionhq/client/build/src/api-endpoints/data-sources";
import type {
  Source,
  Quote,
  CollectionNote,
  SourceType,
  ReadingStatus,
} from "./data/types";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const QUOTES_DB = process.env.NOTION_QUOTES_DB_ID!;
const SOURCES_DB = process.env.NOTION_SOURCES_DB_ID!;

// ─── Property helpers ────────────────────────────────────────────────

type Props = PageObjectResponse["properties"];

function title(p: Props, k: string): string {
  const v = p[k];
  if (!v || v.type !== "title") return "";
  return v.title.map((t) => t.plain_text).join("");
}

function richText(p: Props, k: string): string {
  const v = p[k];
  if (!v || v.type !== "rich_text") return "";
  return v.rich_text.map((t) => t.plain_text).join("");
}

function sel(p: Props, k: string): string | null {
  const v = p[k];
  if (!v || v.type !== "select" || !v.select) return null;
  return v.select.name;
}

function multiSel(p: Props, k: string): string[] {
  const v = p[k];
  if (!v || v.type !== "multi_select") return [];
  return v.multi_select.map((s) => s.name);
}

function check(p: Props, k: string): boolean {
  const v = p[k];
  if (!v || v.type !== "checkbox") return false;
  return v.checkbox;
}

function relIds(p: Props, k: string): string[] {
  const v = p[k];
  if (!v || v.type !== "relation") return [];
  return v.relation.map((r) => r.id);
}

function num(p: Props, k: string): number | null {
  const v = p[k];
  if (!v || v.type !== "number" || v.number === null) return null;
  return v.number;
}

function fileUrl(p: Props, k: string): string | null {
  const v = p[k];
  if (!v || v.type !== "files" || v.files.length === 0) return null;
  const f = v.files[0];
  if (f.type === "external") return f.external.url;
  if (f.type === "file") return f.file.url;
  return null;
}

function dateStart(p: Props, k: string): string | null {
  const v = p[k];
  if (!v || v.type !== "date" || !v.date) return null;
  return v.date.start;
}

// ─── Type mapping ────────────────────────────────────────────────────

const TYPE_MAP: Record<string, SourceType> = {
  책: "book",
  영화: "movie",
  드라마: "movie",
  뉴스레터: "article",
  "기사/글": "article",
  가사: "lyrics",
  인용: "other",
  시: "other",
  명언: "other",
  "만화/웹툰": "other",
  디자인: "other",
  강의: "other",
};

function toSourceType(v: string | null): SourceType {
  return (v ? TYPE_MAP[v] : undefined) ?? "other";
}

function toRating(v: string | null): number | undefined {
  if (!v) return undefined;
  const stars = (v.match(/[⭐★☆🌟]/g) ?? []).length;
  if (stars > 0) return stars;
  const n = parseFloat(v);
  return isNaN(n) ? undefined : n;
}

function toReadingStatus(p: Props): ReadingStatus | undefined {
  if (check(p, "다 읽은 책")) return "finished";
  if (check(p, "읽고 있는 책")) return "reading";
  if (check(p, "읽고 싶은 책")) return "to_read";
  if (check(p, "보류중인 책")) return "archived";
  return undefined;
}

function virtualId(label: string, kind: string): string {
  const h = createHash("sha256").update(`${kind}:${label}`).digest("hex");
  return [
    h.slice(0, 8),
    "vs00",
    "4000",
    h.slice(8, 12),
    h.slice(12, 24),
  ].join("-");
}

// ─── Cover color extraction ─────────────────────────────────────────

async function extractDominantColor(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const { dominant } = await sharp(buf).resize(64, 64, { fit: "cover" }).stats();
    const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
    return `#${hex(dominant.r)}${hex(dominant.g)}${hex(dominant.b)}`;
  } catch {
    return null;
  }
}

async function extractColorsForSources(sources: Source[]): Promise<void> {
  const targets = sources.filter((s) => s.cover_url && !s.spine_color);
  if (targets.length === 0) return;
  const BATCH = 20;
  for (let i = 0; i < targets.length; i += BATCH) {
    const batch = targets.slice(i, i + BATCH);
    const colors = await Promise.all(
      batch.map((s) => extractDominantColor(s.cover_url!)),
    );
    for (let j = 0; j < batch.length; j++) {
      if (colors[j]) batch[j].spine_color = colors[j];
    }
  }
  await persistToNotion(
    targets.filter((s) => s.spine_color),
    (s) => ({ "책등 색상": richTextProp(s.spine_color!) }),
  );
}

// ─── Persist enrichment to Notion ───────────────────────────────────

async function persistToNotion(
  sources: Source[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  propsFor: (s: Source) => Record<string, any>,
): Promise<void> {
  for (const s of sources) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await notion.pages.update({ page_id: s.id, properties: propsFor(s) as any });
    } catch (e) {
      console.error(`[persistToNotion] failed for ${s.id}:`, e);
    }
  }
}

// ─── Paginated DB fetch ──────────────────────────────────────────────

async function fetchAll(dbId: string): Promise<PageObjectResponse[]> {
  const out: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const r: QueryDataSourceResponse = await notion.dataSources.query({
      data_source_id: dbId,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const p of r.results) {
      if ("properties" in p) out.push(p as PageObjectResponse);
    }
    cursor = r.has_more ? (r.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return out;
}

// ─── Processed data shape ────────────────────────────────────────────

export interface AllData {
  sources: Source[];
  quotes: Quote[];
  collectionNotes: CollectionNote[];
  sourceById: Map<string, Source>;
}

// ─── Load + transform ────────────────────────────────────────────────

async function load(): Promise<AllData> {
  const [shelfPages, linePages] = await Promise.all([
    fetchAll(SOURCES_DB),
    fetchAll(QUOTES_DB),
  ]);

  const sources: Source[] = [];
  const collectionNotes: CollectionNote[] = [];
  const sourceById = new Map<string, Source>();

  for (const pg of shelfPages) {
    const p = pg.properties;
    const src: Source = {
      id: pg.id,
      user_id: "owner",
      type: "book",
      title: title(p, "책 제목"),
      creator: richText(p, "저자") || undefined,
      publisher: richText(p, "출판사") || undefined,
      cover_url: fileUrl(p, "책 표지") || undefined,
      genre: sel(p, "분야"),
      spine_color: richText(p, "책등 색상") || undefined,
      isbn: richText(p, "ISBN") || undefined,
      page_count: num(p, "총 페이지수") ?? undefined,
      book_height_mm: num(p, "책 높이") ?? undefined,
      book_width_mm: num(p, "책 너비") ?? undefined,
      created_at: pg.created_time,
      updated_at: pg.last_edited_time,
    };
    sources.push(src);
    sourceById.set(pg.id, src);

    const summary = richText(p, "한줄요약");
    const memo = richText(p, "메모");
    const rating = toRating(sel(p, "평점"));
    const status = toReadingStatus(p);
    const startedDate = dateStart(p, "읽기 시작한 날");
    const finishedDate = dateStart(p, "완독한 날");
    if (summary || memo || rating !== undefined || status || startedDate || finishedDate) {
      collectionNotes.push({
        id: `cn-${pg.id}`,
        user_id: "owner",
        source_id: pg.id,
        summary: summary || undefined,
        personal_note: memo || undefined,
        keywords: [],
        status,
        rating,
        started_at: startedDate || undefined,
        finished_at: finishedDate || undefined,
        created_at: pg.created_time,
        updated_at: pg.last_edited_time,
      });
    }
  }

  await extractColorsForSources(sources);

  const quotes: Quote[] = [];
  const vSources = new Map<string, Source>();

  for (const pg of linePages) {
    const p = pg.properties;
    const txt = title(p, "수집한 문장");
    if (!txt.trim()) continue;

    const linked = relIds(p, "책장");
    const kind = sel(p, "구분");
    const label = richText(p, "출처");

    let srcId: string | null = null;

    if (linked.length > 0) {
      srcId = linked[0];
    } else if (label) {
      const sType = toSourceType(kind);
      const key = `${sType}:${label}`;
      if (!vSources.has(key)) {
        const vs: Source = {
          id: virtualId(label, kind ?? "other"),
          user_id: "owner",
          type: sType,
          title: label,
          created_at: pg.created_time,
          updated_at: pg.last_edited_time,
        };
        vSources.set(key, vs);
        sources.push(vs);
        sourceById.set(vs.id, vs);
      }
      srcId = vSources.get(key)!.id;
    }

    const why = richText(p, "왜 수집했나요?");
    const extra = richText(p, "추가할 메모가 있나요?");
    const note = [why, extra].filter(Boolean).join("\n") || undefined;

    quotes.push({
      id: pg.id,
      user_id: "owner",
      source_id: srcId,
      text: txt,
      note,
      mood_tags: multiSel(p, "태그"),
      is_favorite: check(p, "새김"),
      visibility: "private",
      created_at: pg.created_time,
      updated_at: pg.last_edited_time,
    });
  }

  quotes.sort((a, b) => b.created_at.localeCompare(a.created_at));
  sources.sort((a, b) => b.created_at.localeCompare(a.created_at));

  return { sources, quotes, collectionNotes, sourceById };
}

// ─── Cache ───────────────────────────────────────────────────────────

let _cache: { data: AllData; exp: number } | null = null;
let _inflight: Promise<AllData> | null = null;
const TTL = 5 * 60_000;

export async function getData(): Promise<AllData> {
  if (_cache && Date.now() < _cache.exp) return _cache.data;
  if (_inflight) return _inflight;
  _inflight = load()
    .then((data) => {
      _cache = { data, exp: Date.now() + TTL };
      _inflight = null;
      return data;
    })
    .catch((err) => {
      _inflight = null;
      throw err;
    });
  return _inflight;
}

export function invalidateNotionCache() {
  _cache = null;
}

// ─── Write helpers ──────────────────────────────────────────────────

function richTextProp(value: string) {
  return { rich_text: [{ text: { content: value } }] };
}

function titleProp(value: string) {
  return { title: [{ text: { content: value } }] };
}

function selectProp(name: string | null) {
  return name ? { select: { name } } : { select: null };
}

function checkboxProp(value: boolean) {
  return { checkbox: value };
}

const STATUS_CHECKBOX_MAP: Record<string, string> = {
  finished: "다 읽은 책",
  reading: "읽고 있는 책",
  to_read: "읽고 싶은 책",
  archived: "보류중인 책",
};

function ratingToSelect(rating: number | null): string | null {
  if (rating === null) return null;
  return "⭐".repeat(Math.max(1, Math.min(5, Math.round(rating))));
}

export async function updateSourceInNotion(
  pageId: string,
  fields: {
    title?: string;
    creator?: string | null;
    publisher?: string | null;
    genre?: string | null;
    cover_url?: string | null;
  },
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: Record<string, any> = {};

  if (fields.title !== undefined) properties["책 제목"] = titleProp(fields.title);
  if (fields.creator !== undefined) properties["저자"] = richTextProp(fields.creator ?? "");
  if (fields.publisher !== undefined) properties["출판사"] = richTextProp(fields.publisher ?? "");
  if (fields.genre !== undefined) properties["분야"] = selectProp(fields.genre ?? null);

  if (Object.keys(properties).length > 0) {
    await notion.pages.update({ page_id: pageId, properties });
  }

  invalidateNotionCache();
}

export async function updateSourceNoteInNotion(
  pageId: string,
  fields: {
    summary?: string;
    personal_note?: string;
    rating?: number | null;
    status?: string | null;
    started_at?: string | null;
    finished_at?: string | null;
  },
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: Record<string, any> = {};

  if (fields.summary !== undefined) properties["한줄요약"] = richTextProp(fields.summary);
  if (fields.personal_note !== undefined) properties["메모"] = richTextProp(fields.personal_note);
  if (fields.rating !== undefined) properties["평점"] = selectProp(ratingToSelect(fields.rating));

  if (fields.status !== undefined) {
    for (const [status, propName] of Object.entries(STATUS_CHECKBOX_MAP)) {
      properties[propName] = checkboxProp(status === fields.status);
    }
  }

  if (fields.started_at !== undefined) {
    properties["읽기 시작한 날"] = fields.started_at
      ? { date: { start: fields.started_at } }
      : { date: null };
  }
  if (fields.finished_at !== undefined) {
    properties["완독한 날"] = fields.finished_at
      ? { date: { start: fields.finished_at } }
      : { date: null };
  }

  if (Object.keys(properties).length > 0) {
    await notion.pages.update({ page_id: pageId, properties });
  }

  invalidateNotionCache();
}

export async function updateQuoteInNotion(
  pageId: string,
  fields: {
    text?: string;
    mood_tags?: string[];
    is_favorite?: boolean;
  },
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: Record<string, any> = {};

  if (fields.text !== undefined) properties["수집한 문장"] = titleProp(fields.text);
  if (fields.mood_tags !== undefined) {
    properties["태그"] = {
      multi_select: fields.mood_tags.map((name) => ({ name })),
    };
  }
  if (fields.is_favorite !== undefined) properties["새김"] = checkboxProp(fields.is_favorite);

  if (Object.keys(properties).length > 0) {
    await notion.pages.update({ page_id: pageId, properties });
  }

  invalidateNotionCache();
}

export async function deletePageInNotion(pageId: string): Promise<void> {
  await notion.pages.update({ page_id: pageId, archived: true });
  invalidateNotionCache();
}

export async function createSourceInNotion(fields: {
  title: string;
  creator?: string;
  publisher?: string;
  genre?: string | null;
  cover_url?: string;
}): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: Record<string, any> = {
    "책 제목": titleProp(fields.title),
  };
  if (fields.creator) properties["저자"] = richTextProp(fields.creator);
  if (fields.publisher) properties["출판사"] = richTextProp(fields.publisher);
  if (fields.genre) properties["분야"] = selectProp(fields.genre);

  const res = await notion.pages.create({
    parent: { database_id: SOURCES_DB },
    properties,
  });
  invalidateNotionCache();
  return res.id;
}

export async function createQuoteInNotion(fields: {
  text: string;
  sourceId?: string | null;
  mood_tags?: string[];
  is_favorite?: boolean;
}): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: Record<string, any> = {
    "수집한 문장": titleProp(fields.text),
  };
  if (fields.sourceId) {
    properties["책장"] = { relation: [{ id: fields.sourceId }] };
  }
  if (fields.mood_tags?.length) {
    properties["태그"] = {
      multi_select: fields.mood_tags.map((name) => ({ name })),
    };
  }
  if (fields.is_favorite) {
    properties["새김"] = checkboxProp(true);
  }

  const res = await notion.pages.create({
    parent: { database_id: QUOTES_DB },
    properties,
  });
  invalidateNotionCache();
  return res.id;
}
