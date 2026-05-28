"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RandomLine } from "@/lib/data/repository";

export function RandomQuotePanel({ pool }: { pool: RandomLine[] }) {
  // Start at 0 to avoid hydration mismatch, then pick a random index after
  // mount so the line you see actually changes on every full reload.
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (pool.length > 1) {
      setIndex(Math.floor(Math.random() * pool.length));
    }
  }, [pool.length]);

  if (pool.length === 0) {
    return (
      <div className="border-y border-line py-6 my-12">
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted">
          TODAY&apos;S LINE / 오늘의 한 줄
        </div>
        <p className="font-serif text-xl text-muted mt-3">
          아직 수집된 문장이 없어요. 첫 문장을 더해보세요.
        </p>
        <Link
          href="/quotes/new"
          className="inline-block mt-4 font-mono text-[10px] tracking-[0.3em] border border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors"
        >
          + NEW LINE
        </Link>
      </div>
    );
  }

  const line = pool[index];

  function shuffle() {
    if (pool.length <= 1) return;
    let next = index;
    // Keep picking until we land on a different index.
    let attempts = 0;
    while (next === index && attempts < 10) {
      next = Math.floor(Math.random() * pool.length);
      attempts++;
    }
    setIndex(next);
  }

  return (
    <div className="border-y border-line py-8 my-12">
      <div className="flex items-baseline justify-between mb-4">
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted">
          TODAY&apos;S LINE / 오늘의 한 줄
        </div>
        <div className="flex items-center gap-3">
          {line.is_favorite && (
            <span className="font-mono text-[10px] tracking-[0.25em] text-red">
              ★
            </span>
          )}
          <button
            type="button"
            onClick={shuffle}
            className="font-mono text-[10px] tracking-[0.3em] text-muted hover:text-ink transition-colors"
            aria-label="Shuffle today's line"
          >
            ⇄ SHUFFLE
          </button>
        </div>
      </div>

      <blockquote className="font-serif text-[clamp(20px,2.6vw,32px)] leading-snug max-w-3xl whitespace-pre-line">
        {line.text}
      </blockquote>

      <div className="mt-5 flex items-baseline justify-between flex-wrap gap-3">
        <div className="flex items-baseline gap-3 font-mono text-[10px] tracking-[0.25em] text-muted">
          {line.source_title && (
            <span className="text-ink">— {line.source_title}</span>
          )}
          {line.source_creator && <span>· {line.source_creator}</span>}
          {line.page && <span>· p. {line.page}</span>}
        </div>
        {line.source_id && (
          <Link
            href={`/sources/${line.source_id}`}
            className="font-mono text-[10px] tracking-[0.3em] text-muted hover:text-ink"
          >
            OPEN →
          </Link>
        )}
      </div>

      {line.mood_tags.length > 0 && (
        <div className="mt-3 flex gap-1.5 flex-wrap">
          {line.mood_tags.map((t) => (
            <Link
              key={t}
              href={`/mood/${encodeURIComponent(t)}`}
              className="font-mono text-[9px] tracking-[0.25em] border border-line px-2 py-0.5 hover:border-ink hover:bg-ink hover:text-paper transition-colors"
            >
              {t}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
