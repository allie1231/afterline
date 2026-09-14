import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints/common";
import type { QueryDataSourceResponse } from "@notionhq/client/build/src/api-endpoints/data-sources";
import { enrichBookDetail } from "@/lib/aladin";
import { invalidateNotionCache } from "@/lib/notion";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BATCH_SIZE = 100;

function richText(
  p: PageObjectResponse["properties"],
  k: string,
): string {
  const v = p[k];
  if (!v || v.type !== "rich_text") return "";
  return v.rich_text.map((t) => t.plain_text).join("");
}

function title(
  p: PageObjectResponse["properties"],
  k: string,
): string {
  const v = p[k];
  if (!v || v.type !== "title") return "";
  return v.title.map((t) => t.plain_text).join("");
}

function num(
  p: PageObjectResponse["properties"],
  k: string,
): number | null {
  const v = p[k];
  if (!v || v.type !== "number" || v.number === null) return null;
  return v.number;
}

export async function POST() {
  const notion = new Client({ auth: process.env.NOTION_API_KEY });
  const dbId = process.env.NOTION_SOURCES_DB_ID!;

  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const r: QueryDataSourceResponse = await notion.dataSources.query({
      data_source_id: dbId,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const p of r.results) {
      if ("properties" in p) pages.push(p as PageObjectResponse);
    }
    cursor = r.has_more ? (r.next_cursor ?? undefined) : undefined;
  } while (cursor);

  const needsWork = pages.filter((pg) => {
    const p = pg.properties;
    const isbn = richText(p, "ISBN");
    const pageCount = num(p, "총 페이지수");
    const height = num(p, "책 높이");
    const width = num(p, "책 너비");
    return !isbn || pageCount === null || height === null || width === null;
  });

  const batch = needsWork.slice(0, BATCH_SIZE);
  const results: Array<{
    title: string;
    creator: string;
    id: string;
    filled: string[];
    skipped: boolean;
    missing: string[];
    reason?: "not_found" | "no_data" | "write_failed" | "rate_limited";
  }> = [];

  const CONCURRENT = 5;
  for (let i = 0; i < batch.length; i += CONCURRENT) {
    const chunk = batch.slice(i, i + CONCURRENT);
    const outcomes = await Promise.all(
      chunk.map((pg) => {
        const p = pg.properties;
        return enrichBookDetail(
          richText(p, "ISBN") || undefined,
          title(p, "책 제목"),
          richText(p, "저자") || undefined,
        );
      }),
    );

    for (let j = 0; j < chunk.length; j++) {
      const pg = chunk[j];
      const p = pg.properties;
      const { detail, rateLimited } = outcomes[j];
      const bookTitle = title(p, "책 제목");
      const bookCreator = richText(p, "저자");
      const missing: string[] = [];
      if (!richText(p, "ISBN")) missing.push("ISBN");
      if (num(p, "총 페이지수") === null) missing.push("페이지수");
      if (num(p, "책 높이") === null) missing.push("높이");
      if (num(p, "책 너비") === null) missing.push("너비");

      if (!detail) {
        results.push({
          title: bookTitle, creator: bookCreator, id: pg.id, filled: [], skipped: true, missing,
          reason: rateLimited ? "rate_limited" : "not_found",
        });
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const props: Record<string, any> = {};
      const filled: string[] = [];

      if (!richText(p, "ISBN") && detail.isbn13) {
        props["ISBN"] = { rich_text: [{ text: { content: detail.isbn13 } }] };
        filled.push("ISBN");
      }
      if (num(p, "총 페이지수") === null && detail.pageCount) {
        props["총 페이지수"] = { number: detail.pageCount };
        filled.push("페이지수");
      }
      if (num(p, "책 높이") === null && detail.sizeHeight) {
        props["책 높이"] = { number: detail.sizeHeight };
        filled.push("높이");
      }
      if (num(p, "책 너비") === null && detail.sizeWidth) {
        props["책 너비"] = { number: detail.sizeWidth };
        filled.push("너비");
      }

      if (Object.keys(props).length > 0) {
        try {
          await notion.pages.update({ page_id: pg.id, properties: props });
          results.push({ title: bookTitle, creator: bookCreator, id: pg.id, filled, skipped: false, missing: [] });
        } catch (e) {
          console.error(`[enrich] update failed for ${pg.id}:`, e);
          results.push({ title: bookTitle, creator: bookCreator, id: pg.id, filled: [], skipped: true, missing, reason: "write_failed" });
        }
      } else {
        results.push({ title: bookTitle, creator: bookCreator, id: pg.id, filled: [], skipped: true, missing, reason: "no_data" });
      }
    }
  }

  invalidateNotionCache();

  const enriched = results.filter((r) => r.filled.length > 0);
  const skipped = results.filter((r) => r.skipped);

  return NextResponse.json({
    total_missing: needsWork.length,
    processed: batch.length,
    enriched: enriched.length,
    skipped: skipped.length,
    not_found: results.filter((r) => r.reason === "not_found").length,
    rate_limited: results.filter((r) => r.reason === "rate_limited").length,
    remaining: Math.max(0, needsWork.length - BATCH_SIZE),
    details: results,
  });
}
