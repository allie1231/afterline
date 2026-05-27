import { getAllSources } from "@/lib/data/repository";
import type { SourceType } from "@/lib/data/types";
import { NewQuoteForm } from "./NewQuoteForm";

const VALID_TYPES: SourceType[] = [
  "book",
  "article",
  "lyrics",
  "movie",
  "conversation",
  "other",
];

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; source?: string }>;
}) {
  const params = await searchParams;
  const defaultType = VALID_TYPES.includes(params.type as SourceType)
    ? (params.type as SourceType)
    : undefined;
  const defaultSourceId = params.source;

  const sources = await getAllSources();

  return (
    <section className="px-6 py-10 max-w-3xl mx-auto">
      <div className="font-mono text-[10px] tracking-[0.25em] text-muted mb-3">
        AFTERLINE / NEW LINE
      </div>
      <h1 className="font-serif text-6xl tracking-tight leading-none">
        New Line
      </h1>
      <p className="font-mono text-xs tracking-[0.2em] text-muted mt-3 mb-12">
        새 문장 더하기
      </p>

      <NewQuoteForm
        sources={sources}
        defaultType={defaultType}
        defaultSourceId={defaultSourceId}
      />
    </section>
  );
}
