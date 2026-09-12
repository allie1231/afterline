import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getData } from "@/lib/notion";

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
  if (!/^[0-9a-fA-F-]{20,40}$/.test(id)) return null;
  const { quotes, sourceById } = await getData();
  const q = quotes.find((qt) => qt.id === id);
  if (!q) return null;
  const src = q.source_id ? sourceById.get(q.source_id) : null;
  return {
    id: q.id,
    text: q.text,
    page: q.page ?? null,
    created_at: q.created_at,
    source_title: src?.title ?? null,
    source_creator: src?.creator ?? null,
    source_type: src?.type ?? null,
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
    title: `"${q.text.slice(0, 60)}…"`,
    description: desc,
    openGraph: {
      title: `"${q.text.slice(0, 90)}…"`,
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
          <blockquote className="font-sans text-[clamp(18px,3vw,28px)] leading-relaxed whitespace-pre-line">
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
