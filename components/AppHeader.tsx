import Link from "next/link";
import { SearchTrigger } from "./SearchTrigger";
import { SideNavTrigger } from "./SideNav";

// Same compact bar at every screen size now — a MENU button on the left
// opens a left-aligned vertical sidebar with all routes.
export function AppHeader() {
  return (
    <header className="border-b border-line bg-paper">
      <div className="flex items-end justify-between px-4 sm:px-6 py-4 sm:py-5 gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <SideNavTrigger />
          <Link
            href="/"
            className="font-serif text-xl sm:text-2xl tracking-[0.18em] leading-none shrink-0"
          >
            AFTERLINE
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <SearchTrigger />
          <form action="/auth/signout" method="post" className="hidden sm:block">
            <button
              type="submit"
              className="font-mono text-[10px] tracking-[0.2em] text-muted hover:text-ink transition-colors flex flex-col items-start leading-tight cursor-pointer"
            >
              <span>SIGN OUT</span>
              <span className="text-[9px] mt-0.5">로그아웃</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
