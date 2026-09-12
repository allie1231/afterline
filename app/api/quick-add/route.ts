import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getData, createQuoteInNotion, createSourceInNotion, invalidateNotionCache } from "@/lib/notion";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, init: ResponseInit = {}) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...CORS, ...(init.headers ?? {}) },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  const token = process.env.QUICK_ADD_TOKEN;
  if (!token) return json({ error: "QUICK_ADD_TOKEN not configured" }, { status: 500 });

  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (auth !== token) return json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const text = (body.text ?? "").trim();
    if (!text) return json({ error: "text is required" }, { status: 400 });

    const sourceTitle = (body.page_title ?? "").trim();
    const sourceCreator = (body.page_creator ?? "").trim();

    let sourceId: string | null = null;

    if (sourceTitle) {
      const { sources } = await getData();
      const existing = sources.find(
        (s) => s.title.toLowerCase() === sourceTitle.toLowerCase(),
      );
      if (existing) {
        sourceId = existing.id;
      } else {
        sourceId = await createSourceInNotion({
          title: sourceTitle,
          creator: sourceCreator || undefined,
        });
      }
    }

    const quoteId = await createQuoteInNotion({
      text,
      sourceId,
    });

    invalidateNotionCache();
    revalidatePath("/", "layout");

    return json({ ok: true, id: quoteId, source_id: sourceId });
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
