"use client";

import Link from "next/link";
import { useExhibitions } from "./ExhibitionProvider";

// 아직 안 만든 기능 페이지에 공통으로 쓰는 "준비 중" 화면입니다.
// 각 기능 페이지에서 title/description만 넣어서 재사용합니다.
//
// exhibitionScoped(기본값 true): 이 기능이 "선택한 전시회"에 속하는지 여부.
//  - true  → 전/중/후 기능처럼 전시회를 골라야 내용이 보입니다.
//            전시회를 고르면 그 전시회 이름이 위에 표시됩니다.
//  - false → "전시회 일정 조회"처럼 특정 전시회와 무관한 기능.
export default function ComingSoon({
  title,
  description,
  exhibitionScoped = true,
}: {
  title: string;
  description?: string;
  exhibitionScoped?: boolean;
}) {
  const { selected } = useExhibitions();

  // 전시회에 속한 기능인데 아직 아무 전시회도 선택하지 않은 경우:
  // 먼저 전시회를 선택하도록 안내합니다.
  const needsExhibition = exhibitionScoped && !selected;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ← 홈으로
      </Link>

      <h1 className="mt-4 text-2xl font-bold">{title}</h1>

      {description && (
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">{description}</p>
      )}

      {/* 전시회를 골라야 하는데 안 골랐을 때: 선택 안내 */}
      {needsExhibition ? (
        <div className="mt-8 rounded-xl border border-dashed border-black/15 bg-black/[0.02] p-8 text-center dark:border-white/15 dark:bg-white/[0.03]">
          <p className="text-zinc-600 dark:text-zinc-400">
            먼저 왼쪽에서 <b>전시회를 선택</b>해 주세요.
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            전시회를 선택하면 그 전시회의 내용이 여기에 표시됩니다.
          </p>
          <Link
            href="/exhibitions"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            ＋ 전시회 등록 / 선택
          </Link>
        </div>
      ) : (
        <>
          {/* 전시회가 선택돼 있으면 어떤 전시회인지 배너로 표시 */}
          {exhibitionScoped && selected && (
            <div className="mt-6 flex flex-wrap items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm dark:bg-blue-950/40">
              <span className="font-semibold">{selected.name}</span>
              <span className="text-zinc-500 dark:text-zinc-400">
                {selected.country}
                {selected.city ? ` · ${selected.city}` : ""}
              </span>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-dashed border-black/15 bg-black/[0.02] p-8 text-center text-zinc-500 dark:border-white/15 dark:bg-white/[0.03] dark:text-zinc-400">
            🚧 {exhibitionScoped && selected ? `「${selected.name}」의 ` : ""}
            「{title}」 기능은 곧 만들 예정이에요.
          </div>
        </>
      )}
    </main>
  );
}
