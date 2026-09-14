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

interface AladinItem {
  title?: string;
  isbn13?: string;
  mallType?: string;
  subInfo?: {
    itemPage?: number;
    packing?: { sizeHeight?: number; sizeWidth?: number };
    paperBookList?: Array<{ isbn13?: string }>;
  };
}

const HANGUL = /[가-힣]/;

// Aladin rejects bursts above roughly 5 requests/second with HTTP 429 and an
// empty body, which is indistinguishable from a miss unless it is handled
// explicitly. Request starts are spaced out globally so concurrent callers
// share one budget.
const MIN_REQUEST_GAP_MS = 120;
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

async function fetchAladin(
  endpoint: string,
  params: Record<string, string>,
): Promise<unknown | null> {
  const url = `${ALADIN_BASE}/${endpoint}?` + new URLSearchParams(params).toString();

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await takeSlot();
    try {
      const r = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(7000),
      });

      if (r.status === 429) {
        const backoff = 1000 * 2 ** attempt;
        nextSlot = Math.max(nextSlot, Date.now() + backoff);
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

  throw new RateLimitError(endpoint);
}

async function lookupItem(
  key: string,
  itemId: string,
  idType: "ISBN13" | "ISBN",
): Promise<AladinItem | null> {
  const data = (await fetchAladin("ItemLookUp.aspx", {
    ttbkey: key,
    itemIdType: idType,
    ItemId: itemId,
    output: "js",
    Version: "20131101",
    OptResult: "packing",
  })) as { item?: AladinItem[] } | null;
  return data?.item?.[0] ?? null;
}

function detailFromItem(item: AladinItem): BookDetail {
  const packing = item.subInfo?.packing;
  return {
    isbn13: item.isbn13 || undefined,
    pageCount: item.subInfo?.itemPage || undefined,
    sizeHeight: packing?.sizeHeight || undefined,
    sizeWidth: packing?.sizeWidth || undefined,
  };
}

function isComplete(d: BookDetail | null): boolean {
  return !!d && !!d.isbn13 && !!d.pageCount && !!d.sizeHeight && !!d.sizeWidth;
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

// An ebook entry carries no dimensions and no page count. Aladin links it to
// its print edition through paperBookList, which is where packing data lives.
async function resolveWithPaperEdition(
  key: string,
  item: AladinItem,
): Promise<BookDetail> {
  const detail = detailFromItem(item);
  if (isComplete(detail)) return detail;

  const paperIsbn = item.subInfo?.paperBookList?.[0]?.isbn13;
  if (!paperIsbn || paperIsbn === item.isbn13) return detail;

  const paperItem = await lookupItem(key, paperIsbn, "ISBN13");
  if (!paperItem) return detail;

  return merge(detail, detailFromItem(paperItem))!;
}

function cleanTitle(title: string): string {
  return title
    .replace(/[“”‘’"']/g, " ")
    .replace(/\s*[[(（【].*?[\])）】]\s*/g, " ")
    .replace(/\s*[:：]\s*.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function searchItems(
  key: string,
  query: string,
  queryType: "Keyword" | "Title",
): Promise<AladinItem[]> {
  const data = (await fetchAladin("ItemSearch.aspx", {
    ttbkey: key,
    Query: query,
    QueryType: queryType,
    MaxResults: "5",
    start: "1",
    SearchTarget: "Book",
    output: "js",
    Version: "20131101",
  })) as { item?: AladinItem[] } | null;
  return data?.item ?? [];
}

const MAX_CANDIDATES = 4;

// Search responses never carry packing data, so each candidate needs a full
// lookup before we can tell whether it has dimensions.
async function searchByTitle(
  key: string,
  title: string,
  creator?: string,
): Promise<BookDetail | null> {
  const cleaned = cleanTitle(title);
  const attempts: Array<[string, "Keyword" | "Title"]> = [];
  if (creator) attempts.push([`${title} ${creator}`, "Keyword"]);
  attempts.push([title, "Title"]);
  if (cleaned !== title && cleaned.length >= 2) {
    if (creator) attempts.push([`${cleaned} ${creator}`, "Keyword"]);
    attempts.push([cleaned, "Title"]);
  }

  let best: BookDetail | null = null;
  let examined = 0;

  for (const [query, queryType] of attempts) {
    const items = await searchItems(key, query, queryType);
    for (const item of items) {
      if (!item.isbn13) continue;
      if (examined >= MAX_CANDIDATES) return best;
      examined++;

      const full = await lookupItem(key, item.isbn13, "ISBN13");
      if (!full) continue;
      const detail = await resolveWithPaperEdition(key, full);
      if (isComplete(detail)) return detail;
      best = merge(best, detail);
    }
  }

  return best;
}

// ─── Non-Korean fallbacks ───────────────────────────────────────────
// Google Books and Open Library return nothing for Korean ISBNs, so they only
// run for titles without Hangul.

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
    try {
      const url =
        `https://www.googleapis.com/books/v1/volumes?` +
        new URLSearchParams({ q, maxResults: "3" }).toString();
      const r = await fetch(url, { signal: AbortSignal.timeout(7000) });
      if (!r.ok) continue;
      const data = await r.json();
      for (const entry of data.items ?? []) {
        const vol = entry.volumeInfo ?? {};
        const ids = vol.industryIdentifiers as
          | Array<{ type: string; identifier: string }>
          | undefined;
        const dims = vol.dimensions as { height?: string; width?: string } | undefined;
        const detail: BookDetail = {
          isbn13: ids?.find((i) => i.type === "ISBN_13")?.identifier || undefined,
          pageCount: vol.pageCount || undefined,
          sizeHeight: parseCmToMm(dims?.height),
          sizeWidth: parseCmToMm(dims?.width),
        };
        if (detail.isbn13 || detail.pageCount) return detail;
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function openLibraryLookup(isbn?: string): Promise<BookDetail | null> {
  if (!isbn) return null;
  try {
    const r = await fetch(`https://openlibrary.org/isbn/${isbn}.json`, {
      signal: AbortSignal.timeout(7000),
    });
    if (!r.ok) return null;
    const data = await r.json();

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
  } catch {
    return null;
  }
}

// ─── Combined enrichment ────────────────────────────────────────────

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
  let detail: BookDetail | null = null;

  const aladinKey = process.env.ALADIN_TTB_KEY;
  if (aladinKey) {
    if (isbn && isbn.length >= 10) {
      const item = await lookupItem(
        aladinKey,
        isbn,
        isbn.length === 13 ? "ISBN13" : "ISBN",
      );
      if (item) detail = await resolveWithPaperEdition(aladinKey, item);
      if (isComplete(detail)) return detail;
    }

    if (title) {
      detail = merge(detail, await searchByTitle(aladinKey, title, creator));
      if (isComplete(detail)) return detail;
    }
  }

  if (!HANGUL.test(title ?? "") && !HANGUL.test(creator ?? "")) {
    detail = merge(detail, await googleBooksLookup(detail?.isbn13 || isbn, title, creator));
    if (isComplete(detail)) return detail;
    detail = merge(detail, await openLibraryLookup(detail?.isbn13 || isbn));
  }

  return detail;
}
