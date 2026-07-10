"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { phases } from "@/app/features";
import { useExhibitions } from "./ExhibitionProvider";

export default function Sidebar() {
  const pathname = usePathname(); // 지금 보고 있는 페이지 주소 (메뉴 강조용)
  const { exhibitions, selectedId, selectExhibition } = useExhibitions();

  return (
    <aside className="w-72 shrink-0 border-r border-black/10 dark:border-white/10">
      {/* 전시회 일정 조회 (특정 전시회 선택과 무관한 상위 메뉴) — 눈에 띄게 강조 */}
      <div className="p-3">
        <Link
          href="/before/search"
          className={
            "group block rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white shadow-md shadow-blue-600/20 transition hover:from-blue-500 hover:to-indigo-500 hover:shadow-lg " +
            (pathname === "/before/search" ? "ring-2 ring-blue-300 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950" : "")
          }
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🗓️</span>
            <span className="text-base font-bold">전시회 일정 조회</span>
            <span className="ml-auto text-lg transition-transform group-hover:translate-x-0.5">→</span>
          </div>
          <div className="mt-0.5 text-xs text-blue-100">해외전시회 17,000+ 검색 · 중요도 자동 채점</div>
        </Link>
      </div>

      {/* 전시회 선택 영역 */}
      <div className="border-b border-black/10 p-4 dark:border-white/10">
        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          전시회 선택
        </label>
        <select
          value={selectedId ?? ""}
          onChange={(event) => selectExhibition(event.target.value)}
          className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
        >
          <option value="" disabled>
            전시회를 선택하세요
          </option>
          {exhibitions.map((exhibition) => (
            <option key={exhibition.id} value={exhibition.id}>
              {exhibition.name}
            </option>
          ))}
        </select>
        <Link
          href="/exhibitions"
          className="mt-2 block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          ＋ 전시회 관리 / 등록
        </Link>
      </div>

      {/* 기능 메뉴 (전 / 중 / 후) */}
      <nav className="space-y-7 p-4">
        {/* 체크리스트 — 전·중·후를 아우르므로 단계 위 상위 메뉴로 */}
        <Link
          href="/before/checklist"
          className={
            "block rounded-lg border px-3 py-2.5 transition-colors " +
            (pathname === "/before/checklist"
              ? "border-transparent bg-blue-600"
              : "border-black/10 hover:bg-black/[0.05] dark:border-white/10 dark:hover:bg-white/[0.06]")
          }
        >
          <div
            className={
              "flex items-center gap-1.5 text-sm font-semibold " +
              (pathname === "/before/checklist" ? "text-white" : "text-zinc-800 dark:text-zinc-100")
            }
          >
            <span>✅</span>
            <span>체크리스트</span>
          </div>
          <div
            className={
              "mt-0.5 text-xs " +
              (pathname === "/before/checklist" ? "text-blue-100" : "text-zinc-400 dark:text-zinc-500")
            }
          >
            전 · 중 · 후 준비 할 일 전체
          </div>
        </Link>

        {phases.map((phase) => (
          <div key={phase.key}>
            {/* 단계 제목 (전시회 전/중/후) — 글씨 살짝 크게 */}
            <div className="mb-2 flex items-center gap-1.5 px-1 text-sm font-bold text-zinc-500 dark:text-zinc-300">
              <span className="text-base">{phase.emoji}</span>
              <span>{phase.label}</span>
            </div>
            <ul className="space-y-1.5">
              {phase.features.map((feature) => {
                const isActive = pathname === feature.href;
                return (
                  <li key={feature.href}>
                    <Link
                      href={feature.href}
                      className={
                        "block rounded-lg px-3 py-2.5 transition-colors " +
                        (isActive
                          ? "bg-blue-600"
                          : "hover:bg-black/[0.05] dark:hover:bg-white/[0.06]")
                      }
                    >
                      {/* 기능 이름 */}
                      <div
                        className={
                          "text-sm font-medium " +
                          (isActive
                            ? "text-white"
                            : "text-zinc-800 dark:text-zinc-100")
                        }
                      >
                        {feature.title}
                      </div>
                      {/* 기능 한 줄 설명 */}
                      <div
                        className={
                          "mt-0.5 text-xs " +
                          (isActive
                            ? "text-blue-100"
                            : "text-zinc-400 dark:text-zinc-500")
                        }
                      >
                        {feature.desc}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
