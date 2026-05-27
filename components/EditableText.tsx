"use client";

import { useEffect, useState, useTransition } from "react";

/**
 * Click-to-edit text field. On save it calls the bound action.
 * The action prop receives the trimmed new value and persists it.
 */
export function EditableText({
  initialValue,
  onSave,
  placeholder = "—",
  multiline = false,
  textClassName = "",
  emptyClassName = "italic text-muted",
}: {
  initialValue: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  multiline?: boolean;
  textClassName?: string;
  emptyClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  function save() {
    if (value.trim() === initialValue.trim()) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      await onSave(value);
      setEditing(false);
    });
  }

  function cancel() {
    setValue(initialValue);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={`text-left w-full hover:bg-line/40 transition-colors px-1 -mx-1 rounded-sm whitespace-pre-wrap ${textClassName} ${
          initialValue ? "" : emptyClassName
        }`}
      >
        {initialValue || placeholder}
      </button>
    );
  }

  const sharedCls =
    "w-full border border-ink bg-paper px-3 py-2 font-serif focus:outline-none focus:border-blue";

  return (
    <div className="flex flex-col gap-2">
      {multiline ? (
        <textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          className={`${sharedCls} text-lg leading-snug resize-y`}
          disabled={pending}
        />
      ) : (
        <input
          type="text"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
            if (e.key === "Escape") cancel();
          }}
          className={`${sharedCls} text-lg`}
          disabled={pending}
        />
      )}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="font-mono text-[10px] tracking-[0.3em] border border-ink px-3 py-1.5 hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
        >
          SAVE
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          className="text-base leading-none text-muted px-2 py-1.5 hover:text-ink"
          aria-label="Cancel"
        >
          ×
        </button>
      </div>
    </div>
  );
}
