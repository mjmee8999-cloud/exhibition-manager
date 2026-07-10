"use client";

import { useRef, useState } from "react";
import {
  useExhibitions,
  type Exhibition,
} from "@/components/ExhibitionProvider";
import { exportBackup, importBackup } from "@/lib/backup";

export default function ExhibitionsPage() {
  const { exhibitions, selectedId, addExhibition, selectExhibition, deleteExhibition } =
    useExhibitions();

  // 삭제하려고 누른 전시회를 잠시 기억합니다.
  // 값이 있으면 "정말 삭제할까요?" 경고창이 뜨고, null이면 닫힙니다.
  const [pendingDelete, setPendingDelete] = useState<Exhibition | null>(null);

  // 백업 파일 불러오기 관련
  const fileRef = useRef<HTMLInputElement>(null);
  const [restoreMsg, setRestoreMsg] = useState("");

  async function handleRestore(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await importBackup(file);
      location.reload(); // 복원한 자료를 화면에 반영
    } catch {
      setRestoreMsg("파일을 읽을 수 없어요. 우리 앱에서 내려받은 백업 파일이 맞는지 확인해 주세요.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  // 등록 폼을 제출했을 때 실행됩니다.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // 페이지 새로고침 막기
    const form = event.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") || "").trim();
    if (!name) return; // 이름이 없으면 등록하지 않음

    addExhibition({
      name,
      country: String(data.get("country") || "").trim(),
      city: String(data.get("city") || "").trim(),
      startDate: String(data.get("startDate") || ""),
      endDate: String(data.get("endDate") || ""),
      headcount: String(data.get("headcount") || "").trim(),
      memo: String(data.get("memo") || "").trim(),
    });

    form.reset(); // 입력칸 비우기
  }

  return (
    <main className="max-w-2xl p-8">
      <h1 className="text-2xl font-bold">전시회 관리</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        전시회를 등록하면 왼쪽 사이드바에서 선택할 수 있어요.
      </p>

      {/* 전시회 등록 폼 */}
      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-2xl border border-black/10 p-6 dark:border-white/10"
      >
        <Field label="전시회 이름" name="name" placeholder="예: 2025 광저우 캔톤페어" required />
        <div className="grid grid-cols-2 gap-4">
          <Field label="국가" name="country" placeholder="예: 중국" />
          <Field label="도시" name="city" placeholder="예: 광저우" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="시작일" name="startDate" type="date" />
          <Field label="종료일" name="endDate" type="date" />
        </div>
        <Field label="참가 인원" name="headcount" placeholder="예: OOO 파트장, OOO 매니저, OOO 매니저" />
        <Field label="메모" name="memo" placeholder="기타 메모" />

        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          전시회 등록
        </button>
      </form>

      {/* 등록된 전시회 목록 */}
      <h2 className="mt-10 text-lg font-semibold">등록된 전시회 ({exhibitions.length})</h2>
      {exhibitions.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">아직 등록된 전시회가 없습니다.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {exhibitions.map((exhibition) => (
            <li
              key={exhibition.id}
              className={
                "flex items-center justify-between rounded-xl border p-4 " +
                (exhibition.id === selectedId
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-black/10 dark:border-white/10")
              }
            >
              <div>
                <div className="font-medium">{exhibition.name}</div>
                <div className="text-sm text-zinc-500">
                  {exhibition.country}
                  {exhibition.city ? ` · ${exhibition.city}` : ""}
                  {exhibition.startDate ? ` · ${exhibition.startDate}` : ""}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => selectExhibition(exhibition.id)}
                  className="rounded-lg border border-black/15 px-3 py-1.5 text-sm hover:bg-black/[0.05] dark:border-white/15 dark:hover:bg-white/[0.06]"
                >
                  선택
                </button>
                <button
                  onClick={() => setPendingDelete(exhibition)}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 자료 백업 · 불러오기 */}
      <section className="mt-10 rounded-2xl border border-dashed border-blue-400/60 bg-blue-50/50 p-5 dark:border-blue-500/40 dark:bg-blue-950/20">
        <h2 className="text-base font-semibold">💾 자료 백업 · 불러오기</h2>
        <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
          자료는 <b>지금 쓰는 이 브라우저에만</b> 저장돼요. 다른 컴퓨터(파트장님 PC 등)에서 보여드리려면,
          <b> 백업</b>으로 파일을 내려받아 옮긴 뒤 그 컴퓨터에서 <b>불러오기</b> 하면 그대로 나타나요.
          이 파일은 안전한 <b>보관용 백업</b>도 됩니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportBackup}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            ⬇ 내 자료 백업 (파일로 저장)
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-blue-500 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-950/40"
          >
            ⬆ 백업 파일 불러오기
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={handleRestore}
            className="hidden"
          />
        </div>
        {restoreMsg && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
            {restoreMsg}
          </p>
        )}
      </section>

      {/* 삭제 확인 경고창 (pendingDelete에 값이 있을 때만 보입니다) */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <div className="text-lg font-bold text-red-600">⚠️ 전시회 삭제</div>
            <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
              <b>「{pendingDelete.name}」</b> 전시회를 정말 삭제하시겠습니까?
            </p>
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">
              영구히 자료가 삭제됩니다. 되돌릴 수 없어요.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setPendingDelete(null)}
                className="rounded-lg border border-black/15 px-4 py-2 text-sm hover:bg-black/[0.05] dark:border-white/15 dark:hover:bg-white/[0.06]"
              >
                취소
              </button>
              <button
                onClick={() => {
                  deleteExhibition(pendingDelete.id);
                  setPendingDelete(null);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                영구 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// 입력칸 하나를 만드는 작은 부품입니다. (라벨 + input)
function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
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
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
      />
    </label>
  );
}
