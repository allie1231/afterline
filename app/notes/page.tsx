import Link from "next/link";
import { getAllNotesWithSource } from "@/lib/data/repository";
import { Breadcrumb } from "@/components/Breadcrumb";
import { NotesBrowser } from "./NotesBrowser";

// [[q:id]] tokens are not resolved on the index — only on per-source pages.
// The browser previews show the first ~240 chars of raw body, which is
// enough to identify the note before clicking through.

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const items = await getAllNotesWithSource();

  return (
    <section className="px-6 py-10 max-w-4xl mx-auto">
      <Breadcrumb
        crumbs={[
          { label: "AFTERLINE", href: "/" },
          { label: "NOTES" },
        ]}
        className="mb-3"
      />
      <div className="flex items-baseline justify-between flex-wrap gap-4 mb-2">
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight leading-none">
          Notes
        </h1>
        <Link
          href="/rooms"
          className="font-mono text-[10px] tracking-[0.3em] text-muted hover:text-ink"
        >
          소스 골라서 노트 작성 →
        </Link>
      </div>
      <p className="font-mono text-xs tracking-[0.2em] text-muted mt-3 mb-10">
        독서노트 · 아티클 리뷰 · 메모 — 한 곳에서
      </p>

      <NotesBrowser items={items} />
    </section>
  );
}
