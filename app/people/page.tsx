import Link from "next/link";
import { getAllCreators } from "@/lib/data/repository";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ROOM_CATEGORIES } from "@/lib/data/categories";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const creators = await getAllCreators();

  return (
    <section className="px-6 py-10 max-w-4xl mx-auto">
      <Breadcrumb
        crumbs={[
          { label: "AFTERLINE", href: "/" },
          { label: "PEOPLE" },
        ]}
        className="mb-3"
      />
      <h1 className="font-serif text-4xl md:text-5xl tracking-tight leading-none">
        People
      </h1>
      <p className="font-mono text-xs tracking-[0.2em] text-muted mt-3 mb-10">
        모은 모든 저자 · 필자 · 아티스트
      </p>

      <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-4">
        {String(creators.length).padStart(3, "0")} PEOPLE
      </div>

      {creators.length === 0 ? (
        <div className="font-mono text-xs tracking-[0.2em] text-muted py-20 text-center">
          NO PEOPLE YET / 아직 모은 저자가 없어요.
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-line border-y border-line">
          {creators.map((c) => (
            <li key={c.name}>
              <Link
                href={`/people/${encodeURIComponent(c.name)}`}
                className="grid grid-cols-[1fr_auto] items-baseline gap-4 py-4 hover:bg-line/30 px-1 -mx-1 transition-colors"
              >
                <div>
                  <div className="font-serif text-xl tracking-tight">
                    {c.name}
                  </div>
                  <div className="font-mono text-[10px] tracking-[0.25em] text-muted mt-1 flex gap-3 flex-wrap">
                    {c.types.map((t) => {
                      const cat = ROOM_CATEGORIES.find((cc) => cc.type === t);
                      return (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1.5"
                        >
                          <span
                            className="w-1.5 h-1.5 inline-block"
                            style={{ background: cat?.accent }}
                          />
                          {cat?.en ?? t.toUpperCase()}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="text-right font-mono text-[10px] tracking-[0.25em] text-muted">
                  {String(c.sources).padStart(2, "0")} SRCS ·{" "}
                  {String(c.lines).padStart(3, "0")} LINES
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
