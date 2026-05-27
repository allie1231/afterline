"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setStatus("loading");
    setError("");
    setMessage("");

    const supabase = createClient();

    if (mode === "signin") {
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (err) {
        setError(err.message);
        setStatus("error");
        return;
      }

      setStatus("success");
      router.push("/");
      router.refresh();
      return;
    }

    const { error: err } = await supabase.auth.signUp({
      email,
      password,
    });

    if (err) {
      setError(err.message);
      setStatus("error");
      return;
    }

    setStatus("success");
    setMessage("계정이 만들어졌어요. 이제 SIGN IN으로 들어가보세요.");
    setMode("signin");
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
          이메일과 비밀번호로 Afterline에 들어갑니다.
        </p>

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

          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] tracking-[0.3em] text-muted">
              PASSWORD / 비밀번호
            </span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="border border-ink bg-paper px-4 py-3 font-serif text-lg focus:outline-none focus:border-blue"
            />
          </label>

          <button
            type="submit"
            disabled={status === "loading"}
            className="font-mono text-xs tracking-[0.3em] border border-ink px-6 py-4 hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
          >
            [ {status === "loading" ? "LOADING…" : mode === "signin" ? "SIGN IN" : "SIGN UP"} ]
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
              setMessage("");
              setStatus("idle");
            }}
            className="font-mono text-[10px] tracking-[0.25em] text-muted underline-offset-4 hover:underline"
          >
            {mode === "signin"
              ? "NO ACCOUNT YET? CREATE ACCOUNT"
              : "ALREADY HAVE AN ACCOUNT? SIGN IN"}
          </button>

          {message && (
            <div className="font-mono text-xs text-muted mt-2">{message}</div>
          )}

          {error && (
            <div className="font-mono text-xs text-red mt-2">{error}</div>
          )}
        </form>
      </div>
    </section>
  );
}
