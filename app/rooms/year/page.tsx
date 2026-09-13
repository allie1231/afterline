export const revalidate = 300;

import Link from "next/link";
import { getFinishedBooksByYear } from "@/lib/data/repository";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SourceSpine } from "@/components/SourceSpine";

export default async function YearRoomPage() {
  const yearlyBooks = await getFinishedBooksByYear();

  return (
    <section className="px-6 py-10">
      <Breadcrumb
        backHref="/rooms"
        crumbs={[
          { label: "ROOMS", href: "/rooms" },
          { label: "YEAR" },
        ]}
        className="mb-3"
      />

      <div className="flex items-baseline justify-between mb-12 border-b border-line pb-6">
        <h2 className="font-sans text-4xl md:text-5xl tracking-tight">YEAR</h2>
        <div className="text-right">
          <div className="font-mono text-[11px] tracking-[0.25em] text-muted">
            연도별
          </div>
          <div className="font-sans text-lg mt-1">
            A year-by-year reading archive.
          </div>
        </div>
      </div>

      {yearlyBooks.length === 0 ? (
        <div className="flex flex-col items-center py-24 gap-6">
          <div className="font-mono text-xs tracking-[0.25em] text-muted">
            NO FINISHED BOOKS YET / 완독한 책이 없습니다.
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {yearlyBooks.map(({ year, count, sources }) => (
            <div key={year}>
              <div className="flex items-baseline gap-4 mb-4 border-b border-line pb-3">
                <h3 className="font-serif text-3xl tracking-tight">{year}</h3>
                <span className="font-mono text-[11px] tracking-[0.3em] text-muted">
                  {String(count).padStart(2, "0")} {count === 1 ? "BOOK" : "BOOKS"}
                </span>
              </div>
              <div className="border-y-2 border-ink">
                <div className="flex flex-wrap items-end gap-y-5 py-6 pb-2">
                  {sources.map((source) => (
                    <SourceSpine key={source.id} source={source} lines={0} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
