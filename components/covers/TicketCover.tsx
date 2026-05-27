import type { Source } from "@/lib/data/types";

function fmtTicketDate(iso?: string, fallback?: string) {
  if (!iso) return fallback ?? "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback ?? "—";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function MetaItem({
  label,
  value,
  align = "left",
}: {
  label: string;
  value: string;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <div className="font-mono text-[7px] tracking-[0.3em] opacity-70">
        {label}
      </div>
      <div className="font-mono text-[12px] tracking-[0.1em] mt-0.5">
        {value}
      </div>
    </div>
  );
}

export function TicketCover({
  source,
  accent,
  contrast,
}: {
  source: Source;
  accent: string;
  contrast: "light" | "dark";
}) {
  const fg = contrast === "dark" ? "var(--white)" : "var(--ink)";
  const fgMuted =
    contrast === "dark" ? "rgba(255,255,255,0.75)" : "rgba(17,17,17,0.65)";
  const divider =
    contrast === "dark" ? "rgba(255,255,255,0.25)" : "rgba(17,17,17,0.18)";

  // Derive playful but stable meta values from the source id so each ticket
  // looks unique without needing real data.
  const hash = source.id
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hall = ((hash % 9) + 1).toString();
  const seat = `${(hash % 12) + 1}-${String((hash % 30) + 1).padStart(2, "0")}`;
  const runtime = `${90 + (hash % 90)}min`;

  return (
    <div
      className="relative w-full h-full overflow-hidden flex flex-col"
      style={{ background: accent, color: fg }}
    >
      {/* Notch holes on the perforation seam */}
      <div
        className="absolute left-[-6px] top-[59%] w-3 h-3 rounded-full"
        style={{ background: "var(--paper)" }}
      />
      <div
        className="absolute right-[-6px] top-[59%] w-3 h-3 rounded-full"
        style={{ background: "var(--paper)" }}
      />

      {/* Top section */}
      <div className="px-3.5 pt-3 flex flex-col gap-2 h-[59%]">
        {/* Top label */}
        <div
          className="flex justify-between font-mono text-[7px] tracking-[0.3em]"
          style={{ color: fgMuted }}
        >
          <span>AFTERLINE CINEMA</span>
          <span>ADMIT ONE</span>
        </div>

        {/* Title */}
        <div>
          <h3 className="font-serif text-[26px] leading-[0.9] tracking-tight break-words italic">
            {source.title}
          </h3>
          <div
            className="font-serif italic text-[10px] leading-snug mt-1.5"
            style={{ color: fgMuted }}
          >
            A film by {source.creator ?? "—"}
          </div>
        </div>

        {/* Director + genre */}
        <div
          className="pt-1.5 mt-0.5 border-t"
          style={{ borderColor: divider }}
        >
          {source.creator && (
            <div className="font-serif text-[13px] leading-tight">
              {source.creator}
            </div>
          )}
          <div
            className="font-mono text-[8px] tracking-[0.25em] mt-0.5"
            style={{ color: fgMuted }}
          >
            FEATURE / DRAMA
          </div>
        </div>

        {/* Hall / Seat / No. grid */}
        <div className="grid grid-cols-3 gap-1.5 mt-auto">
          <MetaItem label="HALL" value={hall} />
          <MetaItem label="SEAT" value={seat} />
          <MetaItem
            label="NO."
            value={source.id.slice(-3).toUpperCase()}
          />
        </div>
      </div>

      {/* Perforation */}
      <div className="relative">
        <div
          className="border-t border-dashed mx-3"
          style={{ borderColor: divider }}
        />
      </div>

      {/* Bottom stub */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* Poster fill — uses real image if provided, otherwise a giant ghost title */}
        {source.cover_url ? (
          <div className="absolute inset-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={source.cover_url}
              alt={`${source.title} poster`}
              className="w-full h-full object-cover"
            />
            {/* tint with accent so it reads as part of the ticket */}
            <div
              className="absolute inset-0 mix-blend-multiply"
              style={{ background: accent, opacity: 0.55 }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.5) 100%)",
              }}
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-end justify-center pb-8 pointer-events-none">
            <span
              className="font-serif uppercase text-[60px] leading-[0.85] tracking-tight text-center break-words px-2"
              style={{ color: fg, opacity: 0.12 }}
            >
              {source.title}
            </span>
          </div>
        )}

        {/* Date / Time row */}
        <div className="relative px-3.5 pt-3 flex justify-between">
          <MetaItem
            label="DATE"
            value={fmtTicketDate(undefined, source.published_date ?? "—")}
          />
          <MetaItem label="TIME" value={runtime} align="right" />
        </div>

        {/* Barcode */}
        <div className="relative mt-auto px-3.5 pb-2.5">
          <div className="flex gap-[2px] h-3 mb-1">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className="flex-1"
                style={{
                  background: fg,
                  opacity: ((i * 53) % 7) / 10 + 0.35,
                }}
              />
            ))}
          </div>
          <div
            className="font-mono text-[7px] tracking-[0.35em] text-center"
            style={{ color: fgMuted }}
          >
            {source.id.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}
