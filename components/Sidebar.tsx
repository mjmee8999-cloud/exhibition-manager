"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { phases } from "@/app/features";

// open/onClose 는 "휴대폰용 서랍" 여닫기용입니다. (데스크톱에선 항상 고정으로 보임)
export default function Sidebar({
  open = false,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname(); // 지금 보고 있는 페이지 주소 (메뉴 강조용)

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
      </div>

      {/* 기능 메뉴 */}
      <nav className="p-3">
        {/* 전시회 전 / 중 / 후 — 이 앱의 핵심 메뉴라 맨 위에서 크고 깔끔하게 강조 */}
        <div className="space-y-6">
          {phases.map((phase) => (
            <div key={phase.key}>
              {/* 단계 제목 (전시회 전/중/후) — 크고 진하게 강조 */}
              <div className="mb-2 flex items-center gap-2 px-1 text-lg font-extrabold text-zinc-900 dark:text-white">
                <span className="text-xl">{phase.emoji}</span>
                <span>{phase.label}</span>
              </div>
              <ul className="space-y-1">
                {phase.features.map((feature) => {
                  const isActive = pathname === feature.href;
                  return (
                    <li key={feature.href}>
                      <Link
                        href={feature.href}
                        className={
                          "block rounded-lg px-3 py-2 transition-colors " +
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
        </div>

        {/* 구분선 — 여기부터는 전·중·후를 아우르는 보조 메뉴 */}
        <div className="my-5 border-t border-black/10 dark:border-white/10" />

        {/* 체크리스트 · 출장비 정산 — 전·중·후 전반에 걸친 메뉴라 아래로 모아 배치 */}
        <div className="space-y-1.5">
          <SecondaryLink
            href="/before/checklist"
            active={pathname === "/before/checklist"}
            emoji="✅"
            title="체크리스트"
            desc="전 · 중 · 후 준비 할 일 전체"
          />
          <SecondaryLink
            href="/expense"
            active={pathname === "/expense"}
            emoji="🧾"
            title="출장비 정산"
            desc="판촉물 · 쉽먼트 · 항공 · 숙박 · 현지 비용"
          />
        </div>
      </nav>
    </aside>
  );
}

// 아래쪽 보조 메뉴(체크리스트/출장비) 한 칸을 만드는 작은 부품입니다.
function SecondaryLink({
  href,
  active,
  emoji,
  title,
  desc,
}: {
  href: string;
  active: boolean;
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className={
        "block rounded-lg border px-3 py-2 transition-colors " +
        (active
          ? "border-transparent bg-blue-600"
          : "border-black/10 hover:bg-black/[0.05] dark:border-white/10 dark:hover:bg-white/[0.06]")
      }
    >
      <div
        className={
          "flex items-center gap-1.5 text-sm font-semibold " +
          (active ? "text-white" : "text-zinc-800 dark:text-zinc-100")
        }
      >
        <span>{emoji}</span>
        <span>{title}</span>
      </div>
      <div
        className={
          "mt-0.5 text-xs " +
          (active ? "text-blue-100" : "text-zinc-400 dark:text-zinc-500")
        }
      >
        {desc}
      </div>
    </Link>
  );
}
