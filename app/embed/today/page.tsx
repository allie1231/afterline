// Public embeddable widget — shows one of the user's lines.
// Usage: <iframe src="https://afterline-pi.vercel.app/embed/today?token=<TOKEN>" />
//
// We deliberately accept the Personal Token in the URL so the widget works
// from any origin without a Supabase session. Anyone with the iframe URL can
// see the lines — rotate the token in /settings if it leaks.

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type Line = {
  text: string;
  source_title?: string;
  source_creator?: string;
  source_type?: string;
};

async function pickLine(token: string): Promise<Line | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: tokenRow } = await sb
    .from("api_tokens")
    .select("user_id")
    .eq("token", token)
    .maybeSingle();
  if (!tokenRow) return null;
  const userId = tokenRow.user_id as string;

  // Pull up to 200 lines, pick one by day-of-year so the same iframe shows
  // the same quote across a day (cacheable, no thrashing on refresh).
  const { data: quotes } = await sb
    .from("quotes")
    .select("text, source_id")
    .eq("user_id", userId)
    .limit(200)
    .order("created_at", { ascending: false });
  if (!quotes || quotes.length === 0) return null;

  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  const pick = quotes[dayOfYear % quotes.length];

  let line: Line = { text: pick.text as string };
  if (pick.source_id) {
    const { data: src } = await sb
      .from("sources")
      .select("title, creator, type")
      .eq("id", pick.source_id as string)
      .maybeSingle();
    if (src) {
      line = {
        ...line,
        source_title: src.title as string,
        source_creator: src.creator as string | undefined,
        source_type: src.type as string,
      };
    }
  }
  return line;
}

export default async function EmbedTodayPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const line = token ? await pickLine(token) : null;

  if (!line) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-paper text-ink">
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted">
          AFTERLINE / NO LINE
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col justify-between p-6 bg-paper text-ink">
      <div className="font-mono text-[10px] tracking-[0.3em] text-muted">
        AFTERLINE
        {line.source_type ? ` / ${line.source_type.toUpperCase()}` : ""}
      </div>

      <blockquote className="font-serif text-[clamp(18px,3.4vw,28px)] leading-snug whitespace-pre-line my-6">
        {line.text}
      </blockquote>

      {(line.source_title || line.source_creator) && (
        <div className="border-t border-line pt-3 font-mono text-[10px] tracking-[0.25em] text-muted">
          {line.source_title}
          {line.source_creator ? ` — ${line.source_creator}` : ""}
        </div>
      )}
    </main>
  );
}
