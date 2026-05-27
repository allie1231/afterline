"use client";

import { useMemo, useState } from "react";
import { ROOM_CATEGORIES } from "@/lib/data/categories";
import type { Source, SourceType } from "@/lib/data/types";
import { createQuoteAction } from "./actions";

const CREATOR_LABEL: Record<SourceType, { en: string; ko: string }> = {
  book: { en: "AUTHOR", ko: "저자" },
  article: { en: "AUTHOR / PUBLICATION", ko: "필자 / 매체" },
  lyrics: { en: "ARTIST", ko: "아티스트" },
  movie: { en: "DIRECTOR", ko: "감독" },
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

export function NewQuoteForm({
  sources,
  defaultType,
  defaultSourceId,
}: {
  sources: Source[];
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

  // Re-sync selected source when switching type
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

  const creator = CREATOR_LABEL[type];
  const secondary = SECONDARY_LABEL[type];

  return (
    <form action={createQuoteAction} className="flex flex-col gap-12">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="mode" value={mode} />

      {/* SECTION 1 — SOURCE */}
      <section>
        <SectionHead n="01" en="WHERE FROM" ko="출처" />

        {/* Type selector */}
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
                  <div className="font-serif text-lg leading-none tracking-tight">
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

        {/* Existing / New tabs */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field labelEn="TITLE *" labelKo="제목" className="md:col-span-2">
              <Input name="title" required placeholder="제목을 입력하세요" />
            </Field>
            <Field labelEn={creator.en} labelKo={creator.ko}>
              <Input name="creator" />
            </Field>
            <Field labelEn={secondary.en} labelKo={secondary.ko}>
              <Input
                name={type === "movie" ? "published_date" : "publisher"}
              />
            </Field>
            {type === "book" && (
              <Field labelEn="ISBN" labelKo="ISBN">
                <Input name="isbn" />
              </Field>
            )}
            {type === "article" && (
              <Field labelEn="URL" labelKo="링크">
                <Input name="url" type="url" placeholder="https://" />
              </Field>
            )}
            <Field
              labelEn="COVER URL"
              labelKo="표지/포스터 URL (외부 이미지)"
              className="md:col-span-2"
            >
              <Input
                name="cover_url"
                type="url"
                placeholder="https://... (선택, 나중에 업로드 기능 추가됨)"
              />
            </Field>
          </div>
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
          <Field labelEn="PAGE / LOCATION" labelKo="페이지 / 위치">
            <Input name="page" placeholder="132 / 02:14 / 2장 등" />
          </Field>
          <Field labelEn="MOOD TAGS" labelKo="무드 태그 — 쉼표로 구분">
            <Input
              name="mood_tags"
              placeholder="quiet courage, soft sadness"
            />
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

      {/* Submit */}
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
      <h2 className="font-serif text-3xl tracking-tight">{en}</h2>
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

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-ink bg-paper px-4 py-3 font-serif text-lg focus:outline-none focus:border-blue"
    />
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
