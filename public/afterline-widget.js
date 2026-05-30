// Afterline — Scriptable widget for iOS
// =====================================
//
// 1) Install the "Scriptable" app from the App Store (free).
// 2) Open Scriptable → + → paste this entire file.
// 3) At the top, replace AFTERLINE_TOKEN with your token from
//    https://afterline-pi.vercel.app/settings
// 4) Run the script once to verify it shows a line.
// 5) Long-press the home screen → + → Scriptable → choose this script.
//    Set "When Interacting: Run Script" if you want a tap to refresh.
//
// Widget refreshes hourly. The same line shows all day (deterministic
// pick by day-of-year), then rotates after midnight.

// ── CONFIG ────────────────────────────────────────────────────────────
const AFTERLINE_BASE = "https://afterline-pi.vercel.app";
const AFTERLINE_TOKEN = "PASTE_YOUR_TOKEN_HERE";

// ── COLORS — match the editorial palette ──────────────────────────────
const PAPER = new Color("#f5f1e8");
const INK = new Color("#111111");
const MUTED = new Color("#8a857a");
const LINE = new Color("#d9d3c5");

// ── FETCH ─────────────────────────────────────────────────────────────
async function fetchLine() {
  const url = `${AFTERLINE_BASE}/api/today?token=${encodeURIComponent(
    AFTERLINE_TOKEN,
  )}`;
  const req = new Request(url);
  req.timeoutInterval = 8;
  try {
    return await req.loadJSON();
  } catch (e) {
    return { error: String(e) };
  }
}

// ── WIDGET BUILD ──────────────────────────────────────────────────────
function buildWidget(line) {
  const w = new ListWidget();
  w.backgroundColor = PAPER;
  const family = config.widgetFamily ?? "medium";
  const pad = family === "small" ? 12 : 16;
  w.setPadding(pad, pad, pad, pad);

  // Header strip
  const header = w.addText("AFTERLINE");
  header.font = Font.regularMonospacedSystemFont(8);
  header.textColor = MUTED;

  w.addSpacer(family === "small" ? 6 : 10);

  if (!line || line.error) {
    const err = w.addText(line?.error ?? "no response");
    err.font = Font.systemFont(11);
    err.textColor = MUTED;
    err.minimumScaleFactor = 0.6;
    return w;
  }

  if (!line.text) {
    const empty = w.addText("아직 모은 문장이 없어요.");
    empty.font = Font.systemFont(12);
    empty.textColor = MUTED;
    return w;
  }

  // The line — biggest element. Sizes pulled per widget family so it
  // breathes on small but uses the canvas on large.
  const sizeByFamily = { small: 13, medium: 16, large: 22 };
  const lineEl = w.addText(`"${line.text.trim()}"`);
  lineEl.font = Font.semiboldSystemFont(sizeByFamily[family] ?? 16);
  lineEl.textColor = INK;
  lineEl.minimumScaleFactor = 0.55;
  lineEl.lineLimit = family === "small" ? 6 : family === "medium" ? 7 : 14;

  w.addSpacer();

  // Footer — source
  if (line.source_title || line.source_creator) {
    const rule = w.addStack();
    rule.size = new Size(0, 0);
    const sep = w.addText("");
    sep.font = Font.systemFont(2);

    const meta = [line.source_title, line.source_creator]
      .filter(Boolean)
      .join(" — ");
    const footer = w.addText(meta);
    footer.font = Font.regularMonospacedSystemFont(8);
    footer.textColor = MUTED;
    footer.minimumScaleFactor = 0.6;
    footer.lineLimit = 2;
  }

  // Tap target — open the source detail page if we have an id, or just
  // /capture so the user can drop a new line in.
  w.url = `${AFTERLINE_BASE}/`;
  return w;
}

// ── RUN ───────────────────────────────────────────────────────────────
const line = await fetchLine();
const widget = buildWidget(line);
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  // Preview mode inside Scriptable app.
  await widget.presentMedium();
}
Script.complete();
