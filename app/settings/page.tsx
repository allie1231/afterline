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
          EMBED WIDGETS / 임베드
        </div>
        <p className="font-serif text-base leading-relaxed">
          노션·블로그·다른 사이트에 iframe으로 박을 수 있는 작은 위젯들이에요.
          토큰이 URL에 들어가니, 공개하는 위치라면 노출 가능성을 염두에 두세요.
        </p>

        <div className="mt-5">
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-1">
            TODAY / 오늘의 한 줄 보기
          </div>
          <pre className="font-mono text-[11px] leading-relaxed bg-paper border border-line p-3 overflow-x-auto">
            {`https://afterline-pi.vercel.app/embed/today?token=${token}`}
          </pre>
        </div>

        <div className="mt-4">
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-1">
            QUICK ADD / 빠른 추가 폼
          </div>
          <pre className="font-mono text-[11px] leading-relaxed bg-paper border border-line p-3 overflow-x-auto">
            {`https://afterline-pi.vercel.app/embed/add?token=${token}`}
          </pre>
          <p className="font-mono text-[10px] text-muted mt-2 leading-relaxed">
            기본 inbox 이름은 "Quick Notes". URL 끝에{" "}
            <code>&title=다른이름</code>을 붙이면 그 이름의 소스에 모여요.
          </p>
        </div>
      </div>

      <div className="mt-10">
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-3">
          API / 직접 호출 (스크립트·단축어)
        </div>
        <p className="font-serif text-base leading-relaxed">
          iOS 단축어나 스크립트에서 쓸 때는 이 엔드포인트를 직접 호출하면 됩니다.
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
