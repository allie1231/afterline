import Link from "next/link";

const NAV = [
  { href: "/", en: "INDEX", ko: "색인" },
  { href: "/rooms", en: "ROOMS", ko: "방" },
  { href: "/quotes/new", en: "NEW LINE", ko: "새 문장" },
  { href: "/collections", en: "COLLECTIONS", ko: "수집노트" },
  { href: "/mood", en: "TAGS", ko: "태그" },
  { href: "/data", en: "DATA", ko: "데이터" },
];

export function AppHeader() {
  return (
    <header className="border-b border-line bg-paper">
      <div className="flex items-end justify-between px-6 py-5">
        <Link href="/" className="font-serif text-2xl tracking-[0.18em] leading-none">
          AFTERLINE
        </Link>
        <nav className="flex gap-6 items-end">
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
      </div>
    </header>
  );
}
