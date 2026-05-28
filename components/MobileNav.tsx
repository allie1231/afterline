"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  { href: "/data", en: "DATA", ko: "데이터" },
  { href: "/settings", en: "SETTINGS", ko: "설정" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock scroll while open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-[10px] tracking-[0.25em] border border-ink px-3 py-2 hover:bg-ink hover:text-paper transition-colors"
        aria-label="Open menu"
      >
        MENU
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/55"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="fixed right-0 top-0 bottom-0 z-50 w-[min(320px,85vw)] bg-paper border-l border-ink flex flex-col">
            <header className="flex items-center justify-between px-5 py-4 border-b border-ink">
              <span className="font-serif text-xl tracking-[0.15em]">
                AFTERLINE
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xl leading-none text-muted hover:text-ink"
                aria-label="Close menu"
              >
                ×
              </button>
            </header>

            <nav className="flex-1 overflow-y-auto py-2">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-baseline justify-between px-5 py-4 border-b border-line hover:bg-line/40 transition-colors"
                >
                  <span className="font-serif text-2xl">{item.en}</span>
                  <span className="font-mono text-[10px] tracking-[0.25em] text-muted">
                    {item.ko}
                  </span>
                </Link>
              ))}
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
      )}
    </>
  );
}
