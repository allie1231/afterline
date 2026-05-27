import Link from "next/link";
import { countByRoom, getRoomCategories } from "@/lib/data/repository";

export default async function RoomsPage() {
  const categories = await getRoomCategories();
  const counts = await countByRoom();

  return (
    <section className="px-6 py-10">
      <div className="flex items-baseline justify-between mb-10">
        <h2 className="font-serif text-4xl tracking-tight">Rooms</h2>
        <span className="font-mono text-[10px] tracking-[0.25em] text-muted">
          SELECT A DOOR / 문을 선택하세요
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-ink border border-ink">
        {categories.map((cat) => {
          const c = counts[cat.type];
          const isLight = cat.contrast === "light";
          const fg = isLight ? "var(--ink)" : "var(--white)";
          const fgMuted = isLight
            ? "rgba(17,17,17,0.55)"
            : "rgba(255,255,255,0.7)";
          const divider = isLight
            ? "rgba(17,17,17,0.18)"
            : "rgba(255,255,255,0.25)";

          return (
            <Link
              key={cat.type}
              href={`/rooms/${cat.type}`}
              className="group relative p-8 min-h-[320px] flex flex-col justify-between transition-[transform,filter] duration-300 ease-out hover:[transform:translateY(-6px)_scale(1.015)] hover:brightness-[1.04]"
              style={{ background: cat.accent, color: fg }}
            >
              <div className="flex justify-between items-start">
                <span
                  className="font-mono text-[10px] tracking-[0.3em]"
                  style={{ color: fgMuted }}
                >
                  ROOM / 0{categories.indexOf(cat) + 1}
                </span>
                <span
                  className="font-mono text-[10px] tracking-[0.3em] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-[opacity,transform] duration-300 ease-out"
                  style={{ color: fgMuted }}
                >
                  ENTER →
                </span>
              </div>

              <div>
                <div
                  className={`font-serif leading-[0.95] tracking-tight break-words ${
                    cat.en.length > 10
                      ? "text-[clamp(32px,3.4vw,46px)]"
                      : "text-[clamp(40px,5vw,64px)]"
                  }`}
                >
                  {cat.en}
                </div>
                <div
                  className="font-mono text-[11px] tracking-[0.3em] mt-2"
                  style={{ color: fgMuted }}
                >
                  {cat.ko}
                </div>
                <div
                  className="h-px w-12 my-5"
                  style={{ background: divider }}
                />
                <div className="font-serif text-lg leading-snug max-w-[24ch]">
                  {cat.description}
                </div>
              </div>

              <div
                className="flex justify-between font-mono text-[10px] tracking-[0.25em] pt-4 border-t"
                style={{ borderColor: divider }}
              >
                <span>{String(c.sources).padStart(3, "0")} SOURCES</span>
                <span>{String(c.lines).padStart(3, "0")} LINES</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
