"use client";

import { useRef, useState } from "react";
// modern-screenshot is the actively maintained fork of html-to-image that
// fixes the SVG/foreignObject quirks (Korean text, custom fonts, off-canvas
// layout) that were dropping our quote text out of the captured PNG.
import { domToPng } from "modern-screenshot";
import type { Quote, Source } from "@/lib/data/types";

const PAPER = "#f5f1e8";
const INK = "#111111";
const MUTED = "#8a857a";
const LINE = "#d9d3c5";

const SERIF = '"Cormorant Garamond", Georgia, "Times New Roman", serif';
const MONO = '"IBM Plex Mono", ui-monospace, "SFMono-Regular", monospace';

export function SaveQuoteButton({
  quote,
  source,
}: {
  quote: Quote;
  source: Source;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const fileName = `afterline-${source.title}-${quote.id.slice(-6)}`.replace(
    /[^\w가-힣.-]+/g,
    "_",
  );

  async function render(): Promise<string> {
    const el = cardRef.current;
    if (!el) throw new Error("card not ready");
    if (typeof document !== "undefined" && document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        /* ignore */
      }
    }
    // Bring the capture target fully into the viewport (invisible via
    // opacity:0) so layout is real. Off-canvas (left:-10000) can confuse
    // some screenshot libraries about the element's dimensions.
    const prev = {
      left: el.style.left,
      top: el.style.top,
      opacity: el.style.opacity,
      zIndex: el.style.zIndex,
      pointerEvents: el.style.pointerEvents,
    };
    el.style.left = "0px";
    el.style.top = "0px";
    el.style.opacity = "0";
    el.style.zIndex = "-1";
    el.style.pointerEvents = "none";
    try {
      return await domToPng(el, {
        scale: 2,
        backgroundColor: PAPER,
        // Skip remote font embedding — we supply system font fallbacks
        // inline on every text node.
        font: false,
      });
    } finally {
      el.style.left = prev.left;
      el.style.top = prev.top;
      el.style.opacity = prev.opacity;
      el.style.zIndex = prev.zIndex;
      el.style.pointerEvents = prev.pointerEvents;
    }
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
    setErr("");
    try {
      const dataUrl = await render();
      triggerDownload(dataUrl);
    } catch (e) {
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
      setErr(e instanceof Error ? e.message : "공유에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Off-screen capture target with every visual attribute set inline so
          serialization never depends on Tailwind utility resolution. */}
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
        <div
          style={{
            background: PAPER,
            color: INK,
            padding: 48,
            border: `1px solid ${INK}`,
            fontFamily: SERIF,
            boxSizing: "border-box",
            width: 640,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: "0.3em",
              color: MUTED,
              marginBottom: 40,
            }}
          >
            AFTERLINE / {source.type.toUpperCase()}
          </div>
          <blockquote
            style={{
              fontFamily: SERIF,
              fontSize: 38,
              lineHeight: 1.25,
              color: INK,
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "keep-all",
            }}
          >
            {quote.text}
          </blockquote>
          <div
            style={{
              marginTop: 40,
              paddingTop: 24,
              borderTop: `1px solid ${LINE}`,
            }}
          >
            <div style={{ fontFamily: SERIF, fontSize: 18, color: INK }}>
              {source.title}
            </div>
            {source.creator && (
              <div
                style={{
                  fontFamily: SERIF,
                  fontSize: 16,
                  color: MUTED,
                  marginTop: 4,
                }}
              >
                — {source.creator}
              </div>
            )}
            {quote.mood_tags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 16,
                }}
              >
                {quote.mood_tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontFamily: MONO,
                      fontSize: 9,
                      letterSpacing: "0.2em",
                      border: `1px solid ${INK}`,
                      padding: "2px 8px",
                      color: INK,
                    }}
                  >
                    #{t.toUpperCase()}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div
            style={{
              marginTop: 48,
              fontFamily: MONO,
              fontSize: 9,
              letterSpacing: "0.3em",
              color: MUTED,
            }}
          >
            AFTERLINE — LINES THAT STAYED
          </div>
        </div>
      </div>

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
    </>
  );
}
