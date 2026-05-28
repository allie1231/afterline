import { Markdown } from "./Markdown";
import { InlineQuoteCard } from "./InlineQuoteCard";
import { splitNoteBody } from "@/lib/note-refs";
import type { Quote, Source } from "@/lib/data/types";

// Renders a note body, replacing [[q:id]] tokens with inline quote cards.
// Pass the resolved quotes map from the server so this can stay sync.
export function NoteBody({
  body,
  quotesById,
}: {
  body: string;
  quotesById?: Map<string, { quote: Quote; source: Source | null }>;
}) {
  const segments = splitNoteBody(body);
  if (segments.length === 1 && segments[0].kind === "text") {
    return <Markdown source={segments[0].text} />;
  }
  return (
    <>
      {segments.map((seg, i) =>
        seg.kind === "text" ? (
          <Markdown key={i} source={seg.text} />
        ) : (
          <InlineQuoteCard
            key={i}
            quote={quotesById?.get(seg.id)?.quote ?? null}
            source={quotesById?.get(seg.id)?.source ?? null}
          />
        ),
      )}
    </>
  );
}
