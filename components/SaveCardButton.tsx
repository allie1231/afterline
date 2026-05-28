"use client";

import { useState } from "react";
import { toPng } from "html-to-image";

export function SaveCardButton({
  targetId,
  fileName,
}: {
  targetId: string;
  fileName: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function render(): Promise<string> {
    const el = document.getElementById(targetId);
    if (!el) throw new Error("library card element not found");
    return await toPng(el, {
      pixelRatio: 2,
      backgroundColor: "#f5f1e8",
      cacheBust: true,
    });
  }

  function triggerDownload(dataUrl: string) {
    const link = document.createElement("a");
    link.download = `${fileName}.png`;
    link.href = dataUrl;
    link.click();
  }

  async function handleSave() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const dataUrl = await render();
      triggerDownload(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "이미지를 만들지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const dataUrl = await render();
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${fileName}.png`, { type: "image/png" });
      const nav = typeof navigator !== "undefined" ? navigator : null;
      if (nav?.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: fileName });
      } else {
        triggerDownload(dataUrl);
      }
    } catch (e) {
      // AbortError fires when the user cancels the system share sheet — ignore.
      if (e instanceof Error && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "공유에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="font-mono text-[10px] tracking-[0.3em] border border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
        >
          [ {busy ? "..." : "SAVE AS IMAGE"} ]
        </button>
        <button
          type="button"
          onClick={handleShare}
          disabled={busy}
          className="font-mono text-[10px] tracking-[0.3em] border border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
        >
          [ {busy ? "..." : "SHARE"} ]
        </button>
      </div>
      {error && (
        <div className="font-mono text-[10px] text-red">{error}</div>
      )}
    </div>
  );
}
