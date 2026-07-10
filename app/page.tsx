"use client";

// 메인 = 등록된 전시회를 고르는 선택 화면입니다.
//  - 전시회 카드를 누르면 그 전시회가 "현재 전시회"로 선택돼요(사이드바에도 반영).
//  - 이름 아래에는 입력된 정보(국가·도시·기간·인원·메모)만 보여줍니다.
//  - 등록/수정은 「전시회 등록 / 관리」에서 합니다.

import Link from "next/link";
import { useExhibitions } from "@/components/ExhibitionProvider";

export default function Home() {
  const { exhibitions, selectedId, selectExhibition } = useExhibitions();

  return (
    <main className="w-full px-8 py-8">
      {/* 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">전시회 선택</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            작업할 전시회를 선택하세요. 선택한 전시회 기준으로 체크리스트·상담일지 등이 관리됩니다.
          </p>
        </div>
        <Link
          href="/exhibitions"
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          ＋ 전시회 등록 / 관리
        </Link>
      </div>

      {exhibitions.length === 0 ? (
        <div className="mt-8 max-w-2xl rounded-3xl border border-dashed border-black/15 bg-black/[0.02] p-12 text-center dark:border-white/15 dark:bg-white/[0.03]">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            아직 등록된 전시회가 없어요. 전시회를 <b>등록</b>하면 여기에서 선택할 수 있어요.
          </p>
          <Link
            href="/exhibitions"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
          >
            ＋ 전시회 등록하러 가기
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exhibitions.map((ex) => {
            const active = ex.id === selectedId;
            const hasPlace = ex.country || ex.city;
            const hasDate = ex.startDate || ex.endDate;
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => selectExhibition(ex.id)}
                className={
                  "relative rounded-2xl border bg-white p-5 text-left transition dark:bg-zinc-900 " +
                  (active
                    ? "border-blue-500 ring-2 ring-blue-500/30"
                    : "border-black/10 hover:border-blue-400 hover:shadow-sm dark:border-white/10 dark:hover:border-blue-500/50")
                }
              >
                {active && (
                  <span className="absolute right-4 top-4 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                    선택됨
                  </span>
                )}
                <div className="pr-16 text-lg font-bold tracking-tight">{ex.name}</div>

                {/* 입력된 정보만 표시 */}
                <div className="mt-3 space-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {hasPlace && (
                    <div>
                      📍 {ex.country}
                      {ex.country && ex.city ? " · " : ""}
                      {ex.city}
                    </div>
                  )}
                  {hasDate && (
                    <div>
                      🗓 {ex.startDate || "-"} ~ {ex.endDate || "-"}
                    </div>
                  )}
                  {ex.headcount && <div>👥 {ex.headcount}</div>}
                  {ex.memo && <div className="text-zinc-400">📝 {ex.memo}</div>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </main>
  );
}
