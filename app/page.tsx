"use client";

import { useState } from "react";
import Link from "next/link";
import { useExhibitions, type Exhibition } from "@/components/ExhibitionProvider";

// 수정 창에서 다룰 입력값 (id 제외)
type EditForm = Omit<Exhibition, "id">;

export default function Home() {
  const { selected, updateExhibition } = useExhibitions();

  // 수정 창 상태 (null이면 닫힘)
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  // 수정 창 열기 — 현재 전시회 정보를 입력칸에 채워 넣습니다.
  function openEdit() {
    if (!selected) return;
    setEditForm({
      name: selected.name,
      country: selected.country,
      city: selected.city,
      startDate: selected.startDate,
      endDate: selected.endDate,
      headcount: selected.headcount ?? "",
      memo: selected.memo,
    });
  }

  // 수정 내용 저장
  function handleSave() {
    if (!selected || !editForm) return;
    if (!editForm.name.trim()) {
      alert("전시회 이름은 비워둘 수 없어요.");
      return;
    }
    updateExhibition(selected.id, { ...editForm, name: editForm.name.trim() });
    setEditForm(null);
  }

  function setField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">대시보드</h1>

      {selected ? (
        // 선택된 전시회가 있을 때: 그 전시회 정보를 보여줍니다.
        <div className="mt-6 max-w-xl rounded-2xl border border-black/10 p-6 dark:border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">현재 선택된 전시회</div>
              <div className="mt-1 text-xl font-semibold">{selected.name}</div>
            </div>
            <button
              type="button"
              onClick={openEdit}
              className="shrink-0 rounded-lg border border-blue-500 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            >
              ✏ 정보 수정
            </button>
          </div>

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
            <div className="flex gap-2">
              <dt className="w-16 text-zinc-500">참가 인원</dt>
              <dd>{selected.headcount || "-"}</dd>
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
          <p className="text-zinc-600 dark:text-zinc-400">아직 등록된 전시회가 없어요.</p>
          <Link
            href="/exhibitions"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            ＋ 첫 전시회 등록하기
          </Link>
        </div>
      )}

      {/* ── 전시회 정보 수정 창 (모달) ── */}
      {editForm && (
        <div
          onClick={() => setEditForm(null)}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="my-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">전시회 정보 수정</h2>
              <button
                type="button"
                onClick={() => setEditForm(null)}
                className="rounded-full px-2 py-0.5 text-xl text-zinc-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <EditField
                label="전시회 이름"
                value={editForm.name}
                onChange={(v) => setField("name", v)}
                placeholder="예: 2025 광저우 캔톤페어"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <EditField label="국가" value={editForm.country} onChange={(v) => setField("country", v)} placeholder="예: 중국" />
                <EditField label="도시" value={editForm.city} onChange={(v) => setField("city", v)} placeholder="예: 광저우" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <EditField label="시작일" type="date" value={editForm.startDate} onChange={(v) => setField("startDate", v)} />
                <EditField label="종료일" type="date" value={editForm.endDate} onChange={(v) => setField("endDate", v)} />
              </div>
              <EditField label="참가 인원" value={editForm.headcount} onChange={(v) => setField("headcount", v)} placeholder="예: OOO 파트장, OOO 매니저, OOO 매니저" />
              <EditField label="메모" value={editForm.memo} onChange={(v) => setField("memo", v)} placeholder="기타 메모" />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditForm(null)}
                className="rounded-lg border border-black/15 px-4 py-2 text-sm hover:bg-black/[0.05] dark:border-white/15 dark:hover:bg-white/[0.06]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// 수정 창 입력칸 하나 (라벨 + input)
function EditField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
      />
    </label>
  );
}
