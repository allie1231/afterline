const ALADIN_BASE = "https://www.aladin.co.kr/ttb/api";

export interface BookDetail {
  isbn13?: string;
  pageCount?: number;
  sizeHeight?: number;
  sizeWidth?: number;
}

async function itemLookup(
  key: string,
  itemId: string,
  idType: "ISBN13" | "ISBN" | "ItemId" = "ISBN13",
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

  try {
    const r = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return null;
    const text = await r.text();
    const cleaned = text.trim();
    if (!cleaned.startsWith("{")) return null;
    const data = JSON.parse(cleaned);
    const item = data.item?.[0];
    if (!item) return null;

    const packing = item.subInfo?.packing;
    return {
      isbn13: item.isbn13 || undefined,
      pageCount: item.subInfo?.itemPage || undefined,
      sizeHeight: packing?.sizeHeight || undefined,
      sizeWidth: packing?.sizeWidth || undefined,
    };
  } catch {
    return null;
  }
}

async function searchOnce(
  key: string,
  query: string,
): Promise<BookDetail | null> {
  const url =
    `${ALADIN_BASE}/ItemSearch.aspx?` +
    new URLSearchParams({
      ttbkey: key,
      Query: query,
      QueryType: "Keyword",
      MaxResults: "3",
      start: "1",
      SearchTarget: "Book",
      output: "js",
      Version: "20131101",
    }).toString();

  try {
    const r = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return null;
    const text = await r.text();
    const cleaned = text.trim();
    if (!cleaned.startsWith("{")) return null;
    const data = JSON.parse(cleaned);
    const items = data.item;
    if (!items?.length) return null;

    const best = items.find((i: { isbn13?: string }) => i.isbn13) ?? items[0];
    if (!best?.isbn13) return null;

    return itemLookup(key, best.isbn13, "ISBN13");
  } catch {
    return null;
  }
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s*[\[(（【].*?[\])）】]\s*/g, " ")
    .replace(/\s*[:-]\s*.{15,}$/, "")
    .trim();
}

async function searchByTitle(
  key: string,
  title: string,
  creator?: string,
): Promise<BookDetail | null> {
  if (creator) {
    const result = await searchOnce(key, `${title} ${creator}`);
    if (result) return result;
  }

  const result = await searchOnce(key, title);
  if (result) return result;

  const cleaned = cleanTitle(title);
  if (cleaned !== title && cleaned.length >= 2) {
    return searchOnce(key, cleaned);
  }

  return null;
}

// ─── Google Books fallback ──────────────────────────────────────────

function parseCmToMm(dim: string | undefined): number | undefined {
  if (!dim) return undefined;
  const m = dim.match(/([\d.]+)\s*cm/i);
  if (m) return Math.round(parseFloat(m[1]) * 10);
  const mm = dim.match(/([\d.]+)\s*mm/i);
  if (mm) return Math.round(parseFloat(mm[1]));
  return undefined;
}

async function googleBooksSearch(query: string): Promise<BookDetail | null> {
  const url =
    `https://www.googleapis.com/books/v1/volumes?` +
    new URLSearchParams({ q: query, maxResults: "3" }).toString();

  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    const data = await r.json();
    const items = data.items as Array<{ volumeInfo: Record<string, unknown> }> | undefined;
    if (!items?.length) return null;

    for (const item of items) {
      const vol = item.volumeInfo;
      const ids = vol.industryIdentifiers as
        | Array<{ type: string; identifier: string }>
        | undefined;
      const isbn13 =
        ids?.find((i) => i.type === "ISBN_13")?.identifier ?? undefined;
      const dims = vol.dimensions as
        | { height?: string; width?: string }
        | undefined;

      const detail: BookDetail = {
        isbn13,
        pageCount: (vol.pageCount as number) || undefined,
        sizeHeight: parseCmToMm(dims?.height),
        sizeWidth: parseCmToMm(dims?.width),
      };

      if (detail.isbn13 || detail.pageCount) return detail;
    }
    return null;
  } catch {
    return null;
  }
}

async function googleBooksLookup(
  isbn?: string,
  title?: string,
  creator?: string,
): Promise<BookDetail | null> {
  if (isbn) {
    const r = await googleBooksSearch(`isbn:${isbn}`);
    if (r) return r;
  }

  if (title && creator) {
    const r = await googleBooksSearch(`intitle:${title} inauthor:${creator}`);
    if (r) return r;
  }

  if (title) {
    const r = await googleBooksSearch(title);
    if (r) return r;
  }

  return null;
}

// ─── Open Library fallback ─────────────────────────────────────────

async function openLibraryLookup(
  isbn?: string,
  title?: string,
  creator?: string,
): Promise<BookDetail | null> {
  if (isbn) {
    try {
      const url = `https://openlibrary.org/isbn/${isbn}.json`;
      const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (r.ok) {
        const data = await r.json();
        const isbn13List = data.isbn_13 as string[] | undefined;
        const physDim = data.physical_dimensions as string | undefined;
        let h: number | undefined;
        let w: number | undefined;
        if (physDim) {
          const parts = physDim.match(/([\d.]+)\s*x\s*([\d.]+)(?:\s*x\s*[\d.]+)?\s*(centimeters|inches)/i);
          if (parts) {
            const unit = parts[3].toLowerCase();
            const v1 = parseFloat(parts[1]);
            const v2 = parseFloat(parts[2]);
            const big = Math.max(v1, v2);
            const small = Math.min(v1, v2);
            if (unit === "centimeters") {
              h = Math.round(big * 10);
              w = Math.round(small * 10);
            } else {
              h = Math.round(big * 25.4);
              w = Math.round(small * 25.4);
            }
          }
        }
        const detail: BookDetail = {
          isbn13: isbn13List?.[0] ?? undefined,
          pageCount: (data.number_of_pages as number) || undefined,
          sizeHeight: h,
          sizeWidth: w,
        };
        if (detail.isbn13 || detail.pageCount || detail.sizeHeight) return detail;
      }
    } catch { /* continue */ }
  }

  if (title) {
    try {
      const params: Record<string, string> = { title, limit: "3" };
      if (creator) params.author = creator;
      const url =
        `https://openlibrary.org/search.json?` +
        new URLSearchParams(params).toString();
      const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!r.ok) return null;
      const data = await r.json();
      const docs = data.docs as Array<Record<string, unknown>> | undefined;
      if (!docs?.length) return null;

      const best = docs[0];
      const isbns = best.isbn as string[] | undefined;
      const isbn13 = isbns?.find((i: string) => i.length === 13);

      return {
        isbn13: isbn13 ?? undefined,
        pageCount: (best.number_of_pages_median as number) || undefined,
        sizeHeight: undefined,
        sizeWidth: undefined,
      };
    } catch {
      return null;
    }
  }

  return null;
}

// ─── Combined enrichment ────────────────────────────────────────────

function mergeDetails(a: BookDetail | null, b: BookDetail | null): BookDetail | null {
  if (!a && !b) return null;
  if (!a) return b;
  if (!b) return a;
  return {
    isbn13: a.isbn13 || b.isbn13,
    pageCount: a.pageCount || b.pageCount,
    sizeHeight: a.sizeHeight || b.sizeHeight,
    sizeWidth: a.sizeWidth || b.sizeWidth,
  };
}

const detailCache = new Map<string, BookDetail | null>();

function needsMoreFields(d: BookDetail | null): boolean {
  return !d || !d.isbn13 || !d.pageCount || !d.sizeHeight || !d.sizeWidth;
}

function estimateDimensions(detail: BookDetail): BookDetail {
  if (detail.sizeHeight && detail.sizeWidth) return detail;
  const pages = detail.pageCount ?? 200;
  if (pages > 400) {
    return { ...detail, sizeHeight: detail.sizeHeight ?? 230, sizeWidth: detail.sizeWidth ?? 152 };
  }
  if (pages > 200) {
    return { ...detail, sizeHeight: detail.sizeHeight ?? 210, sizeWidth: detail.sizeWidth ?? 148 };
  }
  return { ...detail, sizeHeight: detail.sizeHeight ?? 188, sizeWidth: detail.sizeWidth ?? 128 };
}

export async function enrichBookDetail(
  isbn?: string,
  title?: string,
  creator?: string,
): Promise<BookDetail | null> {
  const cacheKey = isbn || title || "";
  if (!cacheKey) return null;
  if (detailCache.has(cacheKey)) return detailCache.get(cacheKey)!;

  let detail: BookDetail | null = null;

  const aladinKey = process.env.ALADIN_TTB_KEY;
  if (aladinKey) {
    if (isbn && isbn.length >= 10) {
      const idType = isbn.length === 13 ? "ISBN13" : "ISBN";
      detail = await itemLookup(aladinKey, isbn, idType);
    }
    if (!detail && title) {
      detail = await searchByTitle(aladinKey, title, creator);
    }
  }

  if (needsMoreFields(detail)) {
    const lookupIsbn = detail?.isbn13 || isbn;
    const gDetail = await googleBooksLookup(lookupIsbn, title, creator);
    detail = mergeDetails(detail, gDetail);
  }

  if (needsMoreFields(detail)) {
    const lookupIsbn = detail?.isbn13 || isbn;
    const olDetail = await openLibraryLookup(lookupIsbn, title, creator);
    detail = mergeDetails(detail, olDetail);
  }

  if (detail && (!detail.sizeHeight || !detail.sizeWidth)) {
    detail = estimateDimensions(detail);
  }

  detailCache.set(cacheKey, detail);
  return detail;
}

export async function enrichBooksInBatch(
  books: Array<{
    isbn?: string;
    title: string;
    creator?: string;
  }>,
): Promise<Map<string, BookDetail>> {
  const results = new Map<string, BookDetail>();
  const BATCH = 3;

  for (let i = 0; i < books.length; i += BATCH) {
    const batch = books.slice(i, i + BATCH);
    const details = await Promise.all(
      batch.map((b) => enrichBookDetail(b.isbn, b.title, b.creator)),
    );
    for (let j = 0; j < batch.length; j++) {
      const book = batch[j];
      const detail = details[j];
      if (detail) {
        results.set(book.isbn || book.title, detail);
      }
    }
  }

  return results;
}
