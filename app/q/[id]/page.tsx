// Public single-quote page — accessible without login.
// /q/<uuid> renders one collected line for sharing on chat, blog, etc.
//
// RLS would normally hide rows from unauthenticated visitors, so this page
// uses the service-role admin client. The UUID itself is the secret: anyone
// with the link can see the line, no one without it can.

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PublicQuote = {
  id: string;
  text: string;
  page: string | null;
  created_at: string;
  source_title: string | null;
  source_creator: string | null;
  source_type: string | null;
};

async function fetchPublicQuote(id: string): Promise<PublicQuote | null> {
  // Validate id shape early so we don't hit the DB on garbage paths.
  if (!/^[0-9a-fA-F-]{20,40}$/.test(id)) return null;
  const sb = createAdminClient();
  const { data: q } = await sb
    .from("quotes")
    .select("id, text, page, created_at, source_id")
    .eq("id", id)
    .maybeSingle();
  if (!q) return null;
  let source_title: string | null = null;
  let source_creator: string | null = null;
  let source_type: string | null = null;
  if (q.source_id) {
    const { data: s } = await sb
      .from("sources")
      .select("title, creator, type")
      .eq("id", q.source_id as string)
      .maybeSingle();
    source_title = (s?.title as string | null) ?? null;
    source_creator = (s?.creator as string | null) ?? null;
    source_type = (s?.type as string | null) ?? null;
  }
  return {
    id: q.id as string,
    text: q.text as string,
    page: (q.page as string | null) ?? null,
    created_at: q.created_at as string,
    source_title,
    source_creator,
    source_type,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const q = await fetchPublicQuote(id);
  if (!q) {
    return { title: "Afterline" };
  }
  const desc = q.source_title
    ? `${q.source_title}${q.source_creator ? ` — ${q.source_creator}` : ""}`
    : "Afterline";
  return {
    title: `“${q.text.slice(0, 60)}…”`,
    description: desc,
    openGraph: {
      title: `“${q.text.slice(0, 90)}…”`,
      description: desc,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: q.text.slice(0, 90),
      description: desc,
    },
  };
}

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const q = await fetchPublicQuote(id);
  if (!q) notFound();

  return (
    <main className="min-h-screen flex flex-col bg-paper text-ink">
      <header className="px-6 sm:px-10 py-6 border-b border-line">
        <Link
          href="/"
          className="font-mono text-[10px] tracking-[0.3em] text-muted hover:text-ink transition-colors"
        >
          AFTERLINE
          {q.source_type ? ` / ${q.source_type.toUpperCase()}` : ""}
        </Link>
      </header>

      <article className="flex-1 flex items-center px-6 sm:px-10 py-12 sm:py-24">
        <div className="max-w-2xl mx-auto">
          <blockquote className="font-serif text-[clamp(28px,5vw,52px)] leading-[1.2] whitespace-pre-line">
            &ldquo;{q.text}&rdquo;
          </blockquote>

          {(q.source_title || q.source_creator || q.page) && (
            <div className="mt-10 pt-6 border-t border-line font-mono text-[11px] tracking-[0.25em] text-muted flex flex-wrap gap-4">
              {q.source_title && <span>{q.source_title}</span>}
              {q.source_creator && <span>— {q.source_creator}</span>}
              {q.page && <span>· p.{q.page}</span>}
            </div>
          )}
        </div>
      </article>

      <footer className="px-6 sm:px-10 py-6 border-t border-line flex items-baseline justify-between font-mono text-[10px] tracking-[0.25em] text-muted">
        <span>LINES THAT STAYED</span>
        <Link href="/" className="hover:text-ink transition-colors">
          afterline →
        </Link>
      </footer>
    </main>
  );
}
