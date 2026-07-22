"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { phases } from "@/app/features";
import { useExhibitions } from "./ExhibitionProvider";

// open/onClose 는 "휴대폰용 서랍" 여닫기용입니다. (데스크톱에선 항상 고정으로 보임)
export default function Sidebar({
  open = false,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname(); // 지금 보고 있는 페이지 주소 (메뉴 강조용)
  const { exhibitions, selectedId, selectExhibition } = useExhibitions();

  // 휴대폰에서 메뉴(페이지)를 옮기면 서랍을 자동으로 닫습니다.
  useEffect(() => {
    onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <aside
      className={
        // 데스크톱(md↑): 예전 그대로 왼쪽 고정. 휴대폰: 화면 밖에서 슬라이드로 등장하는 서랍.
        "fixed inset-y-0 left-0 z-40 w-72 overflow-y-auto border-r border-black/10 bg-white transition-transform dark:border-white/10 dark:bg-zinc-950 " +
        "md:static md:z-auto md:shrink-0 md:translate-x-0 md:overflow-visible md:bg-transparent md:transition-none md:dark:bg-transparent " +
        (open ? "translate-x-0" : "-translate-x-full md:translate-x-0")
      }
    >
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

        {/* BOM 조회 (전시회와 무관한 공용 도구) */}
        <Link
          href="/bom"
          className={
            "group mt-2 block rounded-xl border px-4 py-3 transition " +
            (pathname === "/bom"
              ? "border-transparent bg-emerald-600 text-white"
              : "border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30")
          }
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🔩</span>
            <span className="text-base font-bold">BOM 조회</span>
            <span className="ml-auto text-lg transition-transform group-hover:translate-x-0.5">→</span>
          </div>
          <div
            className={
              "mt-0.5 text-xs " + (pathname === "/bom" ? "text-emerald-100" : "text-zinc-400 dark:text-zinc-500")
            }
          >
            제품별 실제 부품·품번 검색 · 엑셀 추출
          </div>
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

        {/* 출장비 정산 — 출장 전반에 걸친 비용이라 체크리스트처럼 상위 메뉴로 */}
        <Link
          href="/expense"
          className={
            "block rounded-lg border px-3 py-2.5 transition-colors " +
            (pathname === "/expense"
              ? "border-transparent bg-blue-600"
              : "border-black/10 hover:bg-black/[0.05] dark:border-white/10 dark:hover:bg-white/[0.06]")
          }
        >
          <div
            className={
              "flex items-center gap-1.5 text-sm font-semibold " +
              (pathname === "/expense" ? "text-white" : "text-zinc-800 dark:text-zinc-100")
            }
          >
            <span>🧾</span>
            <span>출장비 정산</span>
          </div>
          <div
            className={
              "mt-0.5 text-xs " +
              (pathname === "/expense" ? "text-blue-100" : "text-zinc-400 dark:text-zinc-500")
            }
          >
            판촉물 · 쉽먼트 · 항공 · 숙박 · 현지 비용
          </div>
        </Link>

        {phases.map((phase) => (
          <div key={phase.key}>
            {/* 단계 제목 (전시회 전/중/후) — 크고 진하게 강조 */}
            <div className="mb-2.5 flex items-center gap-2 px-1 text-lg font-extrabold text-zinc-900 dark:text-white">
              <span className="text-xl">{phase.emoji}</span>
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
