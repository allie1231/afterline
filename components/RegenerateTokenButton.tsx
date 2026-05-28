"use client";

import { useTransition } from "react";
import { regenerateTokenAction } from "@/app/settings/actions";

export function RegenerateTokenButton() {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            "토큰을 새로 발급할까요? 기존 토큰을 쓰고 있는 모든 곳(확장 등)에서 다시 붙여넣어야 해요.",
          )
        ) {
          return;
        }
        start(async () => {
          await regenerateTokenAction();
        });
      }}
      className="font-mono text-[10px] tracking-[0.3em] border border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
    >
      [ {pending ? "..." : "REGENERATE"} ]
    </button>
  );
}
