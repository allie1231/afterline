"use client";

import { EditableText } from "./EditableText";
import { updateSourceTextAction } from "@/app/sources/[id]/actions";

type Field =
  | "title"
  | "creator"
  | "publisher"
  | "published_date"
  | "isbn"
  | "url"
  | "cover_url";

export function SourceFieldEditor({
  sourceId,
  field,
  initialValue,
  multiline = false,
  placeholder = "+",
  textClassName,
  emptyClassName,
}: {
  sourceId: string;
  field: Field;
  initialValue: string;
  multiline?: boolean;
  placeholder?: string;
  textClassName?: string;
  emptyClassName?: string;
}) {
  return (
    <EditableText
      initialValue={initialValue}
      onSave={(v) => updateSourceTextAction(sourceId, field, v)}
      multiline={multiline}
      placeholder={placeholder}
      textClassName={textClassName}
      emptyClassName={emptyClassName}
    />
  );
}
