// Build a quote share card image without depending on React/Tailwind.
//
// Why this exists: SVG/foreignObject-based libraries (html-to-image,
// modern-screenshot) keep dropping Korean text from the captured PNG under
// macOS Chrome. html2canvas-pro uses a different code path — it rasterizes
// the DOM into a canvas via parsed CSS, not via SVG foreignObject — and is
// the most robust option for our editorial card layout.
//
// We also build a fresh DOM element each time instead of capturing an
// off-screen React-managed node, so React rerenders, stale inline styles,
// and font-loading races can't quietly break the output.

import type { Quote, Source } from "@/lib/data/types";

const PAPER = "#f5f1e8";
const INK = "#111111";
const MUTED = "#8a857a";
const LINE = "#d9d3c5";

const SERIF = '"Cormorant Garamond", Georgia, "Times New Roman", serif';
const MONO = '"IBM Plex Mono", ui-monospace, "SFMono-Regular", monospace';

export async function buildQuoteCardPng(
  quote: Quote,
  source: Source,
): Promise<string> {
  // Ensure all in-progress font loads finish before capture so text isn't
  // measured mid font-swap.
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore */
    }
  }

  // Create the card off-DOM, append for layout, capture, then clean up.
  const host = buildCardElement(quote, source);
  document.body.appendChild(host);
  try {
    const html2canvas = (await import("html2canvas-pro")).default;
    const canvas = await html2canvas(host, {
      backgroundColor: PAPER,
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: host.offsetWidth,
      windowHeight: host.offsetHeight,
    });
    return canvas.toDataURL("image/png");
  } finally {
    host.remove();
  }
}

function buildCardElement(quote: Quote, source: Source): HTMLDivElement {
  // Park the host above the viewport — fully rendered, just out of sight.
  // We can't use opacity:0 here: html2canvas honors inherited opacity, which
  // would render every child fully transparent and leave us with only the
  // canvas's backgroundColor fill (which was the previous bug).
  const host = document.createElement("div");
  Object.assign(host.style, {
    position: "fixed",
    left: "0",
    top: "-10000px",
    width: "640px",
    pointerEvents: "none",
  } as Partial<CSSStyleDeclaration>);

  const card = document.createElement("div");
  Object.assign(card.style, {
    background: PAPER,
    color: INK,
    padding: "48px",
    border: `1px solid ${INK}`,
    fontFamily: SERIF,
    boxSizing: "border-box",
    width: "640px",
  } as Partial<CSSStyleDeclaration>);

  card.appendChild(
    line({
      text: `AFTERLINE / ${source.type.toUpperCase()}`,
      font: MONO,
      size: 10,
      color: MUTED,
      letterSpacing: "0.3em",
      marginBottom: "40px",
    }),
  );

  const quoteEl = document.createElement("div");
  Object.assign(quoteEl.style, {
    fontFamily: SERIF,
    fontSize: "38px",
    lineHeight: "1.25",
    color: INK,
    whiteSpace: "pre-wrap",
    wordBreak: "keep-all",
    margin: "0",
  } as Partial<CSSStyleDeclaration>);
  quoteEl.textContent = quote.text;
  card.appendChild(quoteEl);

  const footer = document.createElement("div");
  Object.assign(footer.style, {
    marginTop: "40px",
    paddingTop: "24px",
    borderTop: `1px solid ${LINE}`,
  } as Partial<CSSStyleDeclaration>);

  footer.appendChild(
    line({
      text: source.title,
      font: SERIF,
      size: 18,
      color: INK,
    }),
  );
  if (source.creator) {
    footer.appendChild(
      line({
        text: `— ${source.creator}`,
        font: SERIF,
        size: 16,
        color: MUTED,
        marginTop: "4px",
      }),
    );
  }
  if (quote.mood_tags.length > 0) {
    const tagRow = document.createElement("div");
    Object.assign(tagRow.style, {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      marginTop: "16px",
    } as Partial<CSSStyleDeclaration>);
    for (const t of quote.mood_tags) {
      const chip = document.createElement("span");
      Object.assign(chip.style, {
        fontFamily: MONO,
        fontSize: "9px",
        letterSpacing: "0.2em",
        border: `1px solid ${INK}`,
        padding: "2px 8px",
        color: INK,
      } as Partial<CSSStyleDeclaration>);
      chip.textContent = `#${t.toUpperCase()}`;
      tagRow.appendChild(chip);
    }
    footer.appendChild(tagRow);
  }
  card.appendChild(footer);

  card.appendChild(
    line({
      text: "AFTERLINE — LINES THAT STAYED",
      font: MONO,
      size: 9,
      color: MUTED,
      letterSpacing: "0.3em",
      marginTop: "48px",
    }),
  );

  host.appendChild(card);
  return host;
}

function line(opts: {
  text: string;
  font: string;
  size: number;
  color: string;
  letterSpacing?: string;
  marginTop?: string;
  marginBottom?: string;
}): HTMLDivElement {
  const el = document.createElement("div");
  Object.assign(el.style, {
    fontFamily: opts.font,
    fontSize: `${opts.size}px`,
    color: opts.color,
    letterSpacing: opts.letterSpacing ?? "normal",
    marginTop: opts.marginTop ?? "0",
    marginBottom: opts.marginBottom ?? "0",
  } as Partial<CSSStyleDeclaration>);
  el.textContent = opts.text;
  return el;
}
