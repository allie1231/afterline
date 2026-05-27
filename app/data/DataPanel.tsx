"use client";

import { useState, useTransition } from "react";
import Papa from "papaparse";
import { ROOM_CATEGORIES } from "@/lib/data/categories";
import type { SourceType } from "@/lib/data/types";
import {
  runImportAction,
  type ImportResult,
  type ImportRow,
} from "./actions";

// ─────────────────────────────────────────────────────────────────────
// Field mapping config
// ─────────────────────────────────────────────────────────────────────
const FIELD_OPTIONS: { value: keyof ImportRow | ""; label: string }[] = [
  { value: "", label: "— 무시" },
  { value: "text", label: "Quote text *" },
  { value: "source_title", label: "Source title *" },
  { value: "source_type", label: "Source type (book/article/...)" },
  { value: "creator", label: "Author / 저자" },
  { value: "page", label: "Page / 위치" },
  { value: "url", label: "URL" },
  { value: "note", label: "Note / 메모" },
  { value: "mood_tags", label: "Tags / 태그 (;, 구분)" },
  { value: "is_favorite", label: "Favorite / 즐겨찾기" },
  { value: "created_at", label: "Created date / 등록일" },
];

function guessField(header: string): keyof ImportRow | "" {
  const h = header.toLowerCase().trim();
  if (/(^|\W)(text|quote|content|line|문장|인용)/.test(h)) return "text";
  if (/source.?title|book.?title|^title$|제목/.test(h)) return "source_title";
  if (/source.?type|^type$|category|유형|종류/.test(h)) return "source_type";
  if (/author|creator|by\b|저자|아티스트|감독|writer/.test(h)) return "creator";
  if (/^page$|위치|페이지|location|회차|episode/.test(h)) return "page";
  if (/^url$|link|링크/.test(h)) return "url";
  if (/note|memo|메모|comment|코멘트/.test(h)) return "note";
  if (/tag|mood|태그|무드|keyword/.test(h)) return "mood_tags";
  if (/favorite|favourite|즐겨/.test(h)) return "is_favorite";
  if (/date|created|날짜|등록일/.test(h)) return "created_at";
  return "";
}

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────
type CsvData = {
  headers: string[];
  rows: Record<string, string>[];
};

export function DataPanel({
  existingDupeKeys,
}: {
  existingDupeKeys: string[];
}) {
  const dupeSet = new Set(existingDupeKeys);

  const [csv, setCsv] = useState<CsvData | null>(null);
  const [mapping, setMapping] = useState<
    Record<string, keyof ImportRow | "">
  >({});
  const [defaultType, setDefaultType] = useState<SourceType>("book");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);

  function parseFile(file: File) {
    setResult(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = (results.meta.fields ?? []).filter(
          (h) => h && h.trim().length > 0,
        );
        const initial: Record<string, keyof ImportRow | ""> = {};
        for (const h of headers) initial[h] = guessField(h);
        setCsv({ headers, rows: results.data });
        setMapping(initial);
      },
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  }

  function reset() {
    setCsv(null);
    setMapping({});
    setResult(null);
  }

  // Build mapped rows
  const mappedRows: ImportRow[] = (csv?.rows ?? []).map((raw) => {
    const r: ImportRow = {};
    for (const [csvHeader, field] of Object.entries(mapping)) {
      if (!field) continue;
      r[field] = raw[csvHeader] ?? "";
    }
    return r;
  });

  function dupeKeyOf(r: ImportRow): string {
    const t = (r.source_type ?? "").toLowerCase().trim();
    const validType = [
      "book",
      "article",
      "lyrics",
      "movie",
      "conversation",
      "other",
    ].includes(t)
      ? t
      : defaultType;
    return `${validType}|${(r.source_title ?? "").trim()}||${(r.text ?? "").trim()}`;
  }

  // Validate & classify
  type RowStatus =
    | { kind: "new" }
    | { kind: "dupe" }
    | { kind: "error"; reason: string };

  function classify(r: ImportRow): RowStatus {
    if (!(r.text ?? "").trim())
      return { kind: "error", reason: "문장 비어있음" };
    if (!(r.source_title ?? "").trim())
      return { kind: "error", reason: "출처 비어있음" };
    if (dupeSet.has(dupeKeyOf(r))) return { kind: "dupe" };
    return { kind: "new" };
  }

  const classifications = mappedRows.map(classify);
  const counts = classifications.reduce(
    (acc, c) => {
      acc[c.kind] = (acc[c.kind] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  function doImport() {
    startTransition(async () => {
      const res = await runImportAction(mappedRows, defaultType);
      setResult(res);
    });
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-16">
      {/* EXPORT */}
      <section>
        <h2 className="font-serif text-2xl tracking-tight border-b border-ink pb-3 mb-6">
          <span className="font-mono text-[10px] tracking-[0.3em] text-muted mr-3">
            01
          </span>
          EXPORT / 내보내기
        </h2>
        <p className="font-serif text-lg text-muted mb-6 max-w-lg">
          지금까지 모은 모든 문장을 CSV 한 파일로 받습니다. Excel, Google Sheets,
          Notion 어디든 열 수 있어요.
        </p>
        <div className="flex gap-3 flex-wrap">
          <a
            href="/api/export/csv"
            className="font-mono text-xs tracking-[0.3em] border border-ink px-6 py-4 hover:bg-ink hover:text-paper transition-colors"
          >
            [ DOWNLOAD ALL / 전체 받기 ]
          </a>
          <a
            href="/api/export/template"
            className="font-mono text-xs tracking-[0.3em] border border-line text-muted px-6 py-4 hover:border-ink hover:text-ink transition-colors"
          >
            [ TEMPLATE / 양식 받기 ]
          </a>
        </div>
      </section>

      {/* IMPORT */}
      <section>
        <h2 className="font-serif text-2xl tracking-tight border-b border-ink pb-3 mb-6">
          <span className="font-mono text-[10px] tracking-[0.3em] text-muted mr-3">
            02
          </span>
          IMPORT / 가져오기
        </h2>
        <p className="font-serif text-lg text-muted mb-6 max-w-xl">
          Notion, 메모 앱, Google Sheets 어디서든 CSV 로 내보낸 파일을 끌어다
          놓으면 — 컬럼을 Afterline 필드에 매핑하고 한 번에 가져옵니다.
          중복(같은 문장 + 같은 출처)은 자동으로 건너뜁니다.
        </p>

        {!csv && !result && (
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center border-2 border-dashed py-16 cursor-pointer transition-colors ${
              dragOver
                ? "border-ink bg-line/30"
                : "border-line hover:border-ink"
            }`}
          >
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileInput}
              className="sr-only"
            />
            <div className="font-mono text-xs tracking-[0.3em] text-muted">
              DROP CSV HERE
            </div>
            <div className="font-serif text-2xl text-ink mt-3">
              CSV 파일을 끌어다 놓거나 클릭
            </div>
            <div className="font-mono text-[10px] tracking-[0.25em] text-muted mt-3">
              Notion → Export → Markdown & CSV
            </div>
          </label>
        )}

        {csv && !result && (
          <div className="flex flex-col gap-8">
            {/* Default room/type */}
            <div>
              <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-2">
                DEFAULT TYPE / 기본 출처 유형
              </div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-muted mb-3">
                CSV 에 source_type 컬럼이 없거나 비어 있는 행은 이 유형으로 들어갑니다.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-ink border border-ink">
                {ROOM_CATEGORIES.map((cat) => {
                  const active = defaultType === cat.type;
                  return (
                    <button
                      type="button"
                      key={cat.type}
                      onClick={() => setDefaultType(cat.type)}
                      className="p-3 text-left transition-colors"
                      style={{
                        background: active ? cat.accent : "var(--paper)",
                        color: active
                          ? cat.contrast === "dark"
                            ? "var(--white)"
                            : "var(--ink)"
                          : "var(--ink)",
                      }}
                    >
                      <div className="font-serif text-base leading-none tracking-tight">
                        {cat.en}
                      </div>
                      <div className="font-mono text-[9px] tracking-[0.25em] mt-1 opacity-70">
                        {cat.ko}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-3">
                MAP COLUMNS / 컬럼 매핑 — CSV {csv.rows.length}행 감지됨
              </div>
              <div className="border border-ink divide-y divide-line">
                {csv.headers.map((h) => {
                  const examples = csv.rows
                    .slice(0, 3)
                    .map((r) => r[h])
                    .filter((v) => v && v.length > 0);
                  return (
                    <div
                      key={h}
                      className="grid grid-cols-[1fr_1fr_2fr] gap-4 items-center px-4 py-3"
                    >
                      <div className="font-serif text-base truncate" title={h}>
                        {h}
                      </div>
                      <select
                        value={mapping[h] ?? ""}
                        onChange={(e) =>
                          setMapping((m) => ({
                            ...m,
                            [h]: e.target.value as keyof ImportRow | "",
                          }))
                        }
                        className="border border-ink bg-paper px-3 py-2 font-mono text-xs tracking-[0.15em] focus:outline-none focus:border-blue"
                      >
                        {FIELD_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="font-mono text-[10px] tracking-[0.15em] text-muted truncate">
                        {examples.length > 0
                          ? `예: ${examples.join(" / ").slice(0, 80)}`
                          : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Counts */}
            <div className="flex gap-6 font-mono text-xs tracking-[0.25em] border-y border-ink py-3">
              <span>
                NEW{" "}
                <span className="text-green ml-1">
                  {String(counts.new ?? 0).padStart(3, "0")}
                </span>
              </span>
              <span>
                DUPLICATES{" "}
                <span className="text-yellow ml-1">
                  {String(counts.dupe ?? 0).padStart(3, "0")}
                </span>
              </span>
              <span>
                ERRORS{" "}
                <span className="text-red ml-1">
                  {String(counts.error ?? 0).padStart(3, "0")}
                </span>
              </span>
            </div>

            {/* Preview */}
            <div>
              <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-3">
                PREVIEW / 미리보기 — 첫 10행
              </div>
              <div className="border border-ink overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-line/40 border-b border-ink">
                    <tr>
                      <th className="font-mono text-[10px] tracking-[0.25em] text-muted px-3 py-2 w-16">
                        #
                      </th>
                      <th className="font-mono text-[10px] tracking-[0.25em] text-muted px-3 py-2 w-20">
                        STATUS
                      </th>
                      <th className="font-mono text-[10px] tracking-[0.25em] text-muted px-3 py-2">
                        TEXT
                      </th>
                      <th className="font-mono text-[10px] tracking-[0.25em] text-muted px-3 py-2">
                        SOURCE
                      </th>
                      <th className="font-mono text-[10px] tracking-[0.25em] text-muted px-3 py-2">
                        TYPE
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {mappedRows.slice(0, 10).map((r, idx) => {
                      const c = classifications[idx];
                      return (
                        <tr key={idx}>
                          <td className="font-mono text-[10px] text-muted px-3 py-2">
                            {String(idx + 1).padStart(2, "0")}
                          </td>
                          <td className="px-3 py-2">
                            <StatusPill status={c} />
                          </td>
                          <td className="font-serif text-sm px-3 py-2 max-w-[400px] truncate">
                            {r.text || (
                              <span className="text-muted italic">—</span>
                            )}
                          </td>
                          <td className="font-serif text-sm px-3 py-2 truncate max-w-[200px]">
                            {r.source_title || (
                              <span className="text-muted italic">—</span>
                            )}
                          </td>
                          <td className="font-mono text-[10px] text-muted px-3 py-2">
                            {(() => {
                              const t = (r.source_type ?? "")
                                .toLowerCase()
                                .trim();
                              return [
                                "book",
                                "article",
                                "lyrics",
                                "movie",
                                "conversation",
                                "other",
                              ].includes(t)
                                ? t
                                : defaultType;
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-ink pt-5">
              <button
                type="button"
                onClick={reset}
                className="font-mono text-[10px] tracking-[0.3em] text-muted hover:text-ink"
              >
                ← CANCEL / 취소
              </button>
              <button
                type="button"
                onClick={doImport}
                disabled={pending || (counts.new ?? 0) === 0}
                className="font-mono text-xs tracking-[0.3em] border border-ink px-8 py-4 hover:bg-ink hover:text-paper transition-colors disabled:opacity-40"
              >
                [{" "}
                {pending
                  ? "IMPORTING…"
                  : `IMPORT ${counts.new ?? 0} QUOTES`}{" "}
                ]
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="border border-ink p-6">
            <div className="font-mono text-[10px] tracking-[0.3em] text-muted">
              IMPORT COMPLETE
            </div>
            <div className="font-serif text-3xl mt-2">
              {result.imported}개의 문장을 들였습니다.
            </div>
            <div className="font-mono text-xs tracking-[0.2em] text-muted mt-4 flex gap-6 flex-wrap">
              <span>NEW SOURCES {result.newSources}</span>
              <span>SKIPPED (DUPES) {result.skipped}</span>
              <span>ERRORS {result.errors.length}</span>
            </div>
            {result.errors.length > 0 && (
              <details className="mt-4">
                <summary className="font-mono text-[10px] tracking-[0.25em] text-muted cursor-pointer">
                  ERRORS ▼
                </summary>
                <ul className="font-mono text-xs mt-2 flex flex-col gap-1">
                  {result.errors.slice(0, 30).map((e, i) => (
                    <li key={i} className="text-red">
                      Row {e.row}: {e.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <div className="mt-6 flex gap-3">
              <a
                href="/rooms"
                className="font-mono text-xs tracking-[0.3em] border border-ink px-6 py-3 hover:bg-ink hover:text-paper transition-colors"
              >
                [ GO TO ROOMS / 방으로 ]
              </a>
              <button
                type="button"
                onClick={reset}
                className="font-mono text-xs tracking-[0.3em] text-muted hover:text-ink px-6 py-3"
              >
                IMPORT ANOTHER / 또 가져오기
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusPill({
  status,
}: {
  status:
    | { kind: "new" }
    | { kind: "dupe" }
    | { kind: "error"; reason: string };
}) {
  if (status.kind === "new") {
    return (
      <span className="font-mono text-[9px] tracking-[0.2em] border border-green text-green px-1.5 py-0.5">
        NEW
      </span>
    );
  }
  if (status.kind === "dupe") {
    return (
      <span
        className="font-mono text-[9px] tracking-[0.2em] border px-1.5 py-0.5"
        style={{ borderColor: "var(--yellow)", color: "var(--yellow)" }}
      >
        DUPE
      </span>
    );
  }
  return (
    <span
      className="font-mono text-[9px] tracking-[0.2em] border border-red text-red px-1.5 py-0.5"
      title={status.reason}
    >
      ERROR
    </span>
  );
}
