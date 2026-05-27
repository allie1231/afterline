"use client";

import { useState, useTransition } from "react";
import { setRatingAction } from "@/app/sources/[id]/actions";

export function StarRating({
  sourceId,
  initialRating,
}: {
  sourceId: string;
  initialRating: number | null | undefined;
}) {
  const [rating, setRating] = useState<number>(initialRating ?? 0);
  const [hover, setHover] = useState<number>(0);
  const [pending, startTransition] = useTransition();

  const display = hover || rating;

  function handleClick(value: number) {
    // Click the same star → clear it
    const next = value === rating ? 0 : value;
    setRating(next);
    startTransition(async () => {
      await setRatingAction(sourceId, next === 0 ? null : next);
    });
  }

  return (
    <div>
      <div className="font-mono text-[9px] tracking-[0.3em] text-muted">
        RATING / 평점
      </div>
      <div
        className="flex gap-0.5 mt-1 items-center"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const active = n <= display;
          return (
            <button
              key={n}
              type="button"
              onClick={() => handleClick(n)}
              onMouseEnter={() => setHover(n)}
              disabled={pending}
              aria-label={`Rate ${n} stars`}
              className="text-xl leading-none cursor-pointer transition-transform hover:scale-110 disabled:opacity-50"
              style={{
                color: active ? "var(--red)" : "var(--line)",
              }}
            >
              ★
            </button>
          );
        })}
        {rating > 0 && (
          <button
            type="button"
            onClick={() => handleClick(rating)}
            disabled={pending}
            className="text-base leading-none text-muted ml-1.5 hover:text-ink cursor-pointer disabled:opacity-50"
            aria-label="Clear rating"
            title="Clear"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
