"use client";

import { useState } from "react";

type Status = "idle" | "saving" | "saved" | "error";

export function EmbedAddForm({
  token,
  defaultTitle,
}: {
  token: string;
  defaultTitle: string;
}) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState(defaultTitle);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function submit() {
    if (!text.trim() || status === "saving") return;
    setStatus("saving");
    setError("");
    try {
      const res = await fetch("/api/quick-add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text,
          page_title: title.trim() || "Quick Notes",
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || `HTTP ${res.status}`);
        setStatus("error");
        return;
      }
      setStatus("saved");
      setText("");
      setTimeout(() => {
        setStatus("idle");
        setError("");
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Cmd/Ctrl + Enter submits.
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  return (
    <main className="min-h-screen flex flex-col p-5 bg-paper text-ink">
      <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-3">
        AFTERLINE / QUICK ADD
      </div>

      <label className="font-mono text-[9px] tracking-[0.3em] text-muted mb-1 block">
        INBOX TITLE
      </label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Quick Notes"
        className="font-serif text-base border-b border-line py-1.5 mb-4 bg-transparent focus:outline-none focus:border-ink"
      />

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="문장을 적어주세요…  ⌘/Ctrl + Enter 로 저장"
        rows={5}
        className="font-serif text-lg leading-snug bg-paper border border-ink p-3 focus:outline-none focus:border-blue resize-none flex-1 min-h-[140px]"
      />

      <div className="flex items-center justify-between mt-3 gap-3">
        <span
          className={`font-mono text-[10px] tracking-[0.2em] ${
            status === "saved"
              ? "text-green"
              : status === "error"
                ? "text-red"
                : "text-muted"
          }`}
        >
          {status === "saved"
            ? "SAVED ✓"
            : status === "saving"
              ? "SAVING…"
              : status === "error"
                ? `✕ ${error}`
                : ""}
        </span>
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim() || status === "saving"}
          className="font-mono text-[10px] tracking-[0.3em] border border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
        >
          [ SAVE ]
        </button>
      </div>
    </main>
  );
}
