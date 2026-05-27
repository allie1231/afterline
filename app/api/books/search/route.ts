// Server-side book search proxy.
// 1) Aladin first (best Korean coverage). Server-side because Aladin
//    doesn't expose CORS for browsers and the key stays out of the bundle.
// 2) Google Books as a fallback when Aladin returns nothing.

import { NextResponse } from "next/server";

export type BookSearchResult = {
  id: string;
  title: string;
  creator?: string;
  publisher?: string;
  published_date?: string;
  isbn?: string;
  cover_url?: string;
  source: "aladin" | "google";
};

function cleanAuthor(raw?: string): string | undefined {
  if (!raw) return undefined;
  // Aladin returns things like "헤르만 헤세 (지은이), 전영애 (옮긴이)".
  // Strip the parenthetical roles to keep just the names.
  return raw.replace(/\s*\([^)]*\)/g, "").trim();
}

async function searchAladin(query: string): Promise<BookSearchResult[]> {
  const key = process.env.ALADIN_TTB_KEY;
  if (!key) return [];
  const url =
    `https://www.aladin.co.kr/ttb/api/ItemSearch.aspx?` +
    new URLSearchParams({
      ttbkey: key,
      Query: query,
      QueryType: "Keyword",
      MaxResults: "10",
      start: "1",
      SearchTarget: "Book",
      output: "js",
      Version: "20131101",
      Cover: "Big",
    }).toString();

  try {
    const r = await fetch(url, {
      headers: { Accept: "application/json" },
      // Aladin caches responses well; no need to revalidate constantly.
      next: { revalidate: 60 * 60 },
    });
    if (!r.ok) return [];
    const text = await r.text();
    // Aladin sometimes prefixes the JSON with whitespace or BOM. Trim.
    const cleaned = text.trim();
    if (!cleaned.startsWith("{")) return [];
    const data = JSON.parse(cleaned);
    const items = (data.item ?? []) as Array<{
      itemId?: number | string;
      title?: string;
      author?: string;
      publisher?: string;
      pubDate?: string;
      isbn?: string;
      isbn13?: string;
      cover?: string;
    }>;
    return items
      .map<BookSearchResult>((it) => ({
        id: `aladin-${it.itemId ?? it.isbn13 ?? Math.random()}`,
        title: it.title ?? "",
        creator: cleanAuthor(it.author),
        publisher: it.publisher,
        published_date: it.pubDate?.slice(0, 4),
        isbn: it.isbn13 || it.isbn,
        cover_url: it.cover,
        source: "aladin",
      }))
      .filter((r) => r.title.length > 0);
  } catch {
    return [];
  }
}

async function searchGoogleBooks(query: string): Promise<BookSearchResult[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&printType=books`;
  try {
    const r = await fetch(url, { next: { revalidate: 60 * 60 } });
    if (!r.ok) return [];
    const data = await r.json();
    const items = (data.items ?? []) as Array<{
      id: string;
      volumeInfo: {
        title?: string;
        authors?: string[];
        publisher?: string;
        publishedDate?: string;
        industryIdentifiers?: { type: string; identifier: string }[];
        imageLinks?: { thumbnail?: string; smallThumbnail?: string };
      };
    }>;
    return items
      .map<BookSearchResult>((it) => {
        const v = it.volumeInfo;
        const isbn13 = v.industryIdentifiers?.find((x) => x.type === "ISBN_13");
        const isbn10 = v.industryIdentifiers?.find((x) => x.type === "ISBN_10");
        const cover = (
          v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail
        )?.replace("http://", "https://");
        return {
          id: `google-${it.id}`,
          title: v.title ?? "",
          creator: v.authors?.join(", "),
          publisher: v.publisher,
          published_date: v.publishedDate?.slice(0, 4),
          isbn: isbn13?.identifier ?? isbn10?.identifier,
          cover_url: cover,
          source: "google",
        };
      })
      .filter((r) => r.title.length > 0);
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ results: [] });

  const aladin = await searchAladin(q);
  if (aladin.length > 0) {
    return NextResponse.json({ results: aladin });
  }
  const google = await searchGoogleBooks(q);
  return NextResponse.json({ results: google });
}
