"use client";

import { useMemo, useRef, useState } from "react";
import { createQuoteAction } from "@/app/quotes/new/actions";
import { ROOM_CATEGORIES } from "@/lib/data/categories";
import type { Source, SourceType } from "@/lib/data/types";

type BookHit = {
  id: string;
  title: string;
  creator?: string;
  publisher?: string;
  published_date?: string;
  isbn?: string;
  cover_url?: string;
  source: "aladin" | "google";
};

type Hit = {
  title: string;
  creator?: string;
  publisher?: string;
  published_date?: string;
  isbn?: string;
  cover_url?: string;
  genre?: string;
};

const SEARCHABLE: SourceType[] = ["book", "movie", "lyrics"];

async function search(type: SourceType, q: string): Promise<Hit[]> {
  if (!q.trim()) return [];
  if (type === "book") {
    const r = await fetch(`/api/books/search?q=${encodeURIComponent(q)}`);
    if (!r.ok) return [];
    const data = (await r.json()) as { results?: BookHit[] };
    return data.results ?? [];
  }
  if (type === "movie") {
    const key = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!key) return [];
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${key}&query=${encodeURIComponent(q)}&language=ko-KR&include_adult=false&page=1`;
    const r = await fetch(url);
    if (!r.ok) return [];
    const data = await r.json();
    const items = (data.results ?? []) as Array<{
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
      .map<Hit>((it) => {
        const title = (it.media_type === "movie" ? it.title : it.name) ?? "";
        const date =
          it.media_type === "movie" ? it.release_date : it.first_air_date;
        const ko = it.original_language === "ko";
        const isAnim = (it.genre_ids ?? []).includes(16);
        const genre = isAnim
          ? "애니메이션"
          : it.media_type === "tv"
            ? ko
              ? "한국드라마"
              : "외국드라마"
            : ko
              ? "한국영화"
              : "외국영화";
        return {
          title,
          published_date: date?.slice(0, 4),
          cover_url: `https://image.tmdb.org/t/p/w500${it.poster_path}`,
          genre,
        };
      });
  }
  if (type === "lyrics") {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=10`;
    const r = await fetch(url);
    if (!r.ok) return [];
    const data = await r.json();
    const items = (data.results ?? []) as Array<{
      trackName?: string;
      artistName?: string;
      collectionName?: string;
      releaseDate?: string;
      artworkUrl100?: string;
      primaryGenreName?: string;
    }>;
    return items
      .filter((it) => it.trackName)
      .map<Hit>((it) => ({
        title: it.trackName ?? "",
        creator: it.artistName,
        publisher: it.collectionName,
        published_date: it.releaseDate?.slice(0, 4),
        cover_url: it.artworkUrl100?.replace(
          /\/[0-9]+x[0-9]+bb\./,
          "/600x600bb.",
        ),
        genre: it.primaryGenreName?.trim() || undefined,
      }));
  }
  return [];
}

export function CaptureForm({
  existingSources,
  defaultText = "",
  defaultTitle = "",
}: {
  existingSources: Source[];
  defaultText?: string;
  defaultTitle?: string;
}) {
  const [type, setType] = useState<SourceType>("book");
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [text, setText] = useState(defaultText);
  const [title, setTitle] = useState(defaultTitle);
  const [creator, setCreator] = useState("");
  const [publisher, setPublisher] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [isbn, setIsbn] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [genre, setGenre] = useState("");
  const [existingId, setExistingId] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [searching, setSearching] = useState(false);

  const sourcesOfType = useMemo(
    () => existingSources.filter((s) => s.type === type),
    [existingSources, type],
  );

  async function doSearch() {
    setSearching(true);
    try {
      const r = await search(type, searchQ);
      setHits(r);
    } finally {
      setSearching(false);
    }
  }

  function useHit(h: Hit) {
    setTitle(h.title);
    if (h.creator) setCreator(h.creator);
    if (h.publisher) setPublisher(h.publisher);
    if (h.published_date) setPublishedDate(h.published_date);
    if (h.isbn) setIsbn(h.isbn);
    if (h.cover_url) setCoverUrl(h.cover_url);
    if (h.genre) setGenre(h.genre);
    setHits([]);
  }

  async function pasteFromClipboard() {
    try {
      const v = await navigator.clipboard.readText();
      if (v) setText((prev) => (prev ? prev + "\n" + v : v));
    } catch {
      alert("클립보드 접근이 막혔어요. 직접 붙여넣기를 사용해 주세요.");
    }
  }

  // ── Photo OCR (Tesseract.js, dynamic-imported on first use) ─────────
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const [ocring, setOcring] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);

  async function handleOcr(file: File) {
    setOcring(true);
    setOcrProgress(0);
    try {
      // Dynamic import — Tesseract is heavy (~2 MB). Only loaded when the
      // user actually presses the photo button.
      const Tesseract = (await import("tesseract.js")).default;
      const { data } = await Tesseract.recognize(file, "kor+eng", {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });
      const cleaned = (data.text ?? "")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      if (cleaned) {
        setText((prev) => (prev ? `${prev}\n\n${cleaned}` : cleaned));
      } else {
        alert("이미지에서 글자를 읽지 못했어요. 더 또렷한 사진으로 시도해 보세요.");
      }
    } catch (e) {
      console.error(e);
      alert("OCR 실패. 다시 시도하거나 직접 입력해 주세요.");
    } finally {
      setOcring(false);
      setOcrProgress(0);
      if (ocrInputRef.current) ocrInputRef.current.value = "";
    }
  }

  return (
    <form action={createQuoteAction} className="flex flex-col gap-5">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="spine_color" value="auto" />

      {/* THE LINE — pulled to top for thumb-reach */}
      <div>
        <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
          <span className="font-mono text-[10px] tracking-[0.3em]">
            LINE / 문장 *
          </span>
          <div className="flex items-center gap-1.5">
            <input
              ref={ocrInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleOcr(f);
              }}
              className="sr-only"
              disabled={ocring}
            />
            <button
              type="button"
              onClick={() => ocrInputRef.current?.click()}
              disabled={ocring}
              className="font-mono text-[10px] tracking-[0.3em] border border-ink px-2 py-1 hover:bg-ink hover:text-paper transition-colors disabled:opacity-60"
              title="책 페이지를 찍으면 글자를 읽어요 (한 · 영)"
            >
              {ocring ? `OCR ${ocrProgress}%` : "📷 PHOTO"}
            </button>
            <button
              type="button"
              onClick={pasteFromClipboard}
              className="font-mono text-[10px] tracking-[0.3em] border border-ink px-2 py-1 hover:bg-ink hover:text-paper transition-colors"
            >
              📋 PASTE
            </button>
          </div>
        </div>
        <textarea
          name="text"
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="기억하고 싶은 문장을 붙여넣거나 입력하세요."
          className="w-full border border-ink bg-paper px-3 py-3 font-serif text-lg leading-snug focus:outline-none focus:border-blue resize-y min-h-[140px]"
        />
      </div>

      {/* TYPE */}
      <div>
        <div className="font-mono text-[10px] tracking-[0.3em] mb-1.5">
          TYPE / 종류
        </div>
        <div className="grid grid-cols-3 gap-px bg-ink border border-ink">
          {ROOM_CATEGORIES.map((cat) => {
            const active = type === cat.type;
            return (
              <button
                type="button"
                key={cat.type}
                onClick={() => {
                  setType(cat.type);
                  setHits([]);
                  if (existingSources.filter((s) => s.type === cat.type).length === 0) {
                    setMode("new");
                  }
                }}
                className="p-2.5 text-left"
                style={{
                  background: active ? cat.accent : "var(--paper)",
                  color: active
                    ? cat.contrast === "dark"
                      ? "var(--white)"
                      : "var(--ink)"
                    : "var(--ink)",
                }}
              >
                <div className="font-serif text-sm leading-none">{cat.en}</div>
                <div className="font-mono text-[9px] tracking-[0.25em] mt-1 opacity-70">
                  {cat.ko}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SOURCE — existing vs new */}
      <div>
        <div className="flex border-b border-ink mb-3">
          <button
            type="button"
            onClick={() => setMode("existing")}
            disabled={sourcesOfType.length === 0}
            className={`font-mono text-[10px] tracking-[0.3em] px-3 py-2 border-b-2 -mb-px ${
              mode === "existing" ? "border-ink" : "border-transparent text-muted"
            } ${sourcesOfType.length === 0 ? "opacity-30" : ""}`}
          >
            EXISTING ({sourcesOfType.length})
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`font-mono text-[10px] tracking-[0.3em] px-3 py-2 border-b-2 -mb-px ${
              mode === "new" ? "border-ink" : "border-transparent text-muted"
            }`}
          >
            NEW
          </button>
        </div>

        {mode === "existing" ? (
          <select
            name="existing_source_id"
            required
            value={existingId || sourcesOfType[0]?.id || ""}
            onChange={(e) => setExistingId(e.target.value)}
            className="w-full border border-ink bg-paper px-3 py-3 font-serif text-base"
          >
            {sourcesOfType.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
                {s.creator ? ` — ${s.creator}` : ""}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Search — auto-fill all fields */}
            {SEARCHABLE.includes(type) && (
              <div className="border border-line p-3">
                <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-2">
                  SEARCH / 검색 — 자동 입력
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        doSearch();
                      }
                    }}
                    placeholder={
                      type === "book"
                        ? "책 제목 / 저자 / ISBN"
                        : type === "movie"
                          ? "영화 · 드라마 제목"
                          : "곡 · 아티스트"
                    }
                    className="flex-1 border border-ink bg-paper px-3 py-2.5 font-serif text-base focus:outline-none focus:border-blue"
                  />
                  <button
                    type="button"
                    onClick={doSearch}
                    disabled={searching}
                    className="font-mono text-[10px] tracking-[0.3em] border border-ink px-3 py-2 hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
                  >
                    {searching ? "..." : "GO"}
                  </button>
                </div>

                {hits.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-2 max-h-[260px] overflow-y-auto">
                    {hits.map((h, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => useHit(h)}
                          className="w-full flex gap-3 items-center border border-line p-2 hover:border-ink transition-colors text-left"
                        >
                          {h.cover_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={h.cover_url}
                              alt=""
                              className="w-10 h-14 object-cover bg-ink shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-14 bg-line shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-serif text-sm leading-tight truncate">
                              {h.title}
                            </div>
                            {h.creator && (
                              <div className="font-mono text-[10px] tracking-[0.2em] text-muted truncate">
                                {h.creator}
                              </div>
                            )}
                            <div className="font-mono text-[9px] tracking-[0.2em] text-muted truncate">
                              {[h.publisher, h.published_date]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <input
              type="text"
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목 *"
              className="w-full border border-ink bg-paper px-3 py-3 font-serif text-base"
            />
            <input
              type="text"
              name="creator"
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
              placeholder="저자 / 출연자 / 아티스트"
              className="w-full border border-ink bg-paper px-3 py-3 font-serif text-base"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                name="publisher"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="출판사 / 앨범"
                className="border border-ink bg-paper px-3 py-3 font-serif text-base min-w-0"
              />
              <input
                type="text"
                name="published_date"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
                placeholder="연도"
                className="border border-ink bg-paper px-3 py-3 font-serif text-base min-w-0"
              />
            </div>
            <input
              type="text"
              name="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="장르 — 한국소설 / 한국영화 / K-Pop … (검색으로 자동입력)"
              className="w-full border border-ink bg-paper px-3 py-3 font-serif text-base"
            />
            <input type="hidden" name="isbn" value={isbn} />
            <input type="hidden" name="cover_url" value={coverUrl} />
            {coverUrl && (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverUrl}
                  alt=""
                  className="w-14 h-20 object-cover bg-ink border border-line"
                />
                <span className="font-mono text-[10px] tracking-[0.2em] text-muted">
                  COVER LOCKED
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="font-mono text-[10px] tracking-[0.3em] mb-1.5">
          PAGE / LOCATION
        </div>
        <input
          type="text"
          name="page"
          placeholder="p.132 / 12:30 / S1E04..."
          className="w-full border border-ink bg-paper px-3 py-3 font-serif text-base"
        />
      </div>

      <div>
        <div className="font-mono text-[10px] tracking-[0.3em] mb-1.5">
          TAGS / 태그 — 쉼표 구분
        </div>
        <input
          type="text"
          name="mood_tags"
          placeholder="quiet, growth..."
          className="w-full border border-ink bg-paper px-3 py-3 font-serif text-base"
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" name="is_favorite" className="w-5 h-5 accent-red" />
        <span className="font-mono text-xs tracking-[0.25em]">
          FAVORITE / 즐겨찾기
        </span>
      </label>

      <button
        type="submit"
        className="font-mono text-xs tracking-[0.3em] border border-ink px-6 py-4 hover:bg-ink hover:text-paper transition-colors sticky bottom-3"
      >
        [ SAVE / 저장 ]
      </button>
    </form>
  );
}
