"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleGoogle() {
    setStatus("loading");
    setError("");

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    // 성공 시 브라우저가 Google로 리다이렉트되므로 여기 도달하지 않는다.
    if (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  return (
    <section className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted">
          AFTERLINE / ENTRY
        </div>

        <h1 className="font-serif text-6xl tracking-tight leading-none mt-4">
          Enter
        </h1>

        <p className="font-serif text-xl text-muted mt-4 max-w-sm">
          구글 계정으로 Afterline에 들어갑니다.
        </p>

        <div className="mt-12 flex flex-col gap-4">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={status === "loading"}
            className="font-mono text-xs tracking-[0.3em] border border-ink px-6 py-4 hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
          >
            [ {status === "loading" ? "REDIRECTING…" : "SIGN IN WITH GOOGLE"} ]
          </button>

          {error && (
            <div className="font-mono text-xs text-red mt-2">{error}</div>
          )}
        </div>
      </div>
    </section>
  );
}
