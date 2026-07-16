"use client";

// 메인 = 등록된 전시회를 고르는 선택 화면입니다.
//  - 전시회 카드를 누르면 그 전시회가 "현재 전시회"로 선택돼요(사이드바에도 반영).
//  - 이름 아래에는 입력된 정보(국가·도시·기간·인원·메모)만 보여줍니다.
//  - 등록/수정은 「전시회 등록 / 관리」에서 합니다.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useExhibitions, type Exhibition } from "@/components/ExhibitionProvider";
import DdayBadge from "@/components/DdayBadge";
import ExhibitionEditModal from "@/components/ExhibitionEditModal";
import {
  countProgress,
  type ChecklistPhase,
  type ChecklistProgress,
} from "@/lib/checklist";
import { loadStructure, loadAllProgress } from "@/lib/checklistStore";

export default function Home() {
  const { exhibitions, selectedId, selectExhibition } = useExhibitions();
  const [editing, setEditing] = useState<Exhibition | null>(null);

  // 체크리스트 구성(공통)과 전시회별 진행상태를 DB에서 불러와 카드 진행률에 씁니다.
  const [structure, setStructure] = useState<ChecklistPhase[] | null>(null);
  const [allProgress, setAllProgress] = useState<Record<string, ChecklistProgress>>({});
  useEffect(() => {
    loadStructure().then(setStructure);
    loadAllProgress().then(setAllProgress);
  }, []);

  // 시작일 빠른 순으로 정렬 (2026.08 → 2026.10 …). 날짜 없는 전시회는 맨 뒤로.
  const sortedExhibitions = [...exhibitions].sort((a, b) => {
    const da = a.startDate || "";
    const db = b.startDate || "";
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da.localeCompare(db);
  });

  // 월(YYYY.MM)별로 묶어 타임라인처럼 표시. 날짜 없는 전시회는 "날짜 미정" 그룹으로.
  const monthGroups: { key: string; label: string; items: Exhibition[] }[] = [];
  for (const ex of sortedExhibitions) {
    const m = /^(\d{4})-(\d{2})/.exec(ex.startDate || "");
    const key = m ? `${m[1]}.${m[2]}` : "날짜 미정";
    let g = monthGroups.find((x) => x.key === key);
    if (!g) {
      g = { key, label: key, items: [] };
      monthGroups.push(g);
    }
    g.items.push(ex);
  }

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
        <div className="mt-6 space-y-8">
          {monthGroups.map((g) => (
            <section key={g.key}>
              {/* 월(타임라인) 헤더 */}
              <div className="mb-3 flex items-center gap-3">
                <span className="text-sm font-bold tabular-nums text-blue-700 dark:text-blue-300">
                  {g.label}
                </span>
                <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                <span className="text-xs text-zinc-400">{g.items.length}건</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((ex) => (
                  <ExhibitionCard
                    key={ex.id}
                    ex={ex}
                    active={ex.id === selectedId}
                    structure={structure}
                    progress={allProgress[ex.id] ?? {}}
                    onSelect={() => selectExhibition(ex.id)}
                    onEdit={() => setEditing(ex)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* 정보 수정 창 */}
      {editing && (
        <ExhibitionEditModal exhibition={editing} onClose={() => setEditing(null)} />
      )}
    </main>
  );
}

// 전시회 카드 하나
function ExhibitionCard({
  ex,
  active,
  structure,
  progress,
  onSelect,
  onEdit,
}: {
  ex: Exhibition;
  active: boolean;
  structure: ChecklistPhase[] | null;
  progress: ChecklistProgress;
  onSelect: () => void;
  onEdit: () => void;
}) {
  const hasPlace = ex.country || ex.city;
  const hasDate = ex.startDate || ex.endDate;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
      className={
        "relative cursor-pointer rounded-2xl border bg-white p-5 text-left transition dark:bg-zinc-900 " +
        (active
          ? "border-blue-500 ring-2 ring-blue-500/30"
          : "border-black/10 hover:border-blue-400 hover:shadow-sm dark:border-white/10 dark:hover:border-blue-500/50")
      }
    >
      {/* 우상단: 선택됨 표시 + 수정 버튼 */}
      <div className="absolute right-3 top-3 flex items-center gap-2">
        {active && (
          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
            선택됨
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="rounded-lg border border-black/15 px-2 py-1 text-xs hover:bg-black/[0.05] dark:border-white/15 dark:hover:bg-white/[0.06]"
        >
          ✏ 수정
        </button>
      </div>

      {/* 이름 + D-day */}
      <div className="flex flex-wrap items-center gap-2 pr-28">
        <span className="text-lg font-bold tracking-tight">{ex.name}</span>
        <DdayBadge startDate={ex.startDate} />
      </div>

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

      {/* 체크리스트 진행률 (오른쪽 아래, 작게) */}
      {structure && <ChecklistMini structure={structure} progress={progress} />}
    </div>
  );
}

// 카드 오른쪽 아래에 표시하는 작은 체크리스트 진행률 (바 + %)
function ChecklistMini({
  structure,
  progress,
}: {
  structure: ChecklistPhase[];
  progress: ChecklistProgress;
}) {
  const { pct } = countProgress(structure, progress);
  return (
    <div className="mt-4 flex items-center justify-end gap-2">
      <span className="text-xs text-zinc-400 dark:text-zinc-500">체크리스트</span>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold tabular-nums text-blue-600 dark:text-blue-400">
        {pct}%
      </span>
    </div>
  );
}
