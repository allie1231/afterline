"use client";

import { useMemo, useState } from "react";
import { ROOM_CATEGORIES } from "@/lib/data/categories";
import type { Source, SourceType } from "@/lib/data/types";
import { createQuoteAction } from "./actions";

// ── Per-type labels ───────────────────────────────────────────────────
const CREATOR_LABEL: Record<SourceType, { en: string; ko: string }> = {
  book: { en: "AUTHOR", ko: "저자" },
  article: { en: "AUTHOR / PUBLICATION", ko: "필자 / 매체" },
  lyrics: { en: "ARTIST", ko: "아티스트" },
  movie: { en: "FORMAT", ko: "영화 / 드라마 / 애니메이션" },
  conversation: { en: "WITH", ko: "대화 상대" },
  other: { en: "FROM", ko: "출처" },
};

const SECONDARY_LABEL: Record<SourceType, { en: string; ko: string }> = {
  book: { en: "PUBLISHER", ko: "출판사" },
  article: { en: "PUBLICATION", ko: "매체" },
  lyrics: { en: "ALBUM", ko: "앨범" },
  movie: { en: "YEAR", ko: "연도" },
  conversation: { en: "CONTEXT", ko: "맥락" },
  other: { en: "CONTEXT", ko: "맥락" },
};

const LOCATION_LABEL: Record<SourceType, { en: string; ko: string }> = {
  book: { en: "PAGE", ko: "페이지" },
  article: { en: "LOCATION", ko: "위치" },
  lyrics: { en: "TIMESTAMP", ko: "타임스탬프" },
  movie: { en: "EPISODE", ko: "회차" },
  conversation: { en: "MOMENT", ko: "순간" },
  other: { en: "LOCATION", ko: "위치" },
};

// Editorial palette — arranged cool → warm → neutral.
const SPINE_COLORS: Array<{
  value: string;
  color: string | null;
  label?: string;
}> = [
  { value: "auto", color: null, label: "AUTO" },
  { value: "var(--blue)", color: "var(--blue)" },
  { value: "#1a2847", color: "#1a2847" }, // navy
  { value: "#9a8cc4", color: "#9a8cc4" }, // lilac
  { value: "var(--cyan)", color: "var(--cyan)" },
  { value: "var(--green)", color: "var(--green)" },
  { value: "#3a5a3a", color: "#3a5a3a" }, // forest
  { value: "var(--yellow)", color: "var(--yellow)" },
  { value: "#c89a2e", color: "#c89a2e" }, // mustard
  { value: "var(--orange)", color: "var(--orange)" },
  { value: "#b35c3e", color: "#b35c3e" }, // terracotta
  { value: "var(--red)", color: "var(--red)" },
  { value: "#7a1f1f", color: "#7a1f1f" }, // burgundy
  { value: "#e8a08e", color: "#e8a08e" }, // salmon
  { value: "var(--ink)", color: "var(--ink)" },
];

const MOVIE_FORMATS = ["영화", "드라마", "애니메이션"] as const;

// ── Google Books search ──────────────────────────────────────────────
type BookResult = {
  id: string;
  title: string;
  creator?: string;
  publisher?: string;
  published_date?: string;
  isbn?: string;
  cover_url?: string;
};

async function searchGoogleBooks(query: string): Promise<BookResult[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&printType=books`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const items = (data.items ?? []) as Array<{
    id: string;
    volumeInfo: {
      title?: string;
      authors?: string[];
      publisher?: string;
      publishedDate?: string;
      industryIdentifiers?: { type: string; identifier: string }[];
      imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    };
  }>;
  return items.map((it) => {
    const v = it.volumeInfo;
    const isbn13 = v.industryIdentifiers?.find((x) => x.type === "ISBN_13");
    const isbn10 = v.industryIdentifiers?.find((x) => x.type === "ISBN_10");
    const cover = (v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail)?.replace(
      "http://",
      "https://",
    );
    return {
      id: it.id,
      title: v.title ?? "",
      creator: v.authors?.join(", "),
      publisher: v.publisher,
      published_date: v.publishedDate,
      isbn: isbn13?.identifier ?? isbn10?.identifier,
      cover_url: cover,
    };
  });
}

// ── TMDb search (movies + TV) ─────────────────────────────────────────
type MovieFormatGuess = (typeof MOVIE_FORMATS)[number];

type MovieResult = {
  id: string;
  title: string;
  year?: string;
  cover_url?: string;
  media_type: "movie" | "tv";
  format_guess: MovieFormatGuess;
};

const TMDB_ANIMATION_GENRE_IDS = new Set([16]); // 16 = Animation in both movie and tv

async function searchTmdb(query: string): Promise<MovieResult[]> {
  const key = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!key) return [];
  const url = `https://api.themoviedb.org/3/search/multi?api_key=${key}&query=${encodeURIComponent(query)}&language=ko-KR&include_adult=false&page=1`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const items = (data.results ?? []) as Array<{
    id: number;
    media_type: string;
    title?: string; // movie
    name?: string; // tv
    release_date?: string; // movie
    first_air_date?: string; // tv
    poster_path?: string | null;
    genre_ids?: number[];
  }>;
  return items
    .filter((it) => it.media_type === "movie" || it.media_type === "tv")
    .map((it) => {
      const title = (it.media_type === "movie" ? it.title : it.name) ?? "";
      const date =
        it.media_type === "movie" ? it.release_date : it.first_air_date;
      const year = date && date.length >= 4 ? date.slice(0, 4) : undefined;
      const cover = it.poster_path
        ? `https://image.tmdb.org/t/p/w500${it.poster_path}`
        : undefined;
      const hasAnimation = (it.genre_ids ?? []).some((g) =>
        TMDB_ANIMATION_GENRE_IDS.has(g),
      );
      const format_guess: MovieFormatGuess = hasAnimation
        ? "애니메이션"
        : it.media_type === "tv"
          ? "드라마"
          : "영화";
      return {
        id: `${it.media_type}-${it.id}`,
        title,
        year,
        cover_url: cover,
        media_type: it.media_type as "movie" | "tv",
        format_guess,
      };
    })
    .filter((r) => r.title.length > 0);
}

// ── Component ────────────────────────────────────────────────────────
export function NewQuoteForm({
  sources,
  allTags,
  defaultType,
  defaultSourceId,
}: {
  sources: Source[];
  allTags: string[];
  defaultType?: SourceType;
  defaultSourceId?: string;
}) {
  const [type, setType] = useState<SourceType>(defaultType ?? "book");
  const sourcesOfType = useMemo(
    () => sources.filter((s) => s.type === type),
    [sources, type],
  );
  const hasExisting = sourcesOfType.length > 0;
  const [mode, setMode] = useState<"existing" | "new">(
    defaultSourceId && hasExisting ? "existing" : hasExisting ? "existing" : "new",
  );
  const [selectedSourceId, setSelectedSourceId] = useState(
    defaultSourceId ?? sourcesOfType[0]?.id ?? "",
  );

  // Controlled new-source fields so book-search can populate them
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [publisher, setPublisher] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [isbn, setIsbn] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  // Spine color
  const [spineColor, setSpineColor] = useState<string>("auto");

  // Tags controlled so suggestion chips can append
  const [tagsInput, setTagsInput] = useState("");
  const [tagsExpanded, setTagsExpanded] = useState(false);
  function appendTag(tag: string) {
    setTagsInput((prev) => {
      const arr = prev
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (arr.includes(tag)) return prev;
      return [...arr, tag].join(", ");
    });
  }

  // Book search
  const [bookQuery, setBookQuery] = useState("");
  const [bookResults, setBookResults] = useState<BookResult[]>([]);
  const [searching, setSearching] = useState(false);

  async function doBookSearch() {
    const q = bookQuery.trim();
    if (!q) return;
    setSearching(true);
    try {
      const results = await searchGoogleBooks(q);
      setBookResults(results);
    } finally {
      setSearching(false);
    }
  }

  function applyBookResult(b: BookResult) {
    setTitle(b.title ?? "");
    setCreator(b.creator ?? "");
    setPublisher(b.publisher ?? "");
    setPublishedDate(b.published_date ?? "");
    setIsbn(b.isbn ?? "");
    setCoverUrl(b.cover_url ?? "");
    setBookResults([]);
  }

  // Movie / TV search (TMDb)
  const [movieQuery, setMovieQuery] = useState("");
  const [movieResults, setMovieResults] = useState<MovieResult[]>([]);
  const [movieSearching, setMovieSearching] = useState(false);

  async function doMovieSearch() {
    const q = movieQuery.trim();
    if (!q) return;
    setMovieSearching(true);
    try {
      const results = await searchTmdb(q);
      setMovieResults(results);
    } finally {
      setMovieSearching(false);
    }
  }

  function applyMovieResult(m: MovieResult) {
    setTitle(m.title);
    setPublishedDate(m.year ?? "");
    setCoverUrl(m.cover_url ?? "");
    // Auto-pick the FORMAT radio based on TMDb media_type + genre.
    // User can immediately re-click another radio to override.
    setCreator(m.format_guess);
    setMovieResults([]);
  }

  function handleTypeChange(t: SourceType) {
    setType(t);
    const next = sources.filter((s) => s.type === t);
    if (next.length === 0) {
      setMode("new");
      setSelectedSourceId("");
    } else {
      setSelectedSourceId(next[0].id);
      setMode("existing");
    }
  }

  const creatorL = CREATOR_LABEL[type];
  const secondaryL = SECONDARY_LABEL[type];
  const locationL = LOCATION_LABEL[type];

  return (
    <form action={createQuoteAction} className="flex flex-col gap-12">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="spine_color" value={spineColor} />

      {/* SECTION 1 — SOURCE */}
      <section>
        <SectionHead n="01" en="WHERE FROM" ko="출처" />

        <Field labelEn="TYPE" labelKo="종류">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-ink border border-ink">
            {ROOM_CATEGORIES.map((cat) => {
              const active = type === cat.type;
              return (
                <button
                  type="button"
                  key={cat.type}
                  onClick={() => handleTypeChange(cat.type)}
                  className="relative p-4 text-left transition-colors"
                  style={{
                    background: active ? cat.accent : "var(--paper)",
                    color: active
                      ? cat.contrast === "dark"
                        ? "var(--white)"
                        : "var(--ink)"
                      : "var(--ink)",
                  }}
                >
                  <div className="font-serif text-sm leading-none tracking-tight">
                    {cat.en}
                  </div>
                  <div className="font-mono text-[9px] tracking-[0.25em] mt-1 opacity-70">
                    {cat.ko}
                  </div>
                </button>
              );
            })}
          </div>
        </Field>

        {/* Spine color picker */}
        <Field labelEn="SPINE COLOR" labelKo="책등 컬러">
          <div className="flex gap-2 flex-wrap">
            {SPINE_COLORS.map((c) => {
              const active = spineColor === c.value;
              return (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setSpineColor(c.value)}
                  className="w-9 h-9 border border-ink flex items-center justify-center transition-transform hover:scale-110"
                  style={{
                    background: c.color ?? "var(--paper)",
                    outline: active ? "2px solid var(--ink)" : "none",
                    outlineOffset: "2px",
                  }}
                  aria-label={c.label ?? "color"}
                  title={c.label ?? ""}
                >
                  {!c.color && (
                    <span className="font-mono text-[8px] tracking-[0.2em]">
                      AUTO
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Field>

        <Field labelEn="SOURCE" labelKo="출처">
          <div className="flex border-b border-ink">
            <TabButton
              active={mode === "existing"}
              disabled={!hasExisting}
              onClick={() => setMode("existing")}
            >
              EXISTING / 기존
              {hasExisting && (
                <span className="ml-2 opacity-60">
                  {sourcesOfType.length.toString().padStart(2, "0")}
                </span>
              )}
            </TabButton>
            <TabButton active={mode === "new"} onClick={() => setMode("new")}>
              NEW / 새로
            </TabButton>
          </div>
        </Field>

        {mode === "existing" ? (
          <Field labelEn="SELECT" labelKo="선택">
            <select
              name="existing_source_id"
              required
              value={selectedSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              className="w-full border border-ink bg-paper px-4 py-3 font-serif text-lg focus:outline-none focus:border-blue"
            >
              {sourcesOfType.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                  {s.creator ? ` — ${s.creator}` : ""}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <>
            {/* Book search (Google Books) */}
            {type === "book" && (
              <div className="mb-6 border border-line bg-paper p-4">
                <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-2">
                  SEARCH GOOGLE BOOKS / 책 검색
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bookQuery}
                    onChange={(e) => setBookQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        doBookSearch();
                      }
                    }}
                    placeholder="책 제목, 저자, ISBN..."
                    className="flex-1 border border-ink bg-paper px-3 py-2 font-serif text-base focus:outline-none focus:border-blue"
                  />
                  <button
                    type="button"
                    onClick={doBookSearch}
                    disabled={searching}
                    className="font-mono text-[10px] tracking-[0.3em] border border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
                  >
                    {searching ? "..." : "SEARCH"}
                  </button>
                </div>

                {bookResults.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2 max-h-[320px] overflow-y-auto">
                    {bookResults.map((b) => (
                      <div
                        key={b.id}
                        className="flex gap-3 items-center border border-line p-2 hover:border-ink transition-colors"
                      >
                        {b.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={b.cover_url}
                            alt=""
                            className="w-12 h-16 object-cover bg-ink shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-16 bg-line shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-serif text-base leading-tight">
                            {b.title}
                          </div>
                          {b.creator && (
                            <div className="font-mono text-[10px] tracking-[0.2em] text-muted mt-1">
                              {b.creator}
                            </div>
                          )}
                          {b.publisher && (
                            <div className="font-mono text-[9px] tracking-[0.2em] text-muted mt-0.5">
                              {b.publisher}
                              {b.published_date ? ` · ${b.published_date}` : ""}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => applyBookResult(b)}
                          className="font-mono text-[10px] tracking-[0.3em] border border-ink px-3 py-2 hover:bg-ink hover:text-paper transition-colors shrink-0"
                        >
                          USE
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Movie / TV search (TMDb) */}
            {type === "movie" && (
              <div className="mb-6 border border-line bg-paper p-4">
                <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-2">
                  SEARCH MOVIES &amp; TV / 영화·드라마·애니 검색
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={movieQuery}
                    onChange={(e) => setMovieQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        doMovieSearch();
                      }
                    }}
                    placeholder="제목으로 검색…"
                    className="flex-1 border border-ink bg-paper px-3 py-2 font-serif text-base focus:outline-none focus:border-blue"
                  />
                  <button
                    type="button"
                    onClick={doMovieSearch}
                    disabled={movieSearching}
                    className="font-mono text-[10px] tracking-[0.3em] border border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
                  >
                    {movieSearching ? "..." : "SEARCH"}
                  </button>
                </div>

                {movieResults.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2 max-h-[360px] overflow-y-auto">
                    {movieResults.map((m) => (
                      <div
                        key={m.id}
                        className="flex gap-3 items-center border border-line p-2 hover:border-ink transition-colors"
                      >
                        {m.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.cover_url}
                            alt=""
                            className="w-12 h-[72px] object-cover bg-ink shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-[72px] bg-line shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-serif text-base leading-tight">
                            {m.title}
                          </div>
                          <div className="font-mono text-[10px] tracking-[0.2em] text-muted mt-1 flex gap-2">
                            <span>{m.format_guess}</span>
                            {m.year && <span>· {m.year}</span>}
                            <span className="opacity-60">
                              · {m.media_type === "tv" ? "TV" : "MOVIE"}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => applyMovieResult(m)}
                          className="font-mono text-[10px] tracking-[0.3em] border border-ink px-3 py-2 hover:bg-ink hover:text-paper transition-colors shrink-0"
                        >
                          USE
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Lyrics — manual only notice */}
            {type === "lyrics" && (
              <div className="mb-6 border border-line bg-paper p-4">
                <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-1">
                  MANUAL ONLY / 직접 입력
                </div>
                <p className="font-serif text-base leading-snug text-ink">
                  가사는 저작권 이슈로 자동 검색을 하지 않습니다. 제목과 아티스트를
                  아래에 직접 입력해주세요.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title — for conversation, it's a date */}
              {type === "conversation" ? (
                <Field labelEn="DATE *" labelKo="대화한 날" className="md:col-span-2">
                  <input
                    type="date"
                    name="title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-ink bg-paper px-4 py-3 font-serif text-lg focus:outline-none focus:border-blue"
                  />
                </Field>
              ) : (
                <Field labelEn="TITLE *" labelKo="제목" className="md:col-span-2">
                  <input
                    type="text"
                    name="title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="제목을 입력하세요"
                    className="w-full border border-ink bg-paper px-4 py-3 font-serif text-lg focus:outline-none focus:border-blue"
                  />
                </Field>
              )}

              {/* Creator field — for movie it's a format radio */}
              {type === "movie" ? (
                <Field labelEn={creatorL.en} labelKo={creatorL.ko}>
                  <div className="flex gap-2 flex-wrap">
                    {MOVIE_FORMATS.map((f) => (
                      <label
                        key={f}
                        className={`cursor-pointer font-mono text-xs tracking-[0.25em] border px-4 py-2.5 transition-colors ${
                          creator === f
                            ? "bg-ink text-paper border-ink"
                            : "border-ink hover:bg-ink hover:text-paper"
                        }`}
                      >
                        <input
                          type="radio"
                          name="creator"
                          value={f}
                          checked={creator === f}
                          onChange={() => setCreator(f)}
                          className="sr-only"
                        />
                        {f}
                      </label>
                    ))}
                  </div>
                </Field>
              ) : (
                <Field labelEn={creatorL.en} labelKo={creatorL.ko}>
                  <input
                    type="text"
                    name="creator"
                    value={creator}
                    onChange={(e) => setCreator(e.target.value)}
                    className="w-full border border-ink bg-paper px-4 py-3 font-serif text-lg focus:outline-none focus:border-blue"
                  />
                </Field>
              )}

              <Field labelEn={secondaryL.en} labelKo={secondaryL.ko}>
                <input
                  type="text"
                  name={type === "movie" ? "published_date" : "publisher"}
                  value={type === "movie" ? publishedDate : publisher}
                  onChange={(e) =>
                    type === "movie"
                      ? setPublishedDate(e.target.value)
                      : setPublisher(e.target.value)
                  }
                  className="w-full border border-ink bg-paper px-4 py-3 font-serif text-lg focus:outline-none focus:border-blue"
                />
              </Field>

              {type === "book" && (
                <Field labelEn="ISBN" labelKo="ISBN">
                  <input
                    type="text"
                    name="isbn"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    className="w-full border border-ink bg-paper px-4 py-3 font-serif text-lg focus:outline-none focus:border-blue"
                  />
                </Field>
              )}

              {type === "article" && (
                <Field labelEn="URL" labelKo="링크" className="md:col-span-2">
                  <input
                    type="url"
                    name="url"
                    placeholder="https://"
                    className="w-full border border-ink bg-paper px-4 py-3 font-serif text-lg focus:outline-none focus:border-blue"
                  />
                </Field>
              )}

              {/* Cover URL — only for image-based covers */}
              {(type === "book" || type === "lyrics" || type === "movie") && (
                <Field
                  labelEn="COVER URL"
                  labelKo="표지/포스터 URL (선택)"
                  className="md:col-span-2"
                >
                  <input
                    type="url"
                    name="cover_url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-ink bg-paper px-4 py-3 font-serif text-lg focus:outline-none focus:border-blue"
                  />
                </Field>
              )}
            </div>
          </>
        )}
      </section>

      {/* SECTION 2 — LINE */}
      <section>
        <SectionHead n="02" en="THE LINE" ko="문장" />

        <Field labelEn="TEXT *" labelKo="문장">
          <textarea
            name="text"
            required
            rows={5}
            placeholder="기억하고 싶은 문장을 적어주세요."
            className="w-full border border-ink bg-paper px-4 py-3 font-serif text-xl leading-snug focus:outline-none focus:border-blue resize-y"
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field labelEn={locationL.en} labelKo={locationL.ko}>
            <input
              type="text"
              name="page"
              placeholder={
                type === "movie"
                  ? "S1E04 / 12화"
                  : type === "lyrics"
                    ? "01:24"
                    : type === "book"
                      ? "132"
                      : ""
              }
              className="w-full border border-ink bg-paper px-4 py-3 font-serif text-lg focus:outline-none focus:border-blue"
            />
          </Field>
          <Field labelEn="TAGS" labelKo="태그 — 쉼표로 구분">
            <input
              type="text"
              name="mood_tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="quiet courage, growth..."
              className="w-full border border-ink bg-paper px-4 py-3 font-serif text-lg focus:outline-none focus:border-blue"
            />
            {allTags.length > 0 && (
              <div className="mt-2">
                <div className="font-mono text-[9px] tracking-[0.3em] text-muted mb-2">
                  PREVIOUSLY USED / 이전에 쓴 태그
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(tagsExpanded ? allTags : allTags.slice(0, 12)).map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => appendTag(tag)}
                      className="font-mono text-[10px] tracking-[0.2em] border border-line px-2 py-1 hover:border-ink hover:bg-ink hover:text-paper transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                  {allTags.length > 12 && (
                    <button
                      type="button"
                      onClick={() => setTagsExpanded((v) => !v)}
                      className="font-mono text-[10px] tracking-[0.25em] border border-ink px-2 py-1 bg-paper hover:bg-ink hover:text-paper transition-colors"
                    >
                      {tagsExpanded
                        ? "− LESS / 접기"
                        : `+ ${allTags.length - 12} MORE / 더보기`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </Field>
        </div>

        <Field labelEn="NOTE / MEMO" labelKo="메모">
          <textarea
            name="note"
            rows={3}
            placeholder="이 문장에 대한 짧은 생각 (선택)"
            className="w-full border border-ink bg-paper px-4 py-3 font-serif text-lg leading-snug focus:outline-none focus:border-blue resize-y"
          />
        </Field>

        <Field labelEn="" labelKo="">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_favorite"
              className="w-4 h-4 accent-red"
            />
            <span className="font-mono text-xs tracking-[0.25em]">
              FAVORITE / 즐겨찾기
            </span>
          </label>
        </Field>
      </section>

      <div className="flex items-center justify-between border-t border-ink pt-6">
        <a
          href="/rooms"
          className="font-mono text-[11px] tracking-[0.3em] text-muted hover:text-ink"
        >
          ← CANCEL / 취소
        </a>
        <button
          type="submit"
          className="font-mono text-xs tracking-[0.3em] border border-ink px-8 py-4 hover:bg-ink hover:text-paper transition-colors"
        >
          [ SAVE LINE / 저장 ]
        </button>
      </div>
    </form>
  );
}

function SectionHead({ n, en, ko }: { n: string; en: string; ko: string }) {
  return (
    <div className="flex items-baseline gap-4 border-b border-ink pb-3 mb-8">
      <span className="font-mono text-[10px] tracking-[0.3em] text-muted">
        {n}
      </span>
      <h2 className="font-serif text-2xl tracking-tight">{en}</h2>
      <span className="font-mono text-[10px] tracking-[0.3em] text-muted">
        {ko}
      </span>
    </div>
  );
}

function Field({
  labelEn,
  labelKo,
  className = "",
  children,
}: {
  labelEn: string;
  labelKo: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`mb-6 ${className}`}>
      {(labelEn || labelKo) && (
        <div className="flex items-baseline gap-3 mb-2">
          {labelEn && (
            <span className="font-mono text-[10px] tracking-[0.3em]">
              {labelEn}
            </span>
          )}
          {labelKo && (
            <span className="font-mono text-[10px] tracking-[0.3em] text-muted">
              {labelKo}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

function TabButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`font-mono text-xs tracking-[0.25em] px-5 py-3 border-b-2 -mb-px transition-colors ${
        active
          ? "border-ink"
          : "border-transparent text-muted hover:text-ink"
      } ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );
}
