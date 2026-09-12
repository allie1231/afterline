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

async function searchByTitle(
  key: string,
  title: string,
  creator?: string,
): Promise<BookDetail | null> {
  const query = creator ? `${title} ${creator}` : title;
  const url =
    `${ALADIN_BASE}/ItemSearch.aspx?` +
    new URLSearchParams({
      ttbkey: key,
      Query: query,
      QueryType: "Keyword",
      MaxResults: "1",
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
    const item = data.item?.[0];
    if (!item?.isbn13) return null;

    return itemLookup(key, item.isbn13, "ISBN13");
  } catch {
    return null;
  }
}

const detailCache = new Map<string, BookDetail | null>();

export async function enrichBookDetail(
  isbn?: string,
  title?: string,
  creator?: string,
): Promise<BookDetail | null> {
  const key = process.env.ALADIN_TTB_KEY;
  if (!key) return null;

  const cacheKey = isbn || title || "";
  if (!cacheKey) return null;
  if (detailCache.has(cacheKey)) return detailCache.get(cacheKey)!;

  let detail: BookDetail | null = null;

  if (isbn && isbn.length >= 10) {
    const idType = isbn.length === 13 ? "ISBN13" : "ISBN";
    detail = await itemLookup(key, isbn, idType);
  }

  if (!detail && title) {
    detail = await searchByTitle(key, title, creator);
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
