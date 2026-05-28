"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Markdown } from "./Markdown";
import { createNoteAction, updateNoteAction } from "@/app/notes/actions";

const KIND_PRESETS = ["요약", "리뷰", "메모", "생각", "인용 정리"];

type Mode = "edit" | "preview";

// Edit-in-place editor for an existing note.
// Used inside NoteCard when the user clicks EDIT.
export function NoteEditInline({
  noteId,
  initialKind,
  initialTitle,
  initialBody,
  onDone,
}: {
  noteId: string;
  initialKind: string;
  initialTitle: string;
  initialBody: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [kind, setKind] = useState(initialKind);
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [mode, setMode] = useState<Mode>("edit");
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  function save() {
    setError("");
    if (!body.trim()) {
      setError("본문을 비울 수 없어요.");
      return;
    }
    start(async () => {
      try {
        await updateNoteAction(noteId, {
          kind: kind || null,
          title: title || null,
          body,
        });
        router.refresh();
        onDone();
      } catch (e) {
        setError(e instanceof Error ? e.message : "저장에 실패했어요.");
      }
    });
  }

  return (
    <NoteFormCore
      kind={kind}
      setKind={setKind}
      title={title}
      setTitle={setTitle}
      body={body}
      setBody={setBody}
      mode={mode}
      setMode={setMode}
      error={error}
      pending={pending}
      onSave={save}
      onCancel={onDone}
      saveLabel="저장"
    />
  );
}

// New-note form. Server action handles redirect.
export function NoteCreateForm({
  sourceId,
  defaultKind,
}: {
  sourceId: string;
  defaultKind?: string;
}) {
  const [kind, setKind] = useState(defaultKind ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<Mode>("edit");

  return (
    <form action={createNoteAction} className="flex flex-col gap-3">
      <input type="hidden" name="source_id" value={sourceId} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="body" value={body} />
      <NoteFormCore
        kind={kind}
        setKind={setKind}
        title={title}
        setTitle={setTitle}
        body={body}
        setBody={setBody}
        mode={mode}
        setMode={setMode}
        error=""
        pending={false}
        onSave={(e) => {
          if (!body.trim()) {
            e?.preventDefault?.();
            alert("본문을 비울 수 없어요.");
          }
        }}
        onCancel={() => {
          setKind("");
          setTitle("");
          setBody("");
        }}
        saveLabel="저장"
        submitButton
      />
    </form>
  );
}

// Shared form body.
function NoteFormCore({
  kind,
  setKind,
  title,
  setTitle,
  body,
  setBody,
  mode,
  setMode,
  error,
  pending,
  onSave,
  onCancel,
  saveLabel,
  submitButton = false,
}: {
  kind: string;
  setKind: (v: string) => void;
  title: string;
  setTitle: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  error: string;
  pending: boolean;
  onSave: (e?: React.MouseEvent) => void;
  onCancel: () => void;
  saveLabel: string;
  submitButton?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 border border-ink p-4 bg-paper">
      {/* Kind chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-[9px] tracking-[0.3em] text-muted">
          KIND
        </span>
        {KIND_PRESETS.map((k) => (
          <button
            type="button"
            key={k}
            onClick={() => setKind(kind === k ? "" : k)}
            className={`font-mono text-[10px] tracking-[0.2em] border px-2 py-1 transition-colors ${
              kind === k
                ? "bg-ink text-paper border-ink"
                : "border-line hover:border-ink"
            }`}
          >
            {k}
          </button>
        ))}
        <input
          type="text"
          value={KIND_PRESETS.includes(kind) ? "" : kind}
          onChange={(e) => setKind(e.target.value)}
          placeholder="직접 입력…"
          className="font-mono text-xs border border-line px-2 py-1 w-32 focus:outline-none focus:border-ink"
        />
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목 (선택)"
        className="border border-line bg-paper px-3 py-2 font-serif text-lg focus:outline-none focus:border-blue"
      />

      {/* Tabs */}
      <div className="flex border-b border-line">
        <TabBtn active={mode === "edit"} onClick={() => setMode("edit")}>
          WRITE / 작성
        </TabBtn>
        <TabBtn active={mode === "preview"} onClick={() => setMode("preview")}>
          PREVIEW / 미리보기
        </TabBtn>
        <div className="ml-auto font-mono text-[9px] tracking-[0.25em] text-muted self-end pb-2 pr-1">
          MD 지원 — **굵게** · # 제목 · - 리스트 · [[q:문장-ID]]
        </div>
      </div>

      {mode === "edit" ? (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          placeholder="여기 적어주세요. 마크다운을 쓰면 PREVIEW 에서 그대로 보여요."
          className="w-full border border-line bg-paper px-3 py-3 font-serif text-lg leading-relaxed focus:outline-none focus:border-blue resize-y min-h-[260px]"
        />
      ) : (
        <div className="border border-line bg-paper px-4 py-3 min-h-[260px]">
          {body.trim() ? (
            <Markdown source={body} />
          ) : (
            <div className="font-mono text-xs text-muted">
              (본문 없음 — WRITE 탭에서 적어주세요)
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="font-mono text-[10px] text-red">{error}</div>
      )}

      <div className="flex items-center gap-2 pt-1">
        {submitButton ? (
          <button
            type="submit"
            onClick={(e) => onSave(e)}
            className="font-mono text-[10px] tracking-[0.3em] border border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors"
          >
            {saveLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSave()}
            disabled={pending}
            className="font-mono text-[10px] tracking-[0.3em] border border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
          >
            {pending ? "SAVING…" : saveLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="font-mono text-[10px] tracking-[0.3em] text-muted px-3 py-2 hover:text-ink"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}

function TabBtn({
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
      className={`font-mono text-[10px] tracking-[0.3em] px-3 py-2 border-b-2 -mb-px transition-colors ${
        active ? "border-ink" : "border-transparent text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
