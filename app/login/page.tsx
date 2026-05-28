"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (err) {
      setError(err.message);
      setStatus("error");
    } else {
      setStatus("sent");
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
          매직링크를 보내드릴게요. 메일함에서 링크를 누르면 들어와집니다.
        </p>

        {status === "sent" ? (
          <div className="mt-12 border border-ink p-6">
            <div className="font-mono text-[10px] tracking-[0.3em] text-muted">
              EMAIL SENT
            </div>
            <p className="font-serif text-xl mt-3">
              {email} 으로 보냈어요.
            </p>
            <p className="font-mono text-xs text-muted mt-3">
              메일이 안 보이면 스팸함도 확인해보세요. 1~2분 걸릴 수 있어요.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-12 flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.3em] text-muted">
                EMAIL / 이메일
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="border border-ink bg-paper px-4 py-3 font-serif text-lg focus:outline-none focus:border-blue"
              />
            </label>
            <button
              type="submit"
              disabled={status === "sending"}
              className="font-mono text-xs tracking-[0.3em] border border-ink px-6 py-4 hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
            >
              [ {status === "sending" ? "SENDING…" : "SEND MAGIC LINK"} ]
            </button>
            {error && (
              <div className="font-mono text-xs text-red mt-2">{error}</div>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
