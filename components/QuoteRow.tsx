"use client";

import { SaveQuoteButton } from "./SaveQuoteButton";
import type { Quote, Source } from "@/lib/data/types";

export function QuoteRow({
  quote,
  index,
  source,
}: {
  quote: Quote;
  index: number;
  source: Source;
}) {
  return (
    <li className="group grid grid-cols-[40px_1fr] gap-6">
      <div className="font-mono text-[11px] tracking-[0.2em] text-muted pt-2">
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="min-w-0">
        <p className="font-sans text-base leading-relaxed whitespace-pre-line break-words">
          {quote.text}
        </p>
        {quote.page && (
          <div className="font-mono text-[11px] tracking-[0.25em] text-muted mt-2">
            p. {quote.page}
          </div>
        )}
        {quote.note && (
          <div className="mt-3">
            <div className="font-mono text-[11px] tracking-[0.2em] text-muted">
              memo
            </div>
            <p className="font-sans text-sm mt-1">{quote.note}</p>
          </div>
        )}
        {quote.mood_tags.length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {quote.mood_tags.map((m) => (
              <span
                key={m}
                className="font-mono text-[11px] tracking-[0.2em] border border-line px-2 py-0.5"
              >
                {m}
              </span>
            ))}
          </div>
        )}
        {quote.is_favorite && (
          <div className="mt-3 font-mono text-[11px] tracking-[0.25em] text-red">
            ★ FAVORITE
          </div>
        )}

        <div className="mt-3 hover-reveal">
          <SaveQuoteButton quote={quote} source={source} />
        </div>
      </div>
    </li>
  );
}
