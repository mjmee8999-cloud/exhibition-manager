"use client";

// 상담일지 상세 보기 · 수정 창(모달)입니다.
//  - "명함 및 상담일지 정리"와 "리드 후속 관리" 두 화면이 함께 씁니다.
//  - 명함 크게 보기/교체 + 입력폼(공통) + 후속(리드) 단계 편집을 한 곳에 모았어요.
//  - 실제 저장/삭제는 부모가 넘겨준 onSave/onDelete 가 담당합니다(화면마다 방식이 조금 달라서).

import { useRef, useState } from "react";
import ConsultationFormFields from "@/components/ConsultationFormFields";
import {
  EMPTY_FORM,
  LEAD_STATUSES,
  leadStatusOf,
  resizeImage,
  toFormState,
  type Consultation,
  type FormState,
  type LeadStatus,
} from "@/lib/consultation";

export default function ConsultationDetailModal({
  record,
  onClose,
  onSave,
  onDelete,
}: {
  record: Consultation;
  onClose: () => void;
  onSave: (updated: Consultation) => void;
  onDelete: (id: string, cardPath?: string) => void;
}) {
  const [form, setForm] = useState<FormState>(toFormState(record) ?? { ...EMPTY_FORM });
  const [cardImage, setCardImage] = useState<string>(record.cardImage ?? "");
  const [status, setStatus] = useState<LeadStatus>(leadStatusOf(record));
  const [nextAction, setNextAction] = useState<string>(record.nextAction ?? "");
  const [nextActionDate, setNextActionDate] = useState<string>(record.nextActionDate ?? "");
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [lookupMsg, setLookupMsg] = useState("");
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // 명함 교체
  async function handleReplaceCard(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setCardImage(await resizeImage(file, 1000));
    } catch {
      alert("사진을 불러올 수 없어요.");
    }
    if (replaceInputRef.current) replaceInputRef.current.value = "";
  }

  // 업체 정보 AI 자동 조회
  async function handleLookup() {
    if (!form.company.trim()) {
      setLookupStatus("error");
      setLookupMsg("회사명을 먼저 입력해 주세요.");
      return;
    }
    setLookupStatus("loading");
    setLookupMsg("AI가 웹에서 업체 정보를 찾고 있어요...");
    try {
      const res = await fetch("/api/lookup-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: form.company.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setLookupStatus("error");
        setLookupMsg(json.message || "조회에 실패했어요. 직접 입력해 주세요.");
        return;
      }
      const d = json.data ?? {};
      setForm((prev) => ({
        ...prev,
        companyType: d.companyType || prev.companyType,
        companyTypeDetail: d.companyTypeDetail || prev.companyTypeDetail,
        homepage: d.homepage || prev.homepage,
        revenue: d.revenue || prev.revenue,
        salesChannels:
          Array.isArray(d.salesChannels) && d.salesChannels.length
            ? Array.from(new Set([...prev.salesChannels, ...d.salesChannels]))
            : prev.salesChannels,
      }));
      setLookupStatus("ok");
      setLookupMsg("✅ 조회 완료");
    } catch {
      setLookupStatus("error");
      setLookupMsg("AI 서버에 연결하지 못했어요. 직접 입력해 주세요.");
    }
  }

  function handleSave() {
    const updated: Consultation = {
      ...form,
      id: record.id,
      createdAt: record.createdAt,
      cardImage,
      cardPath: record.cardPath,
      status,
      nextAction,
      nextActionDate,
    };
    onSave(updated);
    onClose();
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-4 w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-950 sm:p-8"
      >
        {/* 창 헤더 */}
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold">상담일지 상세 · 수정</h2>
          <label className="ml-auto flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            📅 상담 일자
            <input
              type="date"
              value={form.consultDate}
              onChange={(e) => setForm((prev) => ({ ...prev, consultDate: e.target.value }))}
              className="rounded-xl border border-black/15 bg-white px-3 py-2 text-base text-zinc-900 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </label>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-2xl text-zinc-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 후속(리드) 관리 */}
        <section className="mt-5 rounded-2xl border border-black/10 p-5 dark:border-white/10">
          <h3 className="text-lg font-semibold text-blue-600">🎯 후속 관리</h3>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-600 dark:text-zinc-300">후속 단계</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="rounded-xl border border-black/15 bg-white px-3 py-2.5 text-base dark:border-white/15 dark:bg-zinc-900"
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-600 dark:text-zinc-300">다음 할 일</span>
              <input
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="예: 견적서 발송 / 3주 뒤 재연락"
                className="rounded-xl border border-black/15 bg-white px-3 py-2.5 text-base dark:border-white/15 dark:bg-zinc-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-600 dark:text-zinc-300">예정일</span>
              <input
                type="date"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
                className="rounded-xl border border-black/15 bg-white px-3 py-2.5 text-base text-zinc-900 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </label>
          </div>
        </section>

        {/* 명함 크게 보기 */}
        <section className="mt-5 rounded-2xl border border-black/10 p-6 dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-blue-600">📇 명함</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => replaceInputRef.current?.click()}
                className="rounded-lg border border-black/15 px-3 py-1.5 text-sm hover:bg-black/[0.05] dark:border-white/15 dark:hover:bg-white/[0.06]"
              >
                명함 교체
              </button>
              {cardImage && (
                <button
                  type="button"
                  onClick={() => setCardImage("")}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
                >
                  명함 제거
                </button>
              )}
            </div>
          </div>
          <input
            ref={replaceInputRef}
            type="file"
            accept="image/*"
            onChange={handleReplaceCard}
            className="hidden"
          />
          <div className="mt-4 flex justify-center">
            {cardImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cardImage}
                alt="명함 크게 보기"
                className="max-h-[55vh] w-auto max-w-full rounded-xl object-contain"
              />
            ) : (
              <div className="w-full rounded-xl border border-dashed border-black/15 py-16 text-center text-zinc-400 dark:border-white/15">
                등록된 명함이 없어요. &quot;명함 교체&quot;로 추가할 수 있어요.
              </div>
            )}
          </div>
        </section>

        {/* 입력 항목 본문 (작성 화면과 동일) */}
        <div className="mt-6">
          <ConsultationFormFields
            form={form}
            setForm={setForm}
            onLookup={handleLookup}
            lookupStatus={lookupStatus}
            lookupMsg={lookupMsg}
          />
        </div>

        {/* 창 하단 버튼 */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => onDelete(record.id, record.cardPath)}
            className="rounded-xl border border-red-300 px-5 py-3 text-base text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
          >
            🗑 이 일지 삭제
          </button>
          <div className="flex gap-3 sm:ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-black/15 px-6 py-3 text-base hover:bg-black/[0.05] dark:border-white/15 dark:hover:bg-white/[0.06]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-blue-600 px-8 py-3 text-base font-semibold text-white hover:bg-blue-700"
            >
              수정 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
