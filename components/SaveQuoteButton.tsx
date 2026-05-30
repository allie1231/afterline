"use client";

import { useState } from "react";
import { buildQuoteCardPng } from "@/lib/quote-card-image";
import type { Quote, Source } from "@/lib/data/types";

export function SaveQuoteButton({
  quote,
  source,
}: {
  quote: Quote;
  source: Source;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const fileName = `afterline-${source.title}-${quote.id.slice(-6)}`.replace(
    /[^\w가-힣.-]+/g,
    "_",
  );

  function triggerDownload(dataUrl: string) {
    const a = document.createElement("a");
    a.download = `${fileName}.png`;
    a.href = dataUrl;
    a.click();
  }

  async function handleSave() {
    if (busy) return;
    setBusy(true);
    setErr("");
    try {
      const dataUrl = await buildQuoteCardPng(quote, source);
      triggerDownload(dataUrl);
    } catch (e) {
      console.error(e);
      setErr(e instanceof Error ? e.message : "이미지를 만들지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    if (busy) return;
    setBusy(true);
    setErr("");
    try {
      const dataUrl = await buildQuoteCardPng(quote, source);
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
      console.error(e);
      setErr(e instanceof Error ? e.message : "공유에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
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
      {err && (
        <div className="font-mono text-[9px] text-red max-w-[260px] text-right">
          {err}
        </div>
      )}
    </div>
  );
}
