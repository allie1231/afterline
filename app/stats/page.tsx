import Link from "next/link";
import { getStatsData } from "@/lib/data/repository";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ROOM_CATEGORIES } from "@/lib/data/categories";
import type { SourceType } from "@/lib/data/types";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return iso.slice(0, 10).replace(/-/g, ".");
}

export default async function StatsPage() {
  const stats = await getStatsData();

  const maxLinesPerRoom = Math.max(
    1,
    ...Object.values(stats.linesByType),
  );
  const maxTagCount = Math.max(1, ...stats.topTags.map((t) => t.count));
  const maxActivityCount = Math.max(
    1,
    ...stats.activity.map((d) => d.count),
  );

  return (
    <section className="px-6 py-10 max-w-5xl mx-auto">
      <Breadcrumb
        crumbs={[
          { label: "AFTERLINE", href: "/" },
          { label: "STATS" },
        ]}
        className="mb-3"
      />
      <h1 className="font-serif text-4xl md:text-5xl tracking-tight leading-none">
        Stats
      </h1>
      <p className="font-mono text-xs tracking-[0.2em] text-muted mt-3 mb-12">
        지난 기록의 단면
      </p>

      {/* Big numbers */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink border border-ink mb-12">
        <BigNumber label="LINES" ko="문장" value={stats.totalLines} />
        <BigNumber label="SOURCES" ko="출처" value={stats.totalSources} />
        <BigNumber label="TAGS" ko="태그" value={stats.totalTags} />
        <BigNumber label="FAVORITES" ko="즐겨찾기" value={stats.favoriteLines} />
      </section>

      {/* Lines by room */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl tracking-tight mb-1">
          Lines by Room
        </h2>
        <div className="font-mono text-xs tracking-[0.2em] text-muted mb-5">
          룸별 분포
        </div>
        <ul className="flex flex-col gap-3">
          {ROOM_CATEGORIES.map((cat) => {
            const v = stats.linesByType[cat.type] ?? 0;
            const sources = stats.sourcesByType[cat.type] ?? 0;
            const pct = Math.round((v / maxLinesPerRoom) * 100);
            return (
              <li key={cat.type}>
                <Link
                  href={`/rooms/${cat.type}`}
                  className="grid grid-cols-[140px_1fr_120px] gap-4 items-center group"
                >
                  <div>
                    <div className="font-serif text-base leading-none tracking-tight">
                      {cat.en}
                    </div>
                    <div className="font-mono text-[10px] tracking-[0.25em] text-muted mt-1">
                      {cat.ko}
                    </div>
                  </div>
                  <div className="h-3 bg-line/40 relative">
                    <div
                      className="h-full transition-all group-hover:opacity-90"
                      style={{
                        width: `${pct}%`,
                        background: cat.accent,
                      }}
                    />
                  </div>
                  <div className="text-right font-mono text-[10px] tracking-[0.25em] text-muted">
                    {String(v).padStart(3, "0")} LINES · {String(sources).padStart(2, "0")} SRCS
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Activity last 30 days */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl tracking-tight mb-1">
          Last 30 Days
        </h2>
        <div className="font-mono text-xs tracking-[0.2em] text-muted mb-5">
          최근 30일 활동
        </div>
        <div className="grid grid-cols-30 gap-1" style={{ gridTemplateColumns: "repeat(30, minmax(0, 1fr))" }}>
          {stats.activity.map((d) => {
            const intensity = d.count === 0 ? 0 : Math.min(1, d.count / maxActivityCount);
            const bg =
              d.count === 0
                ? "var(--line)"
                : `color-mix(in srgb, var(--ink) ${Math.round(intensity * 80 + 20)}%, var(--paper))`;
            return (
              <div
                key={d.date}
                title={`${d.date} — ${d.count} lines`}
                className="aspect-square"
                style={{ background: bg }}
              />
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-[9px] tracking-[0.25em] text-muted">
          <span>{stats.activity[0]?.date}</span>
          <span>{stats.activity[stats.activity.length - 1]?.date}</span>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
        {/* Top tags */}
        <section>
          <h2 className="font-serif text-2xl tracking-tight mb-1">Top Tags</h2>
          <div className="font-mono text-xs tracking-[0.2em] text-muted mb-5">
            가장 많이 쓴 태그
          </div>
          {stats.topTags.length === 0 ? (
            <div className="font-mono text-xs text-muted">NO TAGS YET</div>
          ) : (
            <ul className="flex flex-col gap-2">
              {stats.topTags.map((t) => {
                const pct = Math.round((t.count / maxTagCount) * 100);
                return (
                  <li key={t.tag}>
                    <Link
                      href={`/mood/${encodeURIComponent(t.tag)}`}
                      className="grid grid-cols-[1fr_140px_50px] gap-3 items-center group"
                    >
                      <span className="font-serif text-lg truncate group-hover:underline">
                        {t.tag}
                      </span>
                      <span className="h-2 bg-line/40 relative">
                        <span
                          className="absolute inset-y-0 left-0 bg-ink"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="text-right font-mono text-[10px] tracking-[0.25em] text-muted">
                        {String(t.count).padStart(2, "0")}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Deep shelves */}
        <section>
          <h2 className="font-serif text-2xl tracking-tight mb-1">
            Deep Shelves
          </h2>
          <div className="font-mono text-xs tracking-[0.2em] text-muted mb-5">
            라인이 가장 많은 출처
          </div>
          {stats.topSources.length === 0 ? (
            <div className="font-mono text-xs text-muted">—</div>
          ) : (
            <ul className="flex flex-col gap-2">
              {stats.topSources.map(({ source, lines }) => {
                const cat = ROOM_CATEGORIES.find(
                  (c) => c.type === source.type,
                );
                return (
                  <li key={source.id}>
                    <Link
                      href={`/sources/${source.id}`}
                      className="flex items-baseline justify-between gap-3 border-b border-line py-2 hover:bg-line/30 transition-colors px-1 -mx-1"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-serif text-base leading-tight truncate">
                          {source.title}
                        </div>
                        <div className="font-mono text-[9px] tracking-[0.25em] text-muted mt-0.5 truncate">
                          {cat?.en}
                          {source.creator ? ` · ${source.creator}` : ""}
                        </div>
                      </div>
                      <span className="font-mono text-[10px] tracking-[0.25em] text-muted shrink-0">
                        {String(lines).padStart(2, "0")} LINES
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Tags by room */}
      {ROOM_CATEGORIES.some((c) => (stats.tagsByType[c.type] ?? []).length > 0) && (
        <section className="mb-12">
          <h2 className="font-serif text-2xl tracking-tight mb-1">
            Tags by Room
          </h2>
          <div className="font-mono text-xs tracking-[0.2em] text-muted mb-5">
            방 안에서 자주 쓰인 태그
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            {ROOM_CATEGORIES.map((cat) => {
              const tags = stats.tagsByType[cat.type] ?? [];
              if (tags.length === 0) return null;
              const max = Math.max(1, ...tags.map((t) => t.count));
              return (
                <div key={cat.type}>
                  <div className="flex items-baseline justify-between mb-3 border-b border-line pb-2">
                    <Link
                      href={`/rooms/${cat.type}`}
                      className="font-serif text-lg tracking-tight hover:underline"
                    >
                      {cat.en}
                    </Link>
                    <span
                      className="font-mono text-[9px] tracking-[0.3em]"
                      style={{ color: cat.accent }}
                    >
                      {cat.ko}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {tags.map((t) => {
                      const pct = Math.round((t.count / max) * 100);
                      return (
                        <li key={t.tag}>
                          <Link
                            href={`/mood/${encodeURIComponent(t.tag)}`}
                            className="grid grid-cols-[1fr_90px_36px] gap-2 items-center group"
                          >
                            <span className="font-serif text-sm truncate group-hover:underline">
                              {t.tag}
                            </span>
                            <span className="h-1.5 bg-line/40 relative">
                              <span
                                className="absolute inset-y-0 left-0"
                                style={{ width: `${pct}%`, background: cat.accent }}
                              />
                            </span>
                            <span className="text-right font-mono text-[10px] tracking-[0.2em] text-muted">
                              {String(t.count).padStart(2, "0")}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <footer className="border-t border-line pt-5 font-mono text-[10px] tracking-[0.25em] text-muted">
        LATEST LINE · {fmtDate(stats.latestLineAt)}
      </footer>
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
      <div className="font-serif text-[clamp(40px,7vw,68px)] leading-none mt-2">
        {value}
      </div>
      <div className="font-mono text-[10px] tracking-[0.25em] text-muted mt-2">
        {ko}
      </div>
    </div>
  );
}
