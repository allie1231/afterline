"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { Quote, Source } from "@/lib/data/types";

// Per-quote save / share. Renders a hidden Afterline-styled card off-screen
// and captures it on demand.
export function SaveQuoteButton({
  quote,
  source,
}: {
  quote: Quote;
  source: Source;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const fileName = `afterline-${source.title}-${quote.id.slice(-6)}`.replace(
    /[^\w가-힣.-]+/g,
    "_",
  );

  async function render(): Promise<string> {
    const el = cardRef.current;
    if (!el) throw new Error("card not ready");
    return await toPng(el, {
      pixelRatio: 2,
      backgroundColor: "#f5f1e8",
      cacheBust: true,
    });
  }

  function triggerDownload(dataUrl: string) {
    const a = document.createElement("a");
    a.download = `${fileName}.png`;
    a.href = dataUrl;
    a.click();
  }

  async function handleSave() {
    if (busy) return;
    setBusy(true);
    try {
      const dataUrl = await render();
      triggerDownload(dataUrl);
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    if (busy) return;
    setBusy(true);
    try {
      const dataUrl = await render();
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${fileName}.png`, { type: "image/png" });
      const nav = typeof navigator !== "undefined" ? navigator : null;
      if (nav?.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: source.title });
      } else {
        triggerDownload(dataUrl);
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Off-screen capture target. position:fixed + far left keeps it in the
          DOM with real layout while being invisible to the user. */}
      <div
        ref={cardRef}
        aria-hidden
        style={{
          position: "fixed",
          left: "-10000px",
          top: 0,
          width: 640,
          pointerEvents: "none",
        }}
      >
        <div className="bg-paper text-ink p-12 border border-ink">
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-10">
            AFTERLINE / {source.type.toUpperCase()}
          </div>
          <blockquote className="font-serif text-[38px] leading-[1.25] whitespace-pre-line">
            {quote.text}
          </blockquote>
          <div className="mt-10 pt-6 border-t border-line">
            <div className="font-serif text-lg">{source.title}</div>
            {source.creator && (
              <div className="font-serif text-base text-muted mt-1">
                — {source.creator}
              </div>
            )}
            {quote.mood_tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {quote.mood_tags.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-[9px] tracking-[0.2em] border border-ink px-2 py-0.5"
                  >
                    #{t.toUpperCase()}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="mt-12 font-mono text-[9px] tracking-[0.3em] text-muted">
            AFTERLINE — LINES THAT STAYED
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="font-mono text-[9px] tracking-[0.25em] text-muted hover:text-ink transition-colors disabled:opacity-50"
          title="이미지로 저장"
        >
          {busy ? "…" : "SAVE"}
        </button>
        <button
          type="button"
          onClick={handleShare}
          disabled={busy}
          className="font-mono text-[9px] tracking-[0.25em] text-muted hover:text-ink transition-colors disabled:opacity-50"
          title="공유"
        >
          {busy ? "…" : "SHARE"}
        </button>
      </div>
    </>
  );
}
