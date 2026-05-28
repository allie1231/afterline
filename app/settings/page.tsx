import { getOrCreateApiToken } from "@/lib/data/repository";
import { RegenerateTokenButton } from "@/components/RegenerateTokenButton";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const token = await getOrCreateApiToken();

  return (
    <section className="px-6 py-12 max-w-2xl mx-auto">
      <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-8">
        AFTERLINE / SETTINGS
      </div>

      <h1 className="font-serif text-5xl tracking-tight leading-none">
        Settings
      </h1>
      <p className="font-serif text-lg text-muted mt-3">
        외부 클라이언트 — 크롬 확장, 북마클릿, 스크립트 — 가 Afterline에
        문장을 보내는 데 쓰는 개인용 키예요.
      </p>

      <div className="mt-12 border border-ink p-6">
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-3">
          PERSONAL TOKEN
        </div>
        <div className="font-mono text-xs break-all bg-paper border border-line p-4 select-all">
          {token}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 flex-wrap">
          <p className="font-mono text-[10px] tracking-[0.15em] text-muted leading-relaxed max-w-md">
            비밀번호처럼 다뤄주세요. 노출됐다고 생각되면 REGENERATE으로 새
            토큰을 발급할 수 있어요. (기존 토큰은 즉시 무효화)
          </p>
          <RegenerateTokenButton />
        </div>
      </div>

      <div className="mt-10">
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-3">
          HOW TO USE / 사용법
        </div>
        <p className="font-serif text-base leading-relaxed">
          이 토큰을 헤더에 담아 <code className="font-mono">POST /api/quick-add</code>
          로 문장을 보내면, URL을 기준으로 출처를 찾거나 새로 만들고 그 아래에
          quote로 저장됩니다.
        </p>
        <pre className="mt-4 font-mono text-[11px] leading-relaxed bg-paper border border-line p-4 overflow-x-auto">
{`curl -X POST https://afterline-pi.vercel.app/api/quick-add \\
  -H "Authorization: Bearer <위 토큰>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "수집할 문장",
    "page_url": "https://example.com/article",
    "page_title": "글 제목",
    "page_creator": "지은이"
  }'`}
        </pre>
      </div>
    </section>
  );
}
