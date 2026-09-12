import { getData } from "@/lib/notion";

export const revalidate = 300;

type Line = {
  text: string;
  source_title?: string;
  source_creator?: string;
  source_type?: string;
};

async function pickLine(): Promise<Line | null> {
  const { quotes, sourceById } = await getData();
  if (quotes.length === 0) return null;

  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  const pick = quotes[dayOfYear % quotes.length];

  const src = pick.source_id ? sourceById.get(pick.source_id) : null;
  return {
    text: pick.text,
    source_title: src?.title,
    source_creator: src?.creator ?? undefined,
    source_type: src?.type,
  };
}

export default async function EmbedTodayPage() {
  const line = await pickLine();

  if (!line) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-paper text-ink">
        <div className="font-mono text-[11px] tracking-[0.3em] text-muted">
          AFTERLINE / NO LINE
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col justify-between p-6 bg-paper text-ink">
      <div className="font-mono text-[11px] tracking-[0.3em] text-muted">
        AFTERLINE
        {line.source_type ? ` / ${line.source_type.toUpperCase()}` : ""}
      </div>

      <blockquote className="font-sans text-[clamp(14px,2.4vw,20px)] leading-relaxed whitespace-pre-line my-6">
        {line.text}
      </blockquote>

      {(line.source_title || line.source_creator) && (
        <div className="border-t border-line pt-3 font-mono text-[11px] tracking-[0.25em] text-muted">
          {line.source_title}
          {line.source_creator ? ` — ${line.source_creator}` : ""}
        </div>
      )}
    </main>
  );
}
