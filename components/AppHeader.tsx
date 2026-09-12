import Link from "next/link";
import { SearchTrigger } from "./SearchTrigger";
import { SideNavTrigger } from "./SideNav";

// Same compact bar at every screen size now — a MENU button on the left
// opens a left-aligned vertical sidebar with all routes.
export function AppHeader() {
  return (
    <header className="border-b border-line bg-paper">
      {/* Three-column grid: MENU left · AFTERLINE centered · actions right.
          Using grid (not flex) keeps the logo dead-centered regardless of
          how wide MENU or the right cluster get. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 py-4 sm:py-5 gap-4">
        <div className="justify-self-start">
          <SideNavTrigger />
        </div>

        <Link
          href="/"
          className="justify-self-center font-serif text-xl sm:text-2xl tracking-[0.18em] leading-none"
        >
          AFTERLINE
        </Link>

        <div className="justify-self-end flex items-center gap-3">
          <SearchTrigger />
        </div>
      </div>
    </header>
  );
}
