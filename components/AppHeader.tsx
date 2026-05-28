import Link from "next/link";
import { SearchTrigger } from "./SearchTrigger";
import { MobileNav } from "./MobileNav";

const NAV = [
  { href: "/", en: "INDEX", ko: "색인" },
  { href: "/rooms", en: "ROOMS", ko: "방" },
  { href: "/quotes/new", en: "NEW LINE", ko: "새 문장" },
  { href: "/capture", en: "CAPTURE", ko: "빠른 수집" },
  { href: "/notes", en: "NOTES", ko: "노트" },
  { href: "/collections", en: "COLLECTIONS", ko: "수집노트" },
  { href: "/mood", en: "TAGS", ko: "태그" },
  { href: "/stats", en: "STATS", ko: "통계" },
  { href: "/data", en: "DATA", ko: "데이터" },
  { href: "/settings", en: "SETTINGS", ko: "설정" },
];

export function AppHeader() {
  return (
    <header className="border-b border-line bg-paper">
      <div className="flex items-end justify-between px-4 sm:px-6 py-4 sm:py-5 gap-4">
        <Link
          href="/"
          className="font-serif text-xl sm:text-2xl tracking-[0.18em] leading-none shrink-0"
        >
          AFTERLINE
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex gap-6 items-end">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono text-[10px] tracking-[0.2em] text-ink hover:text-red transition-colors flex flex-col items-start leading-tight"
            >
              <span>{item.en}</span>
              <span className="text-muted text-[9px] mt-0.5">{item.ko}</span>
            </Link>
          ))}
          <SearchTrigger />
          <form action="/auth/signout" method="post" className="ml-2">
            <button
              type="submit"
              className="font-mono text-[10px] tracking-[0.2em] text-muted hover:text-ink transition-colors flex flex-col items-start leading-tight cursor-pointer"
            >
              <span>SIGN OUT</span>
              <span className="text-[9px] mt-0.5">로그아웃</span>
            </button>
          </form>
        </nav>

        {/* Mobile: just search + menu */}
        <div className="lg:hidden flex items-center gap-3">
          <SearchTrigger />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
