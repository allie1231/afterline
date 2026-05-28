"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Supabase 에러 메시지를 재영이 읽기 쉬운 한국어로 바꿔준다.
function friendlyError(message: string) {
  if (message.includes("Invalid login credentials")) {
    return "이메일 또는 비밀번호가 맞지 않아요.";
  }
  if (message.includes("Email not confirmed")) {
    return "이메일 인증이 아직 안 됐어요. 메일함의 확인 링크를 눌러주세요.";
  }
  if (message.includes("User already registered")) {
    return "이미 가입된 이메일이에요. SIGN IN으로 들어가세요.";
  }
  if (message.includes("Password should be at least")) {
    return "비밀번호는 6자 이상이어야 해요.";
  }
  return message;
}

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
        setError(friendlyError(err.message));
        setStatus("error");
        return;
      }

      setStatus("success");
      router.push("/");
      router.refresh();
      return;
    }

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
    });

    if (err) {
      setError(friendlyError(err.message));
      setStatus("error");
      return;
    }

    // 이메일 확인이 꺼져 있으면 가입과 동시에 세션이 생긴다 → 바로 들어간다.
    if (data.session) {
      setStatus("success");
      router.push("/");
      router.refresh();
      return;
    }

    setStatus("success");
    setMessage("계정이 만들어졌어요. 메일함의 확인 링크를 누른 뒤 SIGN IN으로 들어가세요.");
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
