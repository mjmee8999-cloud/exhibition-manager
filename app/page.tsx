"use client";

import Link from "next/link";
import { useExhibitions } from "@/components/ExhibitionProvider";

export default function Home() {
  const { selected } = useExhibitions();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">대시보드</h1>

      {selected ? (
        // 선택된 전시회가 있을 때: 그 전시회 정보를 보여줍니다.
        <div className="mt-6 max-w-xl rounded-2xl border border-black/10 p-6 dark:border-white/10">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            현재 선택된 전시회
          </div>
          <div className="mt-1 text-xl font-semibold">{selected.name}</div>
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="w-16 text-zinc-500">장소</dt>
              <dd>
                {selected.country}
                {selected.city ? ` · ${selected.city}` : ""}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-16 text-zinc-500">기간</dt>
              <dd>
                {selected.startDate || "-"} ~ {selected.endDate || "-"}
              </dd>
            </div>
            {selected.memo && (
              <div className="flex gap-2">
                <dt className="w-16 text-zinc-500">메모</dt>
                <dd>{selected.memo}</dd>
              </div>
            )}
          </dl>
          <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
            왼쪽 메뉴에서 준비/현장/사후 기능을 선택하세요.
          </p>
        </div>
      ) : (
        // 아직 전시회가 없을 때: 등록을 안내합니다.
        <div className="mt-6 max-w-xl rounded-2xl border border-dashed border-black/15 p-8 text-center dark:border-white/15">
          <p className="text-zinc-600 dark:text-zinc-400">
            아직 등록된 전시회가 없어요.
          </p>
          <Link
            href="/exhibitions"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            ＋ 첫 전시회 등록하기
          </Link>
        </div>
      )}
    </main>
  );
}
