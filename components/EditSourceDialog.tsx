"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSourceBulkAction } from "@/app/sources/[id]/actions";
import { SPINE_PALETTE } from "@/lib/data/spineColor";
import { ChangeCoverDialog } from "./ChangeCoverDialog";
import type { Source, SourceType } from "@/lib/data/types";

const SHOW_PUBLISHER = new Set<SourceType>(["book", "lyrics", "movie"]);
const SHOW_YEAR = new Set<SourceType>(["book", "lyrics", "movie", "article"]);
const SHOW_ISBN = new Set<SourceType>(["book"]);
const SHOW_URL = new Set<SourceType>([
  "article",
  "book",
  "lyrics",
  "movie",
  "conversation",
  "other",
]);
const SHOW_COVER = new Set<SourceType>(["book", "lyrics", "movie"]);

const PUBLISHER_LABEL: Partial<Record<SourceType, string>> = {
  book: "PUBLISHER / 출판사",
  lyrics: "ALBUM / 앨범",
  movie: "STUDIO / 제작사",
};

export function EditSourceDialog({
  source,
  onClose,
}: {
  source: Source;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [coverDialogOpen, setCoverDialogOpen] = useState(false);

  const [title, setTitle] = useState(source.title);
  const [creator, setCreator] = useState(source.creator ?? "");
  const [publisher, setPublisher] = useState(source.publisher ?? "");
  const [publishedDate, setPublishedDate] = useState(source.published_date ?? "");
  const [isbn, setIsbn] = useState(source.isbn ?? "");
  const [url, setUrl] = useState(source.url ?? "");
  const [spineColor, setSpineColor] = useState<string | null>(
    source.spine_color ?? null,
  );

  function handleSave() {
    setError("");
    if (!title.trim()) {
      setError("제목은 비울 수 없어요.");
      return;
    }
    start(async () => {
      try {
        await updateSourceBulkAction(source.id, {
          title,
          creator,
          publisher: SHOW_PUBLISHER.has(source.type) ? publisher : undefined,
          published_date: SHOW_YEAR.has(source.type) ? publishedDate : undefined,
          isbn: SHOW_ISBN.has(source.type) ? isbn : undefined,
          url: SHOW_URL.has(source.type) ? url : undefined,
          spine_color: spineColor,
        });
        router.refresh();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "저장에 실패했어요.");
      }
    });
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
            EDIT INFO / 소스 정보 수정
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

        <div className="px-5 py-5 flex flex-col gap-5">
          {/* Cover area */}
          {SHOW_COVER.has(source.type) && (
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-20 h-28 border border-ink overflow-hidden bg-paper flex items-center justify-center">
                {source.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={source.cover_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-mono text-[9px] tracking-[0.2em] text-muted">
                    NO COVER
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-2">
                  COVER / 표지
                </div>
                <button
                  type="button"
                  onClick={() => setCoverDialogOpen(true)}
                  className="font-mono text-[10px] tracking-[0.3em] border border-ink px-3 py-1.5 hover:bg-ink hover:text-paper transition-colors"
                >
                  [ CHANGE COVER ]
                </button>
                <p className="font-mono text-[10px] text-muted mt-2 leading-relaxed">
                  검색 / 업로드 / URL 중 골라서 바꿀 수 있어요.
                </p>
              </div>
            </div>
          )}

          <Field label="TITLE / 제목">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-ink bg-paper px-3 py-2 font-serif text-lg focus:outline-none focus:border-blue"
            />
          </Field>

          <Field label="CREATOR / 저자·출연자">
            <input
              type="text"
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
              className="w-full border border-ink bg-paper px-3 py-2 font-serif text-base focus:outline-none focus:border-blue"
            />
          </Field>

          {SHOW_PUBLISHER.has(source.type) && (
            <Field
              label={PUBLISHER_LABEL[source.type] ?? "PUBLISHER / 출판사"}
            >
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                className="w-full border border-ink bg-paper px-3 py-2 font-serif text-base focus:outline-none focus:border-blue"
              />
            </Field>
          )}

          {SHOW_YEAR.has(source.type) && (
            <Field label="YEAR / 연도">
              <input
                type="text"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
                placeholder="2024"
                className="w-full border border-ink bg-paper px-3 py-2 font-serif text-base focus:outline-none focus:border-blue"
              />
            </Field>
          )}

          {SHOW_ISBN.has(source.type) && (
            <Field label="ISBN">
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                className="w-full border border-ink bg-paper px-3 py-2 font-serif text-base focus:outline-none focus:border-blue"
              />
            </Field>
          )}

          {SHOW_URL.has(source.type) && (
            <Field label="URL / 링크">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://"
                className="w-full border border-ink bg-paper px-3 py-2 font-serif text-base focus:outline-none focus:border-blue"
              />
            </Field>
          )}

          <Field label="SPINE COLOR / 책등 색">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setSpineColor(null)}
                className={`font-mono text-[10px] tracking-[0.25em] border px-3 py-1.5 transition-colors ${
                  spineColor === null
                    ? "border-ink bg-ink text-paper"
                    : "border-ink text-muted hover:text-ink"
                }`}
              >
                AUTO
              </button>
              {SPINE_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSpineColor(c)}
                  className={`w-7 h-7 border ${
                    spineColor === c ? "border-ink ring-2 ring-ink" : "border-ink/60"
                  }`}
                  style={{ background: c }}
                  aria-label={`spine ${c}`}
                />
              ))}
              <label
                className="w-7 h-7 border border-ink/60 cursor-pointer relative overflow-hidden"
                title="픽커로 직접 고르기"
                style={{
                  background:
                    spineColor && /^#[0-9a-f]{3,8}$/i.test(spineColor)
                      ? spineColor
                      : "conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
                }}
              >
                <input
                  type="color"
                  value={
                    spineColor && /^#[0-9a-f]{6,8}$/i.test(spineColor)
                      ? spineColor.slice(0, 7)
                      : "#888888"
                  }
                  onChange={(e) => setSpineColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  aria-label="custom color"
                />
              </label>
              <input
                type="text"
                value={spineColor ?? ""}
                onChange={(e) => setSpineColor(e.target.value || null)}
                placeholder="#hex"
                className="font-mono text-xs border border-ink bg-paper px-2 py-1 w-24"
              />
            </div>
            <p className="font-mono text-[10px] text-muted mt-2 leading-relaxed">
              6색 프리셋 / 무지개 픽커 / 직접 #hex 입력 중 아무거나.
              AUTO를 누르면 ID 해시로 자동 배정돼요.
            </p>
          </Field>

          {error && (
            <div className="font-mono text-[10px] text-red">{error}</div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-ink px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="font-mono text-[10px] tracking-[0.3em] text-muted hover:text-ink disabled:opacity-50"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="font-mono text-[10px] tracking-[0.3em] border border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
          >
            [ {pending ? "SAVING…" : "SAVE"} ]
          </button>
        </footer>
      </div>

      {coverDialogOpen && (
        <ChangeCoverDialog
          source={source}
          onClose={() => {
            setCoverDialogOpen(false);
            // ChangeCoverDialog saves on its own; refresh so the new thumbnail
            // appears in this dialog without remount.
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] tracking-[0.3em] text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
