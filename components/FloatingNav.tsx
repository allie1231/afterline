"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const HIDDEN_PREFIXES = ["/embed", "/login"];

// Browsers already have a back button; only the home-screen app (standalone)
// needs one of its own. Scroll-to-top appears once the header is far away.
export function FloatingNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [standalone, setStandalone] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true,
    );
  }, []);

  useEffect(() => {
    function update() {
      setScrolled(window.scrollY > 600);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [pathname]);

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const showBack = standalone && pathname !== "/";
  if (!showBack && !scrolled) return null;

  return (
    <div
      className="fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-30 flex divide-x divide-ink border border-ink bg-paper"
      aria-label="페이지 이동"
    >
      {showBack && (
        <Btn onClick={() => router.back()} label="←" title="뒤로" />
      )}
      {scrolled && (
        <Btn
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          label="↑"
          title="맨 위로"
        />
      )}
    </div>
  );
}

function Btn({
  onClick,
  label,
  title,
}: {
  onClick: () => void;
  label: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="w-10 h-10 flex items-center justify-center font-mono text-sm leading-none hover:bg-ink hover:text-paper transition-colors"
    >
      {label}
    </button>
  );
}
