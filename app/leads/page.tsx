"use client";

// 후속 관리 추적 보드입니다.
//  - 선택한 전시회의 상담일지(명함)를 "후속 단계"별 칸으로 나눠 한눈에 봅니다.
//  - 카드의 ← → 버튼으로 한 장씩 옮기거나, 체크박스로 여러 장을 골라 한 번에 옮길 수 있어요.
//  - 카드를 누르면 상세·수정 창이 열립니다.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useExhibitions } from "@/components/ExhibitionProvider";
import ConsultationDetailModal from "@/components/ConsultationDetailModal";
import { GradeBadge, leadStatusColor } from "@/components/formControls";
import {
  consultationDate,
  LEAD_STATUSES,
  leadStatusOf,
  type Consultation,
  type LeadStatus,
} from "@/lib/consultation";
import {
  listConsultations,
  saveConsultation,
  deleteConsultation,
} from "@/lib/consultationStore";

export default function LeadsPage() {
  const { selected } = useExhibitions();
  const [records, setRecords] = useState<Consultation[]>([]);
  const [editRecord, setEditRecord] = useState<Consultation | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set()); // 체크된 카드 id 모음
  const [moveTarget, setMoveTarget] = useState<LeadStatus | "">("");

  useEffect(() => {
    const exId = selected?.id;
    if (!exId) {
      setRecords([]);
      return;
    }
    let alive = true;
    listConsultations(exId).then((list) => {
      if (alive) setRecords(list);
    });
    setPicked(new Set());
    return () => {
      alive = false;
    };
  }, [selected?.id]);

  // 저장(DB) 후 최종 저장본으로 목록을 맞춰주는 공통 처리
  function persist(updatedList: Consultation[]) {
    if (!selected) return;
    Promise.all(updatedList.map((u) => saveConsultation(selected.id, u))).then((savedList) => {
      const map = new Map(savedList.map((s) => [s.id, s]));
      setRecords((prev) => prev.map((r) => map.get(r.id) ?? r));
    });
  }

  // 카드 한 장 단계 이동 (delta = -1 이전 / +1 다음)
  function move(r: Consultation, delta: number) {
    const idx = LEAD_STATUSES.indexOf(leadStatusOf(r));
    const nextIdx = Math.min(LEAD_STATUSES.length - 1, Math.max(0, idx + delta));
    if (nextIdx === idx) return;
    const updated: Consultation = { ...r, status: LEAD_STATUSES[nextIdx] };
    setRecords((prev) => prev.map((x) => (x.id === r.id ? updated : x)));
    persist([updated]);
  }

  // 체크한 카드들을 고른 단계로 한 번에 이동
  function moveMany() {
    if (!moveTarget || picked.size === 0) return;
    const updates = records
      .filter((r) => picked.has(r.id))
      .map((r) => ({ ...r, status: moveTarget as LeadStatus }));
    setRecords((prev) =>
      prev.map((r) => (picked.has(r.id) ? { ...r, status: moveTarget as LeadStatus } : r)),
    );
    persist(updates);
    setPicked(new Set());
    setMoveTarget("");
  }

  function toggleCard(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // 한 칸(단계) 전체 선택/해제
  function toggleColumn(ids: string[]) {
    setPicked((prev) => {
      const next = new Set(prev);
      const allOn = ids.length > 0 && ids.every((id) => next.has(id));
      if (allOn) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  function handleSaveEdit(updated: Consultation) {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    persist([updated]);
  }

  function handleDelete(id: string, cardPath?: string) {
    if (!confirm("이 상담일지를 삭제할까요? 되돌릴 수 없어요.")) return;
    setRecords((prev) => prev.filter((r) => r.id !== id));
    deleteConsultation(id, cardPath);
    if (editRecord?.id === id) setEditRecord(null);
  }

  // 전시회 미선택 안내
  if (!selected) {
    return (
      <main className="w-full px-8 py-8">
        <h1 className="text-3xl font-bold">후속 관리 추적 보드</h1>
        <div className="mt-8 max-w-2xl rounded-3xl border border-dashed border-black/15 bg-black/[0.02] p-12 text-center dark:border-white/15 dark:bg-white/[0.03]">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            먼저 왼쪽에서 <b>전시회를 선택</b>해 주세요.
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

  // 단계별로 상담일지를 나눕니다.
  const byStatus: Record<string, Consultation[]> = {};
  for (const s of LEAD_STATUSES) byStatus[s] = [];
  for (const r of records) byStatus[leadStatusOf(r)].push(r);

  return (
    <main className="w-full px-8 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">후속 관리 추적 보드</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          명함이 실제 거래로 이어지는 과정을 단계별로 관리하세요. 카드의 ← → 로 한 장씩, 체크박스로 여러 장을 한 번에 옮길 수 있어요.
        </p>
      </div>

      {/* 전시회 배너 + 건수 */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-blue-50 px-5 py-3.5 text-base dark:bg-blue-950/40">
        <span className="font-semibold">{selected.name}</span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {selected.country}
          {selected.city ? ` · ${selected.city}` : ""}
        </span>
        <span className="ml-auto font-medium text-blue-700 dark:text-blue-300">총 {records.length}건</span>
      </div>

      {/* 다중 선택 이동 툴바 (체크한 카드가 있을 때만) */}
      {picked.size > 0 && (
        <div className="sticky top-2 z-30 mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-blue-300 bg-white px-5 py-3 shadow-md dark:border-blue-800 dark:bg-zinc-900">
          <span className="font-semibold text-blue-700 dark:text-blue-300">
            ✔ {picked.size}개 선택됨
          </span>
          <span className="text-sm text-zinc-500">→ 이동할 단계:</span>
          <select
            value={moveTarget}
            onChange={(e) => setMoveTarget(e.target.value as LeadStatus)}
            className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
          >
            <option value="">단계 선택</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={moveMany}
            disabled={!moveTarget}
            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            이동
          </button>
          <button
            type="button"
            onClick={() => setPicked(new Set())}
            className="rounded-xl border border-black/15 px-4 py-2 text-sm hover:bg-black/[0.05] dark:border-white/15 dark:hover:bg-white/[0.06]"
          >
            선택 해제
          </button>
        </div>
      )}

      {records.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-black/15 bg-black/[0.02] p-12 text-center dark:border-white/15 dark:bg-white/[0.03]">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">아직 저장된 상담일지가 없어요.</p>
          <Link
            href="/during/consultation"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
          >
            ✍ 상담일지 작성하러 가기
          </Link>
        </div>
      ) : (
        // 단계별 칸(칸반 보드) — 가로 스크롤
        <div className="mt-5 flex gap-4 overflow-x-auto pb-4">
          {LEAD_STATUSES.map((status, colIdx) => {
            const cards = byStatus[status];
            const ids = cards.map((c) => c.id);
            const allChecked = ids.length > 0 && ids.every((id) => picked.has(id));
            return (
              <div
                key={status}
                className="flex w-72 shrink-0 flex-col rounded-2xl border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.02]"
              >
                {/* 칸 머리 */}
                <div className="flex items-center gap-2 border-b border-black/10 px-3 py-3 dark:border-white/10">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={() => toggleColumn(ids)}
                    disabled={ids.length === 0}
                    className="h-4 w-4 shrink-0 cursor-pointer accent-blue-600 disabled:opacity-30"
                    title="이 칸 전체 선택"
                  />
                  <span
                    className={
                      "rounded-full px-2.5 py-1 text-sm font-semibold " + leadStatusColor(status)
                    }
                  >
                    {status}
                  </span>
                  <span className="ml-auto text-sm font-medium text-zinc-400">{cards.length}</span>
                </div>

                {/* 카드들 */}
                <div className="flex flex-1 flex-col gap-2.5 p-3">
                  {cards.length === 0 ? (
                    <p className="py-6 text-center text-sm text-zinc-300 dark:text-zinc-600">비어 있음</p>
                  ) : (
                    cards.map((r) => (
                      <LeadCard
                        key={r.id}
                        record={r}
                        colIdx={colIdx}
                        lastIdx={LEAD_STATUSES.length - 1}
                        checked={picked.has(r.id)}
                        onToggleCheck={() => toggleCard(r.id)}
                        onOpen={() => setEditRecord(r)}
                        onMove={(delta) => move(r, delta)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editRecord && (
        <ConsultationDetailModal
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
        />
      )}
    </main>
  );
}

// 보드 카드 하나
function LeadCard({
  record: r,
  colIdx,
  lastIdx,
  checked,
  onToggleCheck,
  onOpen,
  onMove,
}: {
  record: Consultation;
  colIdx: number;
  lastIdx: number;
  checked: boolean;
  onToggleCheck: () => void;
  onOpen: () => void;
  onMove: (delta: number) => void;
}) {
  return (
    <div
      className={
        "rounded-xl border bg-white p-3 text-left shadow-sm transition dark:bg-zinc-900 " +
        (checked
          ? "border-blue-500 ring-2 ring-blue-500/30"
          : "border-black/10 hover:border-blue-400 dark:border-white/10")
      }
    >
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggleCheck}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-blue-600"
          aria-label="이 카드 선택"
        />
        {/* 이름 영역(누르면 상세 열림) */}
        <div
          role="button"
          tabIndex={0}
          onClick={onOpen}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onOpen();
          }}
          className="min-w-0 flex-1 cursor-pointer"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold leading-tight">{r.company || r.name || "(이름 없음)"}</span>
            <GradeBadge grade={r.importance} />
          </div>
          {(r.name || r.title) && (
            <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {r.name}
              {r.name && r.title ? " · " : ""}
              {r.title}
            </div>
          )}
        </div>
      </div>

      {r.nextAction && (
        <div className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          📌 {r.nextAction}
          {r.nextActionDate ? ` (${r.nextActionDate})` : ""}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-zinc-400">{consultationDate(r) || ""}</span>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={colIdx === 0}
            onClick={() => onMove(-1)}
            className="rounded-md border border-black/15 px-2 py-0.5 text-sm hover:bg-black/[0.05] disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/15 dark:hover:bg-white/[0.06]"
            aria-label="이전 단계로"
          >
            ←
          </button>
          <button
            type="button"
            disabled={colIdx === lastIdx}
            onClick={() => onMove(1)}
            className="rounded-md border border-black/15 px-2 py-0.5 text-sm hover:bg-black/[0.05] disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/15 dark:hover:bg-white/[0.06]"
            aria-label="다음 단계로"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
