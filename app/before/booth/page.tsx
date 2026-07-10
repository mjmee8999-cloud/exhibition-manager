// 부스 시뮬레이션 화면입니다.
//  - 승균님(Dennis)이 별도로 만든 부스 배치 시뮬레이터를 화면 안에 그대로 불러옵니다(iframe).
//  - 지금은 링크 연결 방식이에요. 나중에 완성본이 나오면 소스를 직접 이식할 수도 있어요.
//  - URL이 바뀌면 아래 BOOTH_URL 한 곳만 고치면 됩니다.

// 승균님 부스 시뮬레이터 주소 (Vercel 배포본)
const BOOTH_URL =
  "https://homedant-booth-simulator-71yw1fk04-dennis-cho-s-projects.vercel.app/";

export default function BoothPage() {
  return (
    <main className="flex h-[calc(100vh-1px)] w-full flex-col px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">부스 시뮬레이션</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            부스 배치를 미리 시뮬레이션해 봅니다. (승균님 제작 도구 연결)
          </p>
        </div>
        <a
          href={BOOTH_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-blue-500 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/30"
        >
          ↗ 새 탭에서 크게 열기
        </a>
      </div>

      {/* 시뮬레이터를 화면 안에 그대로 표시 */}
      <div className="mt-4 flex-1 overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
        <iframe
          src={BOOTH_URL}
          title="부스 시뮬레이터"
          className="h-full w-full"
          allow="fullscreen"
        />
      </div>

      <p className="mt-2 text-xs text-zinc-400">
        ※ 시뮬레이터가 안 보이면 위 「새 탭에서 크게 열기」로 열어 주세요. (외부 도구라 가끔 주소가 바뀔 수 있어요.)
      </p>
    </main>
  );
}
