export const revalidate = 300;

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getQuotesBySource,
  getRoomCategory,
  getSourcesByRoomSlug,
} from "@/lib/data/repository";
import { Breadcrumb } from "@/components/Breadcrumb";
import { RoomShelf } from "@/components/RoomShelf";
import type { RoomSlug } from "@/lib/data/types";

const VALID: RoomSlug[] = ["books", "articles", "others", "want-to", "done"];

export default async function RoomPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!VALID.includes(type as RoomSlug)) notFound();

  const slug = type as RoomSlug;
  const category = await getRoomCategory(slug);
  const sources = await getSourcesByRoomSlug(slug);
  if (!category) notFound();

  const sourceCounts = await Promise.all(
    sources.map(async (s) => ({
      source: s,
      lines: (await getQuotesBySource(s.id)).length,
    })),
  );

  return (
    <section className="px-6 py-10">
      <Breadcrumb
        backHref="/rooms"
        crumbs={[
          { label: "ROOMS", href: "/rooms" },
          { label: category.en },
        ]}
        className="mb-3"
      />

      <div className="flex items-baseline justify-between mb-12 border-b border-line pb-6">
        <h2 className="font-serif text-5xl md:text-6xl tracking-tight">{category.en}</h2>
        <div className="text-right">
          <div className="font-sans text-[13px] text-muted">{category.ko}</div>
          <div className="font-sans text-lg mt-1">{category.description}</div>
        </div>
      </div>

      {sources.length === 0 ? (
        <div className="flex flex-col items-center py-24 gap-6">
          <div className="font-mono text-xs tracking-[0.25em] text-muted">
            NO SOURCES YET / <span className="tracking-normal">아직 수집된 출처가 없습니다.</span>
          </div>
        </div>
      ) : (
        <RoomShelf slug={slug} sourceCounts={sourceCounts} />
      )}
    </section>
  );
}
