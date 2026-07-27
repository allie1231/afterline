import Link from "next/link";
import { notFound } from "next/navigation";
import { getYearInReview } from "@/lib/data/repository";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ROOM_CATEGORIES } from "@/lib/data/categories";

export const dynamic = "force-dynamic";

const MONTH_LABEL = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

function fmtDate(iso: string) {
  return iso.slice(0, 10).replace(/-/g, ".");
}

export default async function YearReviewPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearStr } = await params;
  const year = Number(yearStr);
  if (!Number.isInteger(year) || year < 1900 || year > 2200) notFound();

  const r = await getYearInReview(year);
  const maxMonth = Math.max(1, ...r.byMonth.map((m) => m.count));

  return (
    <section className="px-6 py-10 max-w-4xl mx-auto">
      <Breadcrumb
        crumbs={[
          { label: "AFTERLINE", href: "/" },
          { label: "REVIEW", href: "/review" },
          { label: String(year) },
        ]}
        className="mb-3"
      />

      <header className="mb-12 border-b border-ink pb-8">
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-3">
          YEAR IN REVIEW · VOL. {year}
        </div>
        <h1 className="font-serif text-[clamp(60px,10vw,140px)] leading-none tracking-tight">
          {year}
        </h1>
      </header>

      {r.totalLines === 0 ? (
        <div className="font-mono text-xs tracking-[0.2em] text-muted py-20 text-center">
          NO LINES COLLECTED IN {year}.
        </div>
      ) : (
        <>
          {/* Big numbers */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink border border-ink mb-12">
            <BigNumber label="LINES" ko="문장" value={r.totalLines} />
            <BigNumber
              label="SOURCES"
              ko="새 출처"
              value={r.totalSources}
            />
            <BigNumber label="NOTES" ko="노트" value={r.totalNotes} />
            <BigNumber
              label="FAVORITES"
              ko="즐겨찾기"
              value={r.favoriteCount}
            />
          </section>

          {/* Pace by month */}
          <section className="mb-12">
            <h2 className="font-serif text-2xl tracking-tight mb-1">
              Pace by Month
            </h2>
            <div className="font-mono text-xs tracking-[0.2em] text-muted mb-5">
              월별 수집 흐름
              {r.busiestMonth && (
                <span>
                  {" · "}
                  가장 많이 모은 달:{" "}
                  {MONTH_LABEL[r.busiestMonth.month - 1]} (
                  {r.busiestMonth.count})
                </span>
              )}
            </div>
            <div className="grid grid-cols-12 gap-1 items-end h-[140px]">
              {r.byMonth.map((m) => {
                const pct = Math.round((m.count / maxMonth) * 100);
                return (
                  <div
                    key={m.month}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="flex-1 w-full flex items-end">
                      <div
                        className="w-full bg-ink"
                        style={{ height: `${pct}%`, minHeight: "1px" }}
                        title={`${MONTH_LABEL[m.month - 1]} · ${m.count}`}
                      />
                    </div>
                    <div className="font-mono text-[8px] tracking-[0.2em] text-muted">
                      {MONTH_LABEL[m.month - 1]}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* By room */}
          <section className="mb-12">
            <h2 className="font-serif text-2xl tracking-tight mb-1">
              By Room
            </h2>
            <div className="font-mono text-xs tracking-[0.2em] text-muted mb-5">
              어디서 가장 많이 머물렀는지
            </div>
            <ul className="flex flex-col gap-3">
              {ROOM_CATEGORIES.filter((c) => (r.byType[c.type] ?? 0) > 0).map(
                (cat) => {
                  const v = r.byType[cat.type] ?? 0;
                  const max = Math.max(1, ...Object.values(r.byType));
                  const pct = Math.round((v / max) * 100);
                  return (
                    <li
                      key={cat.type}
                      className="grid grid-cols-[140px_1fr_80px] gap-4 items-center"
                    >
                      <Link
                        href={`/rooms/${cat.type}`}
                        className="font-serif text-base"
                      >
                        {cat.en}
                      </Link>
                      <div className="h-3 bg-line/40">
                        <div
                          className="h-full"
                          style={{
                            width: `${pct}%`,
                            background: cat.accent,
                          }}
                        />
                      </div>
                      <div className="text-right font-mono text-[10px] tracking-[0.25em] text-muted">
                        {String(v).padStart(3, "0")}
                      </div>
                    </li>
                  );
                },
              )}
            </ul>
          </section>

          {/* Top lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
            {r.topSources.length > 0 && (
              <SectionList
                title="Most-Quoted Sources"
                ko="가장 많이 모은 출처"
                items={r.topSources.map((s) => ({
                  key: s.source.id,
                  label: s.source.title,
                  sub: s.source.creator ?? "",
                  count: s.lines,
                  href: `/sources/${s.source.id}`,
                }))}
              />
            )}
            {r.topPeople.length > 0 && (
              <SectionList
                title="Top People"
                ko="가장 많이 모은 저자"
                items={r.topPeople.map((p) => ({
                  key: p.name,
                  label: p.name,
                  count: p.lines,
                  href: `/people/${encodeURIComponent(p.name)}`,
                }))}
              />
            )}
            {r.topGenres.length > 0 && (
              <SectionList
                title="Top Genres"
                ko="가장 많이 모은 장르"
                items={r.topGenres.map((g) => ({
                  key: g.genre,
                  label: g.genre,
                  count: g.count,
                }))}
              />
            )}
            {r.topTags.length > 0 && (
              <SectionList
                title="Top Tags"
                ko="가장 많이 쓴 태그"
                items={r.topTags.map((t) => ({
                  key: t.tag,
                  label: `#${t.tag}`,
                  count: t.count,
                  href: `/mood/${encodeURIComponent(t.tag)}`,
                }))}
              />
            )}
          </div>

          {/* Anchors — first / latest */}
          <section className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8 border-y border-line py-8">
            {r.firstLine && (
              <Anchor label="FIRST LINE / 첫 문장" item={r.firstLine} />
            )}
            {r.latestLine && r.latestLine.quote.id !== r.firstLine?.quote.id && (
              <Anchor label="LATEST LINE / 가장 최근" item={r.latestLine} />
            )}
          </section>

          {/* Favorites */}
          {r.favorites.length > 0 && (
            <section className="mb-12">
              <h2 className="font-serif text-2xl tracking-tight mb-1">
                Favorites
              </h2>
              <div className="font-mono text-xs tracking-[0.2em] text-muted mb-5">
                즐겨찾기한 문장들 — 무작위 5개
              </div>
              <ol className="flex flex-col gap-8">
                {r.favorites.map(({ quote, source }) => (
                  <li
                    key={quote.id}
                    className="grid grid-cols-[80px_1fr] gap-4"
                  >
                    <div className="font-mono text-[10px] tracking-[0.25em] text-muted pt-2">
                      {fmtDate(quote.created_at).slice(5)}
                    </div>
                    <div>
                      <p className="font-sans text-base leading-relaxed whitespace-pre-line">
                        &ldquo;{quote.text}&rdquo;
                      </p>
                      {source && (
                        <Link
                          href={`/sources/${source.id}`}
                          className="font-mono text-[10px] tracking-[0.25em] text-muted hover:text-ink mt-2 inline-block"
                        >
                          {source.title}
                          {source.creator ? ` — ${source.creator}` : ""}
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}
    </section>
  );
}

function BigNumber({
  label,
  ko,
  value,
}: {
  label: string;
  ko: string;
  value: number;
}) {
  return (
    <div className="bg-paper p-6">
      <div className="font-mono text-[10px] tracking-[0.3em] text-muted">
        {label}
      </div>
      <div className="font-serif text-[clamp(36px,6vw,60px)] leading-none mt-2">
        {value}
      </div>
      <div className="font-mono text-[10px] tracking-[0.25em] text-muted mt-2">
        {ko}
      </div>
    </div>
  );
}

function SectionList({
  title,
  ko,
  items,
}: {
  title: string;
  ko: string;
  items: Array<{
    key: string;
    label: string;
    sub?: string;
    count: number;
    href?: string;
  }>;
}) {
  return (
    <section>
      <h2 className="font-serif text-2xl tracking-tight mb-1">{title}</h2>
      <div className="font-mono text-xs tracking-[0.2em] text-muted mb-4">
        {ko}
      </div>
      <ol className="flex flex-col gap-2">
        {items.map((it, i) => (
          <li
            key={it.key}
            className="grid grid-cols-[24px_1fr_50px] gap-3 items-baseline"
          >
            <span className="font-mono text-[10px] tracking-[0.2em] text-muted">
              {String(i + 1).padStart(2, "0")}
            </span>
            {it.href ? (
              <Link
                href={it.href}
                className="font-serif text-base truncate hover:text-red transition-colors"
                title={it.label}
              >
                {it.label}
                {it.sub && (
                  <span className="text-muted text-sm ml-1">
                    — {it.sub}
                  </span>
                )}
              </Link>
            ) : (
              <span className="font-serif text-base truncate" title={it.label}>
                {it.label}
              </span>
            )}
            <span className="text-right font-mono text-[10px] tracking-[0.25em] text-muted">
              {String(it.count).padStart(2, "0")}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Anchor({
  label,
  item,
}: {
  label: string;
  item: {
    quote: { id: string; text: string; created_at: string };
    source: { id: string; title: string; creator?: string | null } | null;
  };
}) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-3">
        {label} · {fmtDate(item.quote.created_at)}
      </div>
      <p className="font-sans text-base leading-relaxed whitespace-pre-line">
        &ldquo;{item.quote.text}&rdquo;
      </p>
      {item.source && (
        <Link
          href={`/sources/${item.source.id}`}
          className="font-mono text-[10px] tracking-[0.25em] text-muted hover:text-ink mt-2 inline-block"
        >
          {item.source.title}
          {item.source.creator ? ` — ${item.source.creator}` : ""}
        </Link>
      )}
    </div>
  );
}
