"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSourceTextAction } from "@/app/sources/[id]/actions";
import {
  describeUploadError,
  uploadCover,
  MAX_COVER_BYTES,
} from "@/lib/storage";
import type { Source, SourceType } from "@/lib/data/types";
import {
  deriveLyricsGenre,
  deriveMovieGenre,
} from "@/lib/data/genre-derive";

// ── Normalized result type used by all three providers ──────────────
type CoverHit = {
  id: string;
  title: string;
  creator?: string;
  meta?: string; // year / album / publisher / etc.
  cover_url?: string;
  source: string; // "ALADIN" | "GOOGLE" | "TMDB" | "ITUNES"
  // Raw values used to auto-fill the source's text fields when USE is clicked.
  raw?: {
    title?: string;
    creator?: string;
    publisher?: string;
    published_date?: string;
    isbn?: string;
    genre?: string;
  };
};

async function fetchHits(
  type: SourceType,
  query: string,
): Promise<CoverHit[]> {
  if (!query.trim()) return [];

  if (type === "book") {
    const r = await fetch(
      `/api/books/search?q=${encodeURIComponent(query)}`,
    );
    if (!r.ok) return [];
    const data = (await r.json()) as {
      results?: Array<{
        id: string;
        title: string;
        creator?: string;
        publisher?: string;
        published_date?: string;
        isbn?: string;
        cover_url?: string;
        genre?: string;
        source: "aladin" | "google";
      }>;
    };
    return (data.results ?? []).map((b) => ({
      id: b.id,
      title: b.title,
      creator: b.creator,
      meta: [b.publisher, b.published_date, b.genre]
        .filter(Boolean)
        .join(" · "),
      cover_url: b.cover_url,
      source: b.source.toUpperCase(),
      raw: {
        title: b.title,
        creator: b.creator,
        publisher: b.publisher,
        published_date: b.published_date,
        isbn: b.isbn,
        genre: b.genre,
      },
    }));
  }

  if (type === "movie") {
    const key = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!key) return [];
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${key}&query=${encodeURIComponent(query)}&language=ko-KR&include_adult=false&page=1`;
    try {
      const r = await fetch(url);
      if (!r.ok) return [];
      const data = await r.json();
      const items = (data.results ?? []) as Array<{
        id: number;
        media_type: string;
        title?: string;
        name?: string;
        release_date?: string;
        first_air_date?: string;
        poster_path?: string | null;
        original_language?: string;
        genre_ids?: number[];
      }>;
      return items
        .filter((it) => it.media_type === "movie" || it.media_type === "tv")
        .filter((it) => it.poster_path)
        .map<CoverHit>((it) => {
          const title = (it.media_type === "movie" ? it.title : it.name) ?? "";
          const date =
            it.media_type === "movie" ? it.release_date : it.first_air_date;
          const year = date?.slice(0, 4);
          const genre = deriveMovieGenre({
            media_type: it.media_type as "movie" | "tv",
            original_language: it.original_language,
            genre_ids: it.genre_ids,
          });
          return {
            id: `${it.media_type}-${it.id}`,
            title,
            meta: [genre, year].filter(Boolean).join(" · "),
            cover_url: `https://image.tmdb.org/t/p/w500${it.poster_path}`,
            source: "TMDB",
            raw: { title, published_date: year, genre },
          };
        });
    } catch {
      return [];
    }
  }

  if (type === "lyrics") {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10`;
    try {
      const r = await fetch(url);
      if (!r.ok) return [];
      const data = await r.json();
      const items = (data.results ?? []) as Array<{
        trackId?: number;
        trackName?: string;
        artistName?: string;
        collectionName?: string;
        releaseDate?: string;
        artworkUrl100?: string;
        primaryGenreName?: string;
      }>;
      return items
        .filter((it) => it.trackName)
        .map<CoverHit>((it) => {
          const year = it.releaseDate?.slice(0, 4);
          const genre = deriveLyricsGenre(it.primaryGenreName);
          return {
            id: `itunes-${it.trackId ?? Math.random()}`,
            title: it.trackName ?? "",
            creator: it.artistName,
            meta: [it.collectionName, year, genre]
              .filter(Boolean)
              .join(" · "),
            cover_url: it.artworkUrl100?.replace(
              /\/[0-9]+x[0-9]+bb\./,
              "/600x600bb.",
            ),
            source: "ITUNES",
            raw: {
              title: it.trackName,
              creator: it.artistName,
              publisher: it.collectionName,
              published_date: year,
              genre,
            },
          };
        });
    } catch {
      return [];
    }
  }

  return [];
}

const PROVIDER_LABEL: Record<SourceType, string> = {
  book: "ALADIN + GOOGLE BOOKS",
  movie: "TMDB",
  lyrics: "ITUNES",
  article: "—",
  conversation: "—",
  other: "—",
};

const PLACEHOLDER: Record<SourceType, string> = {
  book: "책 제목, 저자, ISBN…",
  movie: "영화 / 드라마 제목…",
  lyrics: "곡 제목 또는 아티스트…",
  article: "검색…",
  conversation: "검색…",
  other: "검색…",
};

export function ChangeCoverDialog({
  source,
  onClose,
}: {
  source: Source;
  onClose: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"search" | "url" | "upload">("search");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CoverHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [urlInput, setUrlInput] = useState(source.cover_url ?? "");
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function doSearch() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      const results = await fetchHits(source.type, q);
      setHits(results);
    } finally {
      setSearching(false);
    }
  }

  function apply(coverUrl: string) {
    startTransition(async () => {
      await updateSourceTextAction(source.id, "cover_url", coverUrl);
      router.refresh();
      onClose();
    });
  }

  function applyHit(h: CoverHit) {
    if (!h.cover_url) return;
    startTransition(async () => {
      const updates: Array<Promise<void>> = [
        updateSourceTextAction(source.id, "cover_url", h.cover_url!),
      ];
      const raw = h.raw ?? {};
      // Only overwrite fields we got values for — never blank out existing data.
      if (raw.title?.trim())
        updates.push(updateSourceTextAction(source.id, "title", raw.title));
      if (raw.creator?.trim())
        updates.push(updateSourceTextAction(source.id, "creator", raw.creator));
      if (raw.publisher?.trim())
        updates.push(
          updateSourceTextAction(source.id, "publisher", raw.publisher),
        );
      if (raw.published_date?.trim())
        updates.push(
          updateSourceTextAction(
            source.id,
            "published_date",
            raw.published_date,
          ),
        );
      if (raw.isbn?.trim())
        updates.push(updateSourceTextAction(source.id, "isbn", raw.isbn));
      if (raw.genre?.trim())
        updates.push(updateSourceTextAction(source.id, "genre", raw.genre));
      await Promise.all(updates);
      router.refresh();
      onClose();
    });
  }

  function clearCover() {
    if (!confirm("이 출처의 표지를 비울까요?")) return;
    startTransition(async () => {
      await updateSourceTextAction(source.id, "cover_url", "");
      router.refresh();
      onClose();
    });
  }

  async function handleFiles(files: FileList | null) {
    setUploadError(null);
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploading(true);
    try {
      const result = await uploadCover(file);
      if ("kind" in result) {
        setUploadError(describeUploadError(result));
        return;
      }
      apply(result.url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-ink/55"
        onClick={onClose}
        aria-hidden
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(640px,92vw)] max-h-[88vh] overflow-y-auto bg-paper border border-ink shadow-[6px_6px_0_var(--ink)]"
      >
        <header className="flex items-center justify-between border-b border-ink px-5 py-3">
          <div className="font-mono text-[10px] tracking-[0.3em]">
            CHANGE COVER / 표지 변경
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-base leading-none text-muted hover:text-ink"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="px-5 pt-4">
          <div className="font-serif text-xl leading-tight">{source.title}</div>
          {source.creator && (
            <div className="font-mono text-[10px] tracking-[0.2em] text-muted mt-1">
              {source.creator}
            </div>
          )}
        </div>

        {/* Mode tabs */}
        <div className="px-5 mt-4 flex border-b border-ink">
          <TabButton active={mode === "search"} onClick={() => setMode("search")}>
            SEARCH / 검색
          </TabButton>
          <TabButton active={mode === "upload"} onClick={() => setMode("upload")}>
            UPLOAD / 업로드
          </TabButton>
          <TabButton active={mode === "url"} onClick={() => setMode("url")}>
            URL / 주소
          </TabButton>
        </div>

        <div className="p-5">
          {mode === "search" ? (
            <>
              <div className="font-mono text-[9px] tracking-[0.3em] text-muted mb-2">
                {PROVIDER_LABEL[source.type]}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      doSearch();
                    }
                  }}
                  placeholder={PLACEHOLDER[source.type]}
                  className="flex-1 border border-ink bg-paper px-3 py-2 font-serif text-base focus:outline-none focus:border-blue"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={doSearch}
                  disabled={searching}
                  className="font-mono text-[10px] tracking-[0.3em] border border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
                >
                  {searching ? "..." : "SEARCH"}
                </button>
              </div>

              {hits.length > 0 && (
                <div className="mt-3 flex flex-col gap-2 max-h-[360px] overflow-y-auto">
                  {hits.map((h) => (
                    <div
                      key={h.id}
                      className="flex gap-3 items-center border border-line p-2 hover:border-ink transition-colors"
                    >
                      {h.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={h.cover_url}
                          alt=""
                          className="w-12 h-[72px] object-cover bg-ink shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-[72px] bg-line shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-serif text-base leading-tight truncate">
                          {h.title}
                        </div>
                        {h.creator && (
                          <div className="font-mono text-[10px] tracking-[0.2em] text-muted mt-1 truncate">
                            {h.creator}
                          </div>
                        )}
                        <div className="font-mono text-[9px] tracking-[0.2em] text-muted mt-0.5 truncate">
                          {h.meta && <span>{h.meta}</span>}
                          <span className="opacity-60 ml-2">· {h.source}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => applyHit(h)}
                        disabled={!h.cover_url || pending}
                        className="font-mono text-[10px] tracking-[0.3em] border border-ink px-3 py-2 hover:bg-ink hover:text-paper transition-colors shrink-0 disabled:opacity-40"
                      >
                        USE
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!searching && hits.length === 0 && query.trim().length > 0 && (
                <div className="font-mono text-xs text-muted text-center py-6">
                  NO RESULTS / 결과 없음
                </div>
              )}
            </>
          ) : mode === "upload" ? (
            <>
              <div className="font-mono text-[9px] tracking-[0.3em] text-muted mb-2">
                UPLOAD IMAGE / 이미지 파일 — 최대 5 MB
              </div>
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFiles(e.dataTransfer.files);
                }}
                className={`flex flex-col items-center justify-center border-2 border-dashed py-10 cursor-pointer transition-colors ${
                  dragOver
                    ? "border-ink bg-line/40"
                    : "border-line hover:border-ink"
                } ${uploading ? "opacity-60 pointer-events-none" : ""}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFiles(e.target.files)}
                  className="sr-only"
                  disabled={uploading}
                />
                <div className="font-mono text-[10px] tracking-[0.3em] text-muted">
                  {uploading ? "UPLOADING…" : "DROP IMAGE HERE / 끌어다 놓기"}
                </div>
                <div className="font-serif text-base text-ink mt-2">
                  {uploading ? "잠시만요…" : "또는 클릭해서 선택"}
                </div>
                <div className="font-mono text-[9px] tracking-[0.25em] text-muted mt-2">
                  JPG · PNG · WEBP · GIF
                </div>
              </label>
              {uploadError && (
                <div className="font-mono text-xs text-red mt-3">
                  {uploadError}
                </div>
              )}
              <p className="font-mono text-[9px] tracking-[0.25em] text-muted mt-4 leading-relaxed">
                ※ 업로드 즉시 해당 출처의 표지로 저장됩니다. 같은 다이얼로그에서
                CLEAR COVER 로 다시 비울 수 있어요.
              </p>
            </>
          ) : (
            <>
              <div className="font-mono text-[9px] tracking-[0.3em] text-muted mb-2">
                IMAGE URL / 이미지 주소
              </div>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://..."
                className="w-full border border-ink bg-paper px-3 py-2 font-serif text-base focus:outline-none focus:border-blue"
                autoFocus
              />
              {urlInput.trim() && (
                <div className="mt-3 flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={urlInput.trim()}
                    alt=""
                    className="w-20 h-28 object-cover bg-ink border border-line"
                  />
                  <div className="font-mono text-[10px] tracking-[0.2em] text-muted">
                    PREVIEW
                  </div>
                </div>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => apply(urlInput.trim())}
                  disabled={!urlInput.trim() || pending}
                  className="font-mono text-[10px] tracking-[0.3em] border border-ink px-5 py-2 hover:bg-ink hover:text-paper transition-colors disabled:opacity-40"
                >
                  {pending ? "..." : "APPLY"}
                </button>
              </div>
            </>
          )}
        </div>

        <footer className="border-t border-line px-5 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={clearCover}
            disabled={pending || !source.cover_url}
            className="font-mono text-[10px] tracking-[0.3em] text-muted hover:text-red transition-colors disabled:opacity-40"
          >
            × CLEAR COVER
          </button>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[10px] tracking-[0.3em] text-muted hover:text-ink"
          >
            CANCEL
          </button>
        </footer>
      </div>
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-mono text-xs tracking-[0.25em] px-4 py-2 border-b-2 -mb-px transition-colors cursor-pointer ${
        active
          ? "border-ink"
          : "border-transparent text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
