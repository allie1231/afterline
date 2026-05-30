import { getOrCreateApiToken } from "@/lib/data/repository";
import { Breadcrumb } from "@/components/Breadcrumb";
import { RegenerateTokenButton } from "@/components/RegenerateTokenButton";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const token = await getOrCreateApiToken();

  return (
    <section className="px-6 py-12 max-w-2xl mx-auto">
      <Breadcrumb
        crumbs={[
          { label: "AFTERLINE", href: "/" },
          { label: "SETTINGS" },
        ]}
        className="mb-8"
      />

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
          iOS WIDGET / 홈 화면 위젯
        </div>
        <p className="font-serif text-base leading-relaxed">
          무료 앱 <strong>Scriptable</strong> 을 깔면 홈 화면에 오늘의 한 줄
          위젯을 박을 수 있어요.
        </p>
        <ol className="mt-4 ml-5 list-decimal font-serif text-base leading-relaxed flex flex-col gap-1.5">
          <li>
            App Store에서{" "}
            <a
              href="https://apps.apple.com/app/scriptable/id1405459188"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-red"
            >
              Scriptable
            </a>{" "}
            설치
          </li>
          <li>
            <a
              href="/afterline-widget.js"
              download="afterline-widget.js"
              className="underline hover:text-red"
            >
              위젯 스크립트 다운로드
            </a>{" "}
            (또는 새 탭에서 열어 내용 복사)
          </li>
          <li>Scriptable 앱 → + 새 스크립트 → 전체 붙여넣기</li>
          <li>
            스크립트 상단{" "}
            <code className="font-mono text-sm bg-line/40 px-1">
              AFTERLINE_TOKEN
            </code>{" "}
            을 위의 PERSONAL TOKEN 으로 교체
          </li>
          <li>한 번 실행해서 미리보기 확인</li>
          <li>
            홈 화면 길게 누르기 → + → Scriptable → 위젯 사이즈 선택 → 이
            스크립트 지정
          </li>
        </ol>
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted mt-4 leading-relaxed">
          매 시간 자동 새로고침. 하루 동안은 같은 문장, 자정에 다음 문장으로
          넘어가요. 위젯 탭하면 Afterline 홈으로 이동.
        </p>
      </div>

      <div className="mt-10">
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted mb-3">
          API / 직접 호출 (스크립트·단축어)
        </div>
        <p className="font-serif text-base leading-relaxed">
          iOS 단축어나 스크립트에서 쓸 때는 이 엔드포인트를 직접 호출하면 됩니다.
        </p>
        <pre className="mt-4 font-mono text-[11px] leading-relaxed bg-paper border border-line p-4 overflow-x-auto">
{`# 문장 보내기
curl -X POST https://afterline-pi.vercel.app/api/quick-add \\
  -H "Authorization: Bearer <위 토큰>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "수집할 문장",
    "page_url": "https://example.com/article",
    "page_title": "글 제목",
    "page_creator": "지은이"
  }'

# 오늘의 한 줄 가져오기 (JSON)
curl "https://afterline-pi.vercel.app/api/today?token=<위 토큰>"`}
        </pre>
      </div>
    </section>
  );
}
