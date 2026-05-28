import Link from "next/link";
import { getRandomLinePool, getReadingPulse } from "@/lib/data/repository";
import { RandomQuotePanel } from "@/components/RandomQuotePanel";
import { SourceSpine } from "@/components/SourceSpine";

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return iso.slice(0, 10).replace(/-/g, ".");
}

export default async function EntrancePage() {
  const [pool, reading] = await Promise.all([
    getRandomLinePool(200),
    getReadingPulse(),
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

      <RandomQuotePanel pool={pool} />

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
