"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

// Hide on routes where it would just get in the way (iframe widgets, login).
const HIDDEN_PREFIXES = ["/embed", "/login"];

export function FloatingNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    function update() {
      const y = window.scrollY;
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      // Only surface the arrows when there's somewhere to actually go.
      setCanScrollUp(y > 200);
      setCanScrollDown(max - y > 200);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  function toTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function toBottom() {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  }
  function back() {
    router.back();
  }

  return (
    <div
      className="fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-30 flex flex-col gap-2"
      aria-label="페이지 이동"
    >
      <Btn onClick={back} label="←" title="뒤로 / 이전 페이지" />
      {canScrollUp && <Btn onClick={toTop} label="↑" title="최상단으로" />}
      {canScrollDown && <Btn onClick={toBottom} label="↓" title="최하단으로" />}
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
      className="w-11 h-11 flex items-center justify-center bg-paper text-ink border border-ink font-mono text-base leading-none shadow-[3px_3px_0_var(--ink)] hover:bg-ink hover:text-paper hover:shadow-[1px_1px_0_var(--ink)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
    >
      {label}
    </button>
  );
}
