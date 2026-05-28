// Notes can embed line cards inline by typing [[q:UUID]] anywhere in the
// body. The renderer splits the body around these tokens and renders a
// compact quote card for each one.
//
// Server pages pre-resolve every reference into a quote-by-id map so the
// client component doesn't have to do per-token fetches.

const REF_RE = /\[\[q:([0-9a-fA-F-]{8,36})\]\]/g;

export function extractQuoteRefs(body: string): string[] {
  const ids = new Set<string>();
  for (const m of body.matchAll(REF_RE)) ids.add(m[1]);
  return [...ids];
}

export type BodySegment =
  | { kind: "text"; text: string }
  | { kind: "ref"; id: string };

// Split body into ordered segments — alternating Markdown text and quote refs.
export function splitNoteBody(body: string): BodySegment[] {
  const out: BodySegment[] = [];
  let lastIndex = 0;
  for (const m of body.matchAll(REF_RE)) {
    const idx = m.index ?? 0;
    if (idx > lastIndex) {
      out.push({ kind: "text", text: body.slice(lastIndex, idx) });
    }
    out.push({ kind: "ref", id: m[1] });
    lastIndex = idx + m[0].length;
  }
  if (lastIndex < body.length) {
    out.push({ kind: "text", text: body.slice(lastIndex) });
  }
  return out;
}
