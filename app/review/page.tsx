import Link from "next/link";
import { getCollectedYears } from "@/lib/data/repository";
import { Breadcrumb } from "@/components/Breadcrumb";

export const dynamic = "force-dynamic";

export default async function ReviewIndexPage() {
  const years = await getCollectedYears();
  const current = new Date().getFullYear();

  return (
    <section className="px-6 py-10 max-w-3xl mx-auto">
      <Breadcrumb
        crumbs={[
          { label: "AFTERLINE", href: "/" },
          { label: "REVIEW" },
        ]}
        className="mb-3"
      />
      <h1 className="font-serif text-4xl md:text-5xl tracking-tight leading-none">
        Year in Review
      </h1>
      <p className="font-mono text-xs tracking-[0.2em] text-muted mt-3 mb-10">
        한 해의 단면 — 연도별 아카이브
      </p>

      {years.length === 0 ? (
        <div className="font-mono text-xs tracking-[0.2em] text-muted py-20 text-center">
          NO COLLECTIONS YET / 아직 모은 문장이 없어요.
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-line border-y border-line">
          {years.map((y) => (
            <li key={y}>
              <Link
                href={`/review/${y}`}
                className="flex items-baseline justify-between py-5 px-1 -mx-1 hover:bg-line/30 transition-colors"
              >
                <span className="font-serif text-3xl tracking-tight">{y}</span>
                <span className="font-mono text-[10px] tracking-[0.3em] text-muted">
                  {y === current ? "IN PROGRESS / 진행중" : "ARCHIVED"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
