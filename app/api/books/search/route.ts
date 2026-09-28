// Server-side book search proxy.
// 1) Kakao first (best Korean coverage, and the only source with cover images
//    for Korean books — Google Books had none for 30 of 30 sampled). Server-side
//    because the REST key must stay out of the bundle.
// 2) Google Books as a fallback when Kakao returns nothing.
//
// Kakao carries no category, so book results have no genre; it is typed in on
// the source page instead.

import { NextResponse } from "next/server";

export type BookSearchResult = {
  id: string;
  title: string;
  creator?: string;
  publisher?: string;
  published_date?: string;
  isbn?: string;
  cover_url?: string;
  genre?: string;
  source: "kakao" | "google";
};

// Kakao returns both ISBNs in one space-separated field: "8937473135 9788937473135".
function pickIsbn13(raw?: string): string | undefined {
  const parts = String(raw ?? "").trim().split(/\s+/).filter(Boolean);
  return parts.find((p) => p.length === 13) ?? parts[0];
}

// The thumbnail Kakao hands back is a signed 120x174 crop — asking that host for
// a bigger crop is rejected — but it wraps the full-size original in ?fname=,
// which serves ~458x666 over https.
function fullSizeCover(thumbnail?: string): string | undefined {
  if (!thumbnail) return undefined;
  try {
    const original = new URL(thumbnail).searchParams.get("fname");
    if (original) return original.replace(/^http:\/\//, "https://");
  } catch {
    // fall through to the thumbnail below
  }
  return thumbnail;
}

async function searchKakao(query: string): Promise<BookSearchResult[]> {
  const key = process.env.KAKAO_REST_KEY;
  if (!key) return [];
  const url =
    `https://dapi.kakao.com/v3/search/book?` +
    new URLSearchParams({ query, size: "10" }).toString();

  try {
    const r = await fetch(url, {
      headers: { Authorization: `KakaoAK ${key}` },
      next: { revalidate: 60 * 60 },
    });
    if (!r.ok) return [];
    const data = await r.json();
    const docs = (data.documents ?? []) as Array<{
      title?: string;
      authors?: string[];
      translators?: string[];
      publisher?: string;
      datetime?: string;
      isbn?: string;
      thumbnail?: string;
    }>;
    return docs
      .map<BookSearchResult>((d) => {
        const isbn = pickIsbn13(d.isbn);
        return {
          id: `kakao-${isbn ?? d.title ?? Math.random()}`,
          title: d.title ?? "",
          creator: d.authors?.filter(Boolean).join(", ") || undefined,
          publisher: d.publisher || undefined,
          published_date: d.datetime?.slice(0, 4),
          isbn,
          cover_url: fullSizeCover(d.thumbnail),
          source: "kakao",
        };
      })
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
        categories?: string[];
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
          genre: v.categories?.[0],
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

  const kakao = await searchKakao(q);
  if (kakao.length > 0) {
    return NextResponse.json({ results: kakao });
  }
  const google = await searchGoogleBooks(q);
  return NextResponse.json({ results: google });
}
