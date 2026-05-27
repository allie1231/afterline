"use client";

import { EditableText } from "./EditableText";
import { updateNoteTextAction } from "@/app/sources/[id]/actions";

export function NoteFieldEditor({
  sourceId,
  field,
  initialValue,
  placeholder,
  textClassName,
  emptyClassName,
}: {
  sourceId: string;
  field: "summary" | "personal_note";
  initialValue: string;
  placeholder?: string;
  textClassName?: string;
  emptyClassName?: string;
}) {
  return (
    <EditableText
      initialValue={initialValue}
      onSave={(v) => updateNoteTextAction(sourceId, field, v)}
      multiline
      placeholder={placeholder ?? "+ ADD"}
      textClassName={textClassName}
      emptyClassName={emptyClassName}
    />
  );
}
