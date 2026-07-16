"use client";

// 전시회 정보 수정 창(모달). 홈(전시회 선택 보드)·전시회 관리 화면 등 어디서나 재사용해요.

import { useExhibitions, type Exhibition } from "./ExhibitionProvider";

export default function ExhibitionEditModal({
  exhibition,
  onClose,
}: {
  exhibition: Exhibition;
  onClose: () => void;
}) {
  const { updateExhibition } = useExhibitions();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    if (!name) return;

    updateExhibition(exhibition.id, {
      name,
      country: String(data.get("country") || "").trim(),
      city: String(data.get("city") || "").trim(),
      startDate: String(data.get("startDate") || ""),
      endDate: String(data.get("endDate") || ""),
      headcount: String(data.get("headcount") || "").trim(),
      memo: String(data.get("memo") || "").trim(),
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-lg font-bold">✏ 전시회 정보 수정</div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <ModalField label="전시회 이름" name="name" defaultValue={exhibition.name} required />
          <div className="grid grid-cols-2 gap-4">
            <ModalField label="국가" name="country" defaultValue={exhibition.country} />
            <ModalField label="도시" name="city" defaultValue={exhibition.city} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ModalField label="시작일" name="startDate" type="date" defaultValue={exhibition.startDate} />
            <ModalField label="종료일" name="endDate" type="date" defaultValue={exhibition.endDate} />
          </div>
          <ModalField label="참가 인원" name="headcount" defaultValue={exhibition.headcount} />
          <ModalField label="메모" name="memo" defaultValue={exhibition.memo} />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-black/15 px-4 py-2 text-sm hover:bg-black/[0.05] dark:border-white/15 dark:hover:bg-white/[0.06]"
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalField({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
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
        defaultValue={defaultValue}
        required={required}
        className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
      />
    </label>
  );
}
