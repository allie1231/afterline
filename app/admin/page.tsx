"use client";

import { useState } from "react";

interface EnrichResult {
  title: string;
  id: string;
  filled: string[];
  skipped: boolean;
}

interface EnrichResponse {
  total_missing: number;
  processed: number;
  enriched: number;
  skipped: number;
  remaining: number;
  details: EnrichResult[];
}

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnrichResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runEnrich() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/enrich", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: EnrichResponse = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="px-6 py-10 max-w-3xl mx-auto">
      <h1 className="font-mono text-[11px] tracking-[0.25em] text-muted mb-2">
        ADMIN
      </h1>
      <h2 className="font-sans text-2xl tracking-tight mb-8">
        Book Data Enrichment
      </h2>

      <p className="text-sm text-muted mb-6">
        Notion 책장 DB에서 ISBN, 페이지수, 높이, 너비가 비어있는 책을
        Aladin API로 채웁니다. 한 번에 최대 30권씩 처리됩니다.
      </p>

      <button
        onClick={runEnrich}
        disabled={loading}
        className="font-mono text-[11px] tracking-[0.3em] border border-ink px-6 py-3 hover:bg-ink hover:text-paper transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "ENRICHING..." : "ENRICH 30 BOOKS"}
      </button>

      {error && (
        <div className="mt-6 p-4 border border-red text-red text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm font-mono">
            <div className="p-4 border border-line">
              <div className="text-muted text-[10px] tracking-[0.2em] mb-1">
                TOTAL MISSING
              </div>
              <div className="text-2xl">{result.total_missing}</div>
            </div>
            <div className="p-4 border border-line">
              <div className="text-muted text-[10px] tracking-[0.2em] mb-1">
                ENRICHED
              </div>
              <div className="text-2xl">{result.enriched}</div>
            </div>
            <div className="p-4 border border-line">
              <div className="text-muted text-[10px] tracking-[0.2em] mb-1">
                SKIPPED
              </div>
              <div className="text-2xl">{result.skipped}</div>
            </div>
            <div className="p-4 border border-line">
              <div className="text-muted text-[10px] tracking-[0.2em] mb-1">
                REMAINING
              </div>
              <div className="text-2xl">{result.remaining}</div>
            </div>
          </div>

          {result.details.length > 0 && (
            <div>
              <h3 className="font-mono text-[10px] tracking-[0.2em] text-muted mb-3">
                DETAILS
              </h3>
              <div className="divide-y divide-line text-sm">
                {result.details.map((d) => (
                  <div key={d.id} className="py-2 flex items-baseline gap-3">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 mt-1 ${
                        d.filled.length > 0 ? "bg-green" : "bg-line"
                      }`}
                    />
                    <div>
                      <span className="font-sans">{d.title}</span>
                      {d.filled.length > 0 && (
                        <span className="ml-2 font-mono text-[10px] text-green tracking-wider">
                          {d.filled.join(", ")}
                        </span>
                      )}
                      {d.skipped && (
                        <span className="ml-2 font-mono text-[10px] text-muted tracking-wider">
                          NOT FOUND
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.remaining > 0 && (
            <p className="text-sm text-muted">
              아직 {result.remaining}권이 남아있습니다. 버튼을 다시 눌러주세요.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
