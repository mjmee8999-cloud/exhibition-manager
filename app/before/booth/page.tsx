// 부스 시뮬레이션 화면입니다.
//  - 승균님(Dennis) 부스 시뮬레이터를 우리가 한국어로 번역해 직접 호스팅합니다.
//  - 실제 앱은 public/booth/ 에 빌드되어 들어있고, 원본 소스는 booth-sim/ 에 있어요.
//    (수정하려면 booth-sim/에서 고친 뒤 다시 빌드해 public/booth/에 넣으면 됩니다. booth-sim/README 참고)

// 우리 앱 안에 호스팅된 부스 시뮬레이터 주소
const BOOTH_URL = "/booth/index.html";

export default function BoothPage() {
  return (
    <main className="flex h-[calc(100vh-1px)] w-full flex-col px-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">부스 시뮬레이션</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          부스 배치를 미리 시뮬레이션해 봅니다. (승균님 제작 · 한국어판)
        </p>
      </div>

      {/* 시뮬레이터를 화면 안에 그대로 표시 */}
      <div className="mt-4 flex-1 overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
        <iframe src={BOOTH_URL} title="부스 시뮬레이터" className="h-full w-full" allow="fullscreen" />
      </div>
    </main>
  );
}
