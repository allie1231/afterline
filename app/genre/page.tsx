export const revalidate = 300;

import { getSourcesByGenre, getQuotesBySource } from "@/lib/data/repository";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SourceSpine } from "@/components/SourceSpine";

export default async function GenrePage() {
  const genres = await getSourcesByGenre();

  const genresWithCounts = await Promise.all(
    genres.map(async (g) => ({
      ...g,
      sourceCounts: await Promise.all(
        g.sources.map(async (s) => ({
          source: s,
          lines: (await getQuotesBySource(s.id)).length,
        })),
      ),
    })),
  );

  return (
    <section className="px-6 py-10">
      <Breadcrumb
        crumbs={[
          { label: "AFTERLINE", href: "/" },
          { label: "GENRE" },
        ]}
        className="mb-3"
      />

      <div className="flex items-baseline justify-between mb-12 border-b border-line pb-6">
        <h2 className="font-serif text-5xl md:text-6xl tracking-tight">
          Genre
        </h2>
        <div className="text-right">
          <div className="font-sans text-[13px] text-muted">
            분야
          </div>
          <div className="font-sans text-lg mt-1">분야별 책장</div>
        </div>
      </div>

      {genresWithCounts.length === 0 ? (
        <div className="flex flex-col items-center py-24 gap-6">
          <div className="font-mono text-xs tracking-[0.25em] text-muted">
            NO GENRES YET / <span className="tracking-normal">분야가 지정된 책이 없습니다.</span>
          </div>
        </div>
      ) : (
        <div className="space-y-16">
          {genresWithCounts.map((g) => (
            <div key={g.genre}>
              <div className="flex items-baseline justify-between mb-5 border-b border-line pb-3">
                <h3 className="font-sans text-2xl tracking-tight">
                  {g.genre}
                </h3>
                <span className="font-mono text-[11px] tracking-[0.25em] text-muted">
                  {String(g.sources.length).padStart(2, "0")} BOOKS
                </span>
              </div>
              <div className="flex flex-wrap items-end gap-y-5">
                {g.sourceCounts.map(({ source, lines }) => (
                  <SourceSpine key={source.id} source={source} lines={lines} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
