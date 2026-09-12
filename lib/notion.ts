import { Client } from "@notionhq/client";
import { createHash } from "crypto";
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

function fileUrl(p: Props, k: string): string | null {
  const v = p[k];
  if (!v || v.type !== "files" || v.files.length === 0) return null;
  const f = v.files[0];
  if (f.type === "external") return f.external.url;
  if (f.type === "file") return f.file.url;
  return null;
}

// ─── Type mapping ────────────────────────────────────────────────────

const TYPE_MAP: Record<string, SourceType> = {
  책: "book",
  영화: "movie",
  드라마: "movie",
  뉴스레터: "article",
  기사글: "article",
  가사: "lyrics",
  인용: "other",
  시: "other",
  명언: "other",
  만화웹툰: "other",
  디자인: "other",
  강의: "other",
};

function toSourceType(v: string | null): SourceType {
  return (v && TYPE_MAP[v]) ?? "other";
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
      created_at: pg.created_time,
      updated_at: pg.last_edited_time,
    };
    sources.push(src);
    sourceById.set(pg.id, src);

    const summary = richText(p, "한줄요약");
    const memo = richText(p, "메모");
    const rating = toRating(sel(p, "평점"));
    const status = toReadingStatus(p);
    if (summary || memo || rating !== undefined || status) {
      collectionNotes.push({
        id: `cn-${pg.id}`,
        user_id: "owner",
        source_id: pg.id,
        summary: summary || undefined,
        personal_note: memo || undefined,
        keywords: [],
        status,
        rating,
        created_at: pg.created_time,
        updated_at: pg.last_edited_time,
      });
    }
  }

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
const TTL = 5 * 60_000;

export async function getData(): Promise<AllData> {
  if (_cache && Date.now() < _cache.exp) return _cache.data;
  const data = await load();
  _cache = { data, exp: Date.now() + TTL };
  return data;
}

export function invalidateNotionCache() {
  _cache = null;
}
