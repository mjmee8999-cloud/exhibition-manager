"use client";

// 부스 시뮬레이션 화면입니다.
//  - 승균님(Dennis) 부스 시뮬레이터를 우리가 한국어로 번역해 직접 호스팅합니다.
//  - 실제 앱은 public/booth/ 에 빌드되어 들어있고, 원본 소스는 booth-sim/ 에 있어요.
//    (수정하려면 booth-sim/에서 고친 뒤 다시 빌드해 public/booth/에 넣으면 됩니다. booth-sim/README 참고)
//  - 부스 디자인·전시품목은 "선택한 전시회"별로 따로 저장돼요. 그래서 iframe 주소에
//    ?ex=<전시회id> 를 붙여 넘겨줍니다. 전시회를 바꾸면 그 전시회의 배치가 열려요.

import Link from "next/link";
import { useExhibitions } from "@/components/ExhibitionProvider";

export default function BoothPage() {
  const { selected } = useExhibitions();

  // 전시회 미선택 안내
  if (!selected) {
    return (
      <main className="w-full px-8 py-8">
        <h1 className="text-2xl font-bold tracking-tight">부스 시뮬레이션</h1>
        <div className="mt-8 max-w-2xl rounded-3xl border border-dashed border-black/15 bg-black/[0.02] p-12 text-center dark:border-white/15 dark:bg-white/[0.03]">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            먼저 왼쪽에서 <b>전시회를 선택</b>해 주세요.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            부스 배치는 전시회별로 따로 저장돼요.
          </p>
          <Link
            href="/exhibitions"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
          >
            ＋ 전시회 등록 / 선택
          </Link>
        </div>
      </main>
    );
  }

  // 우리 앱 안에 호스팅된 부스 시뮬레이터 주소 (전시회 id 를 붙여 전달)
  const boothUrl = `/booth/index.html?ex=${encodeURIComponent(selected.id)}`;

  return (
    <main className="flex h-[calc(100vh-1px)] w-full flex-col px-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">부스 시뮬레이션</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="font-medium text-blue-700 dark:text-blue-300">
            {selected.name}
          </span>{" "}
          부스 배치를 미리 시뮬레이션해 봅니다. (배치는 이 전시회에만 저장돼요.)
        </p>
      </div>

      {/* 시뮬레이터를 화면 안에 그대로 표시. key 로 전시회가 바뀌면 iframe 을 새로 로드 */}
      <div className="mt-4 flex-1 overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
        <iframe
          key={selected.id}
          src={boothUrl}
          title="부스 시뮬레이터"
          className="h-full w-full"
          allow="fullscreen"
        />
      </div>
    </main>
  );
}
