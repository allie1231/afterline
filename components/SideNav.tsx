"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Single source of truth for the sidebar entries.
const NAV = [
  { href: "/", en: "INDEX", ko: "색인" },
  { href: "/rooms", en: "ROOMS", ko: "방" },
  { href: "/quotes/new", en: "NEW LINE", ko: "새 문장" },
  { href: "/capture", en: "CAPTURE", ko: "빠른 수집" },
  { href: "/notes", en: "NOTES", ko: "노트" },
  { href: "/people", en: "PEOPLE", ko: "저자" },
  { href: "/collections", en: "COLLECTIONS", ko: "수집노트" },
  { href: "/mood", en: "TAGS", ko: "태그" },
  { href: "/stats", en: "STATS", ko: "통계" },
  { href: "/review", en: "REVIEW", ko: "연말 요약" },
  { href: "/data", en: "DATA", ko: "데이터" },
  { href: "/settings", en: "SETTINGS", ko: "설정" },
];

// Tiny module-level signal so any client can open/close the drawer.
// (Lighter than a context provider for this single shared state.)
type Listener = (open: boolean) => void;
const listeners = new Set<Listener>();
let state = false;
function set(next: boolean) {
  state = next;
  for (const l of listeners) l(state);
}
export function openSideNav() {
  set(true);
}

export function SideNavTrigger() {
  return (
    <button
      type="button"
      onClick={openSideNav}
      className="font-mono text-[10px] tracking-[0.25em] border border-ink px-3 py-2 hover:bg-ink hover:text-paper transition-colors"
      aria-label="Open menu"
    >
      ☰ MENU
    </button>
  );
}

// Drawer: rendered once at app layout level. Slides in from the LEFT,
// shows every nav entry stacked vertically. Closes on backdrop, route
// change, or Esc.
export function SideNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Subscribe to the module signal.
  useEffect(() => {
    const l: Listener = (v) => setOpen(v);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  // Close on route change.
  useEffect(() => {
    set(false);
  }, [pathname]);

  // Esc to close + body scroll lock while open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") set(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-ink/55"
        onClick={() => set(false)}
        aria-hidden
      />
      <aside className="fixed left-0 top-0 bottom-0 z-50 w-[min(320px,85vw)] bg-paper border-r border-ink flex flex-col">
        <header className="flex items-center justify-between px-5 py-4 border-b border-ink">
          <Link href="/" className="font-serif text-xl tracking-[0.18em]">
            AFTERLINE
          </Link>
          <button
            type="button"
            onClick={() => set(false)}
            className="text-xl leading-none text-muted hover:text-ink"
            aria-label="Close menu"
          >
            ×
          </button>
        </header>

        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-baseline justify-between px-5 py-4 border-b border-line transition-colors ${
                  active ? "bg-line/50" : "hover:bg-line/30"
                }`}
              >
                <span className="font-serif text-2xl">{item.en}</span>
                <span className="font-mono text-[10px] tracking-[0.25em] text-muted">
                  {item.ko}
                </span>
              </Link>
            );
          })}
        </nav>

        <form action="/auth/signout" method="post" className="border-t border-ink">
          <button
            type="submit"
            className="w-full px-5 py-4 font-mono text-[10px] tracking-[0.3em] text-muted hover:bg-line/40 transition-colors text-left flex items-baseline justify-between"
          >
            <span>SIGN OUT</span>
            <span className="text-[9px]">로그아웃</span>
          </button>
        </form>
      </aside>
    </>
  );
}
