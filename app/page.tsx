import Link from "next/link";
import {
  getOnThisDay,
  getRandomLinePool,
  getReadingPulse,
  getRediscoveredFavorite,
} from "@/lib/data/repository";
import { RandomQuotePanel } from "@/components/RandomQuotePanel";
import { SourceSpine } from "@/components/SourceSpine";
import type { PastLine } from "@/lib/data/repository";

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return iso.slice(0, 10).replace(/-/g, ".");
}

function yearOf(iso: string): string {
  return iso.slice(0, 4);
}

export const dynamic = "force-dynamic";

export default async function EntrancePage() {
  const [pool, reading, onThisDay, rediscovered] = await Promise.all([
    getRandomLinePool(200),
    getReadingPulse(),
    getOnThisDay(),
    getRediscoveredFavorite(),
  ]);

  return (
    <section className="min-h-[calc(100vh-77px)] flex flex-col justify-between px-8 py-16 gap-16">
      <div className="font-mono text-[10px] tracking-[0.25em] text-muted">
        VOL. 01 / PERSONAL EDITORIAL ARCHIVE
      </div>

      <div className="flex flex-col gap-8 max-w-3xl mt-8 md:mt-16">
        <h1 className="font-serif text-[clamp(80px,14vw,200px)] leading-[0.9] tracking-tight">
          After<span className="italic">line</span>
        </h1>
        <div className="font-serif text-2xl leading-snug max-w-lg">
          Lines that stayed after reading.
          <br />
          <span className="text-muted">읽고 난 뒤에도 남은 문장들.</span>
        </div>
      </div>

      {reading.length > 0 && (
        <section className="border-y border-line py-6">
          <div className="flex items-baseline justify-between mb-4">
            <div className="font-mono text-[10px] tracking-[0.3em] text-muted">
              NOW READING / 지금 읽는 중
            </div>
            <span className="font-mono text-[10px] tracking-[0.25em] text-muted">
              {String(reading.length).padStart(2, "0")} ACTIVE
            </span>
          </div>
          <div className="flex flex-wrap items-end gap-x-3 gap-y-6">
            {reading.map((r) => {
              const since = fmtDate(r.started_at);
              return (
                <div key={r.source.id} className="flex flex-col items-center gap-2">
                  <SourceSpine source={r.source} lines={r.lines} />
                  {since && (
                    <div className="font-mono text-[9px] tracking-[0.2em] text-muted">
                      SINCE {since}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {onThisDay.length > 0 && (
        <section className="border-y border-line py-6">
          <div className="flex items-baseline justify-between mb-5">
            <div className="font-mono text-[10px] tracking-[0.3em] text-muted">
              ON THIS DAY / 같은 날의 기록
            </div>
            <span className="font-mono text-[10px] tracking-[0.25em] text-muted">
              {String(onThisDay.length).padStart(2, "0")} ENTRIES
            </span>
          </div>
          <ol className="flex flex-col gap-6">
            {onThisDay.slice(0, 4).map((q) => (
              <li key={q.id} className="grid grid-cols-[60px_1fr] gap-6">
                <div className="font-mono text-[11px] tracking-[0.2em] text-muted pt-1">
                  {yearOf(q.created_at)}
                </div>
                <PastQuoteBody q={q} />
              </li>
            ))}
          </ol>
        </section>
      )}

      <RandomQuotePanel pool={pool} />

      {rediscovered && (
        <section className="border-y border-line py-6">
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-4">
            REDISCOVER / 잊혔던 한 줄
          </div>
          <PastQuoteBody q={rediscovered} large />
          <div className="font-mono text-[9px] tracking-[0.25em] text-muted mt-4">
            COLLECTED {fmtDate(rediscovered.created_at)}
            {rediscovered.is_favorite && " · ★ FAVORITE"}
          </div>
        </section>
      )}

      <div className="flex items-end justify-between">
        <Link
          href="/rooms"
          className="font-mono text-xs tracking-[0.3em] border border-ink px-6 py-4 hover:bg-ink hover:text-paper transition-colors"
        >
          [ ENTER ARCHIVE ]
        </Link>
        <div className="font-mono text-[10px] tracking-[0.2em] text-muted text-right leading-relaxed">
          A PRIVATE ARCHIVE
          <br />
          OF LINES THAT STAYED
          <br />
          AFTER READING, LISTENING,
          <br />
          AND LIVING.
        </div>
      </div>
    </section>
  );
}

function PastQuoteBody({ q, large = false }: { q: PastLine; large?: boolean }) {
  return (
    <div>
      <p
        className={`font-serif ${
          large ? "text-3xl md:text-4xl" : "text-xl"
        } leading-snug whitespace-pre-line`}
      >
        &ldquo;{q.text}&rdquo;
      </p>
      {(q.source_title || q.source_id) && (
        <div className="mt-3 font-mono text-[10px] tracking-[0.25em] text-muted">
          {q.source_id ? (
            <Link href={`/sources/${q.source_id}`} className="hover:text-ink">
              {q.source_title}
              {q.source_creator ? ` — ${q.source_creator}` : ""}
            </Link>
          ) : (
            <>
              {q.source_title}
              {q.source_creator ? ` — ${q.source_creator}` : ""}
            </>
          )}
        </div>
      )}
    </div>
  );
}
