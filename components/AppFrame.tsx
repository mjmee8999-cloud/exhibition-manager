"use client";

// 앱 전체 틀(상단 바 + 왼쪽 사이드바 + 본문)입니다.
//  - 데스크톱: 예전과 똑같이 사이드바가 항상 왼쪽에 고정.
//  - 휴대폰(md 미만): 사이드바를 숨기고, 상단 ☰ 버튼으로 여닫는 서랍으로 보여줍니다.

import { useState } from "react";
import Link from "next/link";
import Sidebar from "./Sidebar";

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 상단 제목 바 */}
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-3 px-4 py-2 md:px-6 md:py-3">
          {/* 휴대폰용 메뉴 버튼 (데스크톱에선 숨김) */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="메뉴 열기"
            className="rounded-lg border border-black/10 px-2.5 py-1 text-xl leading-none hover:bg-black/[0.05] md:hidden dark:border-white/10 dark:hover:bg-white/[0.06]"
          >
            ☰
          </button>

          <Link href="/" className="flex min-w-0 items-center gap-3 md:gap-4">
            {/* 회사 로고 (public/speedrack-logo.jpg) */}
            <img
              src="/speedrack-logo.jpg"
              alt="스피드랙 로고"
              className="h-10 w-auto rounded bg-white p-0.5 md:h-16"
            />
            <span className="truncate text-base font-bold md:text-xl">
              해외 전시회 통합 관리 시스템
            </span>
          </Link>
        </div>
      </header>

      {/* 왼쪽 사이드바 + 오른쪽 본문 */}
      <div className="flex flex-1">
        <Sidebar open={open} onClose={() => setOpen(false)} />

        {/* 휴대폰에서 서랍이 열렸을 때 뒤를 어둡게 (누르면 닫힘) */}
        {open && (
          <div
            onClick={() => setOpen(false)}
            aria-hidden
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
          />
        )}

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  );
}
