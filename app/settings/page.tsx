import Link from "next/link";
import { getOrCreateApiToken } from "@/lib/data/repository";
import { Breadcrumb } from "@/components/Breadcrumb";

export const revalidate = 300;

export default async function SettingsPage() {
  const token = await getOrCreateApiToken();

  return (
    <section className="px-6 py-12 max-w-2xl mx-auto">
      <Breadcrumb
        crumbs={[{ label: "AFTERLINE", href: "/" }, { label: "SETTINGS" }]}
        className="mb-8"
      />

      <h1 className="font-serif text-5xl tracking-tight leading-none">
        Settings
      </h1>
      <p className="font-sans text-lg text-muted mt-3">
        Afterline은 읽기 전용이에요. 문장과 책은 노션에서 쓰고 고치면, 여기에는
        5분 안에 반영됩니다.
      </p>

      <div className="mt-12">
        <div className="font-mono text-[11px] tracking-[0.3em] text-muted mb-3">
          iOS WIDGET / <span className="tracking-normal">홈 화면 위젯</span>
        </div>
        <p className="font-sans text-base leading-relaxed">
          무료 앱 <strong>Scriptable</strong> 을 깔면 홈 화면에 오늘의 한 줄
          위젯을 박을 수 있어요.
        </p>
        <ol className="mt-4 ml-5 list-decimal font-sans text-base leading-relaxed flex flex-col gap-1.5">
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
            을 아래 PERSONAL TOKEN 으로 교체
          </li>
          <li>한 번 실행해서 미리보기 확인</li>
          <li>
            홈 화면 길게 누르기 → + → Scriptable → 위젯 사이즈 선택 → 이
            스크립트 지정
          </li>
        </ol>
        <p className="font-mono text-[11px] tracking-[0.2em] text-muted mt-4 leading-relaxed tracking-normal">
          매 시간 자동 새로고침. 하루 동안은 같은 문장, 자정에 다음 문장으로
          넘어가요. 위젯 탭하면 Afterline 홈으로 이동.
        </p>
      </div>

      <div className="mt-10 border border-ink p-6">
        <div className="font-mono text-[11px] tracking-[0.3em] text-muted mb-3">
          PERSONAL TOKEN
        </div>
        <div className="font-mono text-xs break-all bg-paper border border-line p-4 select-all">
          {token}
        </div>
        <p className="font-sans text-[13px] text-muted mt-4 leading-relaxed">
          위젯이 오늘의 한 줄을 읽어갈 때 쓰는 키예요. 읽기 전용이라 이 키로는
          아무것도 고칠 수 없지만, 비밀번호처럼 다뤄주세요.
        </p>
        <pre className="mt-4 font-mono text-xs leading-relaxed bg-paper border border-line p-4 overflow-x-auto">
{`curl "https://afterline-pi.vercel.app/api/today?token=<위 토큰>"`}
        </pre>
      </div>

      <div className="mt-10 border-t border-line pt-10">
        <div className="font-mono text-[11px] tracking-[0.3em] text-muted mb-3">
          ADMIN TOOLS / <span className="tracking-normal">관리 도구</span>
        </div>
        <Link
          href="/admin"
          className="inline-block font-mono text-[11px] tracking-[0.3em] border border-ink px-6 py-3 hover:bg-ink hover:text-paper transition-colors"
        >
          BOOK ENRICHMENT →
        </Link>
        <p className="font-sans text-[13px] text-muted mt-3 leading-relaxed max-w-md">
          노션 책장의 빈 ISBN·페이지수·판형을 국립중앙도서관에서 찾아 채웁니다.
          여기서만 노션에 씁니다.
        </p>
      </div>
    </section>
  );
}
