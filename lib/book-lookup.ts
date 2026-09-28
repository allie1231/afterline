// Book metadata lookup: ISBN, page count and physical size.
//
// 국립중앙도서관 서지정보 API (seoji) is the primary source — it carries PAGE
// and BOOK_SIZE for Korean publishing. Aladin stays as a secondary source only
// while ALADIN_TTB_KEY is set; drop the key and that step disappears. Google
// Books and Open Library return nothing for Korean ISBNs, so they only run for
// titles without Hangul.

const SEOJI_BASE = "https://seoji.nl.go.kr/landingPage/SearchApi.do";
const ALADIN_BASE = "https://www.aladin.co.kr/ttb/api";

export interface BookDetail {
  isbn13?: string;
  pageCount?: number;
  sizeHeight?: number;
  sizeWidth?: number;
}

export interface EnrichResult {
  detail: BookDetail | null;
  rateLimited: boolean;
}

const HANGUL = /[가-힣]/;

// Shared pacing for both Korean APIs: request starts are spaced globally so
// concurrent callers cannot burst past a provider's limit.
const MIN_REQUEST_GAP_MS = 80;
const MAX_RETRIES = 3;

let nextSlot = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function takeSlot(): Promise<void> {
  const now = Date.now();
  const slot = Math.max(now, nextSlot);
  nextSlot = slot + MIN_REQUEST_GAP_MS;
  if (slot > now) await sleep(slot - now);
}

class RateLimitError extends Error {}

async function getJson(url: string): Promise<unknown | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await takeSlot();
    try {
      const r = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (r.status === 429) {
        nextSlot = Math.max(nextSlot, Date.now() + 1000 * 2 ** attempt);
        continue;
      }
      if (!r.ok) return null;
      const text = (await r.text()).trim();
      if (!text.startsWith("{")) return null;
      return JSON.parse(text);
    } catch {
      if (attempt === MAX_RETRIES) return null;
    }
  }
  throw new RateLimitError(url);
}

function merge(a: BookDetail | null, b: BookDetail | null): BookDetail | null {
  if (!a) return b;
  if (!b) return a;
  return {
    isbn13: a.isbn13 || b.isbn13,
    pageCount: a.pageCount || b.pageCount,
    sizeHeight: a.sizeHeight || b.sizeHeight,
    sizeWidth: a.sizeWidth || b.sizeWidth,
  };
}

function isComplete(d: BookDetail | null): boolean {
  return !!d && !!d.isbn13 && !!d.pageCount && !!d.sizeHeight && !!d.sizeWidth;
}

// ─── 국립중앙도서관 서지정보 ─────────────────────────────────────────

interface SeojiDoc {
  TITLE?: string;
  AUTHOR?: string;
  EA_ISBN?: string;
  RELATED_ISBN?: string;
  PAGE?: string;
  BOOK_SIZE?: string;
  FORM?: string;
}

async function seojiSearch(params: Record<string, string>): Promise<SeojiDoc[]> {
  const key = process.env.NL_CERT_KEY;
  if (!key) return [];
  const url =
    `${SEOJI_BASE}?` +
    new URLSearchParams({
      cert_key: key,
      result_style: "json",
      page_no: "1",
      page_size: "20",
      ...params,
    }).toString();
  const data = (await getJson(url)) as { docs?: SeojiDoc[] } | null;
  return data?.docs ?? [];
}

// "206 p." → 206
function parsePage(raw: string | undefined): number | undefined {
  const m = String(raw ?? "").match(/(\d+)/);
  return m ? Number(m[1]) : undefined;
}

// "130*200" is width * height in millimetres.
function parseSize(raw: string | undefined): Pick<BookDetail, "sizeHeight" | "sizeWidth"> {
  const m = String(raw ?? "").match(/(\d+)\s*\*\s*(\d+)/);
  if (!m) return {};
  return { sizeWidth: Number(m[1]), sizeHeight: Number(m[2]) };
}

function detailFromDoc(doc: SeojiDoc): BookDetail {
  return {
    isbn13: doc.EA_ISBN || undefined,
    pageCount: parsePage(doc.PAGE),
    ...parseSize(doc.BOOK_SIZE),
  };
}

function relatedIsbns(doc: SeojiDoc): string[] {
  return String(doc.RELATED_ISBN ?? "")
    .split(/[,;\s]+/)
    .filter(Boolean);
}

// NL prefixes subtitles in parentheses and appends them after a colon, so both
// have to go before titles can be compared.
function coreTitle(raw: string): string {
  return raw
    .replace(/[(（[{][^)）\]}]*[)）\]}]/g, " ")
    .replace(/\s*[:：]\s*.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitle(raw: string): string {
  return coreTitle(raw)
    .toLowerCase()
    .replace(/[\s　'"’'`·・,.\-—~!?]/g, "");
}

function authorMatches(docAuthor: string | undefined, creator?: string): boolean {
  if (!creator) return true;
  const haystack = String(docAuthor ?? "").replace(/\s/g, "");
  return creator
    .split(/[,;·]/)
    .map((s) => s.trim().replace(/\s/g, ""))
    .filter((s) => s.length >= 2)
    .some((name) => haystack.includes(name));
}

// An ebook record carries no page count and no size; RELATED_ISBN points at the
// print edition, which does.
async function seojiByIsbn(isbn: string, depth = 0): Promise<BookDetail | null> {
  const doc = (await seojiSearch({ isbn }))[0];
  if (!doc) return null;

  const detail = detailFromDoc(doc);
  if (isComplete(detail) || depth > 0) return detail;

  for (const related of relatedIsbns(doc).slice(0, 3)) {
    const alt = await seojiByIsbn(related, depth + 1);
    if (isComplete(alt)) return merge(detail, alt);
  }
  return detail;
}

// Large-print editions are catalogued alongside the trade edition and are much
// taller; prefer the smaller one when both match.
function pickEdition(docs: SeojiDoc[]): SeojiDoc {
  return [...docs].sort(
    (a, b) => (parseSize(a.BOOK_SIZE).sizeHeight ?? 0) - (parseSize(b.BOOK_SIZE).sizeHeight ?? 0),
  )[0];
}

async function seojiByTitle(
  title: string,
  creator?: string,
): Promise<BookDetail | null> {
  const want = normalizeTitle(title);
  if (want.length < 2) return null;

  const attempts: Array<Record<string, string>> = creator
    ? [{ title, author: creator }, { title }]
    : [{ title }];

  for (const params of attempts) {
    const docs = await seojiSearch(params);
    // Titles must match exactly once normalized — a looser test matches
    // different books ("천국보다 낯선" vs "천국보다 낯선 프랑스").
    const candidates = docs.filter(
      (d) => normalizeTitle(d.TITLE ?? "") === want && authorMatches(d.AUTHOR, creator),
    );

    const printed = candidates.filter((d) => d.FORM === "종이책" && d.BOOK_SIZE && d.PAGE);
    if (printed.length) return detailFromDoc(pickEdition(printed));

    for (const doc of candidates.slice(0, 3)) {
      for (const related of relatedIsbns(doc).slice(0, 2)) {
        const alt = await seojiByIsbn(related, 1);
        if (isComplete(alt)) return alt;
      }
    }
  }
  return null;
}

// ─── Aladin (secondary; only while ALADIN_TTB_KEY is set) ───────────

interface AladinItem {
  isbn13?: string;
  subInfo?: {
    itemPage?: number;
    packing?: { sizeHeight?: number; sizeWidth?: number };
    paperBookList?: Array<{ isbn13?: string }>;
  };
}

async function aladinLookup(
  key: string,
  itemId: string,
  idType: "ISBN13" | "ISBN",
  depth = 0,
): Promise<BookDetail | null> {
  const url =
    `${ALADIN_BASE}/ItemLookUp.aspx?` +
    new URLSearchParams({
      ttbkey: key,
      itemIdType: idType,
      ItemId: itemId,
      output: "js",
      Version: "20131101",
      OptResult: "packing",
    }).toString();

  const data = (await getJson(url)) as { item?: AladinItem[] } | null;
  const item = data?.item?.[0];
  if (!item) return null;

  const packing = item.subInfo?.packing;
  const detail: BookDetail = {
    isbn13: item.isbn13 || undefined,
    pageCount: item.subInfo?.itemPage || undefined,
    sizeHeight: packing?.sizeHeight || undefined,
    sizeWidth: packing?.sizeWidth || undefined,
  };
  if (isComplete(detail) || depth > 0) return detail;

  const paperIsbn = item.subInfo?.paperBookList?.[0]?.isbn13;
  if (paperIsbn && paperIsbn !== item.isbn13) {
    return merge(detail, await aladinLookup(key, paperIsbn, "ISBN13", depth + 1));
  }
  return detail;
}

// ─── Non-Korean fallbacks ───────────────────────────────────────────

function parseCmToMm(dim: string | undefined): number | undefined {
  if (!dim) return undefined;
  const cm = dim.match(/([\d.]+)\s*cm/i);
  if (cm) return Math.round(parseFloat(cm[1]) * 10);
  const mm = dim.match(/([\d.]+)\s*mm/i);
  if (mm) return Math.round(parseFloat(mm[1]));
  const inch = dim.match(/([\d.]+)\s*(?:in|inches)/i);
  if (inch) return Math.round(parseFloat(inch[1]) * 25.4);
  return undefined;
}

async function googleBooksLookup(
  isbn?: string,
  title?: string,
  creator?: string,
): Promise<BookDetail | null> {
  const queries: string[] = [];
  if (isbn) queries.push(`isbn:${isbn}`);
  if (title && creator) queries.push(`intitle:${title} inauthor:${creator}`);
  if (title) queries.push(title);

  for (const q of queries) {
    const data = (await getJson(
      `https://www.googleapis.com/books/v1/volumes?` +
        new URLSearchParams({ q, maxResults: "3" }).toString(),
    )) as { items?: Array<{ volumeInfo?: Record<string, unknown> }> } | null;

    for (const entry of data?.items ?? []) {
      const vol = entry.volumeInfo ?? {};
      const ids = vol.industryIdentifiers as
        | Array<{ type: string; identifier: string }>
        | undefined;
      const dims = vol.dimensions as { height?: string; width?: string } | undefined;
      const detail: BookDetail = {
        isbn13: ids?.find((i) => i.type === "ISBN_13")?.identifier || undefined,
        pageCount: (vol.pageCount as number) || undefined,
        sizeHeight: parseCmToMm(dims?.height),
        sizeWidth: parseCmToMm(dims?.width),
      };
      if (detail.isbn13 || detail.pageCount) return detail;
    }
  }
  return null;
}

async function openLibraryLookup(isbn?: string): Promise<BookDetail | null> {
  if (!isbn) return null;
  const data = (await getJson(`https://openlibrary.org/isbn/${isbn}.json`)) as Record<
    string,
    unknown
  > | null;
  if (!data) return null;

  let sizeHeight: number | undefined;
  let sizeWidth: number | undefined;
  const parts = (data.physical_dimensions as string | undefined)?.match(
    /([\d.]+)\s*x\s*([\d.]+)(?:\s*x\s*[\d.]+)?\s*(centimeters|inches)/i,
  );
  if (parts) {
    const factor = parts[3].toLowerCase() === "centimeters" ? 10 : 25.4;
    const a = parseFloat(parts[1]);
    const b = parseFloat(parts[2]);
    sizeHeight = Math.round(Math.max(a, b) * factor);
    sizeWidth = Math.round(Math.min(a, b) * factor);
  }

  return {
    isbn13: (data.isbn_13 as string[] | undefined)?.[0] || undefined,
    pageCount: (data.number_of_pages as number) || undefined,
    sizeHeight,
    sizeWidth,
  };
}

// ─── Combined lookup ────────────────────────────────────────────────

const detailCache = new Map<string, BookDetail | null>();

export async function enrichBookDetail(
  isbn?: string,
  title?: string,
  creator?: string,
): Promise<EnrichResult> {
  const cacheKey = isbn || title || "";
  if (!cacheKey) return { detail: null, rateLimited: false };
  if (detailCache.has(cacheKey)) {
    return { detail: detailCache.get(cacheKey)!, rateLimited: false };
  }

  try {
    const detail = await lookupBookDetail(isbn, title, creator);
    detailCache.set(cacheKey, detail);
    return { detail, rateLimited: false };
  } catch (e) {
    if (e instanceof RateLimitError) return { detail: null, rateLimited: true };
    throw e;
  }
}

async function lookupBookDetail(
  isbn?: string,
  title?: string,
  creator?: string,
): Promise<BookDetail | null> {
  const primaryCreator = creator?.split(/[,;]/)[0]?.trim() || undefined;
  let detail: BookDetail | null = null;

  if (isbn && isbn.length >= 10) {
    detail = await seojiByIsbn(isbn);
    if (isComplete(detail)) return detail;
  }
  if (title) {
    detail = merge(detail, await seojiByTitle(title, primaryCreator));
    if (isComplete(detail)) return detail;
  }

  const aladinKey = process.env.ALADIN_TTB_KEY;
  if (aladinKey && isbn && isbn.length >= 10) {
    detail = merge(
      detail,
      await aladinLookup(aladinKey, isbn, isbn.length === 13 ? "ISBN13" : "ISBN"),
    );
    if (isComplete(detail)) return detail;
  }

  if (!HANGUL.test(title ?? "") && !HANGUL.test(creator ?? "")) {
    detail = merge(detail, await googleBooksLookup(detail?.isbn13 || isbn, title, creator));
    if (isComplete(detail)) return detail;
    detail = merge(detail, await openLibraryLookup(detail?.isbn13 || isbn));
  }

  return detail;
}
