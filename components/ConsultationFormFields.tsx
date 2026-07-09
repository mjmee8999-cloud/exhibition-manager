"use client";

// 상담일지의 입력 항목 본문입니다. (명함/저장버튼은 제외)
//  - "상담일지 작성" 화면과 "정리" 화면의 수정창이 이 컴포넌트를 함께 씁니다.
//  - onLookup을 넘기면 업체 정보에 "AI 자동 조회" 버튼이 나타납니다.

import type { Dispatch, SetStateAction } from "react";
import {
  INQUIRY_GROUPS,
  PRODUCTS,
  SALES_CHANNELS,
  type FormState,
  type ListField,
} from "@/lib/consultation";
import { CheckChips, ChipRow, Field, GradeSelect } from "@/components/formControls";

type Props = {
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  onLookup?: () => void;
  lookupStatus?: "idle" | "loading" | "ok" | "error";
  lookupMsg?: string;
};

export default function ConsultationFormFields({
  form,
  setForm,
  onLookup,
  lookupStatus = "idle",
  lookupMsg = "",
}: Props) {
  function setField<K extends keyof FormState>(name: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleInList(field: ListField, item: string) {
    setForm((prev) => {
      const cur = prev[field];
      return {
        ...prev,
        [field]: cur.includes(item) ? cur.filter((i) => i !== item) : [...cur, item],
      };
    });
  }

  return (
    <div className="space-y-6">
      {/* 고객 정보(왼쪽) / 업체 정보(오른쪽) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 고객 정보 */}
        <section className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-blue-600">👤 고객 정보</h2>
          <div className="mt-5 space-y-4">
            <Field label="회사명" value={form.company} onChange={(v) => setField("company", v)} />
            <Field label="담당자명" value={form.name} onChange={(v) => setField("name", v)} />
            <Field label="부서 / 직책" value={form.title} onChange={(v) => setField("title", v)} />
            <Field label="이메일" value={form.email} onChange={(v) => setField("email", v)} />
            <Field label="연락처" value={form.phone} onChange={(v) => setField("phone", v)} />
          </div>
        </section>

        {/* 업체 정보 */}
        <section className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-blue-600">🏢 업체 정보</h2>
            {onLookup && (
              <button
                type="button"
                onClick={onLookup}
                disabled={lookupStatus === "loading"}
                className="rounded-lg border border-blue-500 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:hover:bg-blue-950/30"
              >
                {lookupStatus === "loading" ? "조회 중..." : "🔍 AI 자동 조회"}
              </button>
            )}
          </div>

          <div className="mt-5 space-y-4">
            {/* 업체 유형 (서술형) */}
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-300">
                업체 유형 <span className="font-normal text-zinc-400">(서술형)</span>
              </span>
              <textarea
                value={form.companyType}
                onChange={(e) => setField("companyType", e.target.value)}
                rows={2}
                placeholder="예: 미국 대형 홈센터 체인, 주택 개량 자재 소매"
                className="w-full resize-y rounded-xl border border-black/15 bg-white px-4 py-3 text-base dark:border-white/15 dark:bg-zinc-900"
              />
            </label>

            {/* 판매 채널 (체크박스) */}
            <div>
              <span className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-300">
                판매 채널
              </span>
              <CheckChips
                items={SALES_CHANNELS}
                selected={form.salesChannels}
                onToggle={(item) => toggleInList("salesChannels", item)}
                etcValue={form.salesChannelEtc}
                onEtcChange={(v) => setField("salesChannelEtc", v)}
                etcPlaceholder="기타 판매 채널"
              />
            </div>

            {/* 홈페이지 URL */}
            <Field
              label="홈페이지 URL"
              value={form.homepage}
              onChange={(v) => setField("homepage", v)}
              placeholder="https://..."
            />

            {/* 매출액 */}
            <Field
              label="매출액"
              value={form.revenue}
              onChange={(v) => setField("revenue", v)}
              placeholder="예: 연 매출 50억 / 미상"
            />

            {lookupMsg && (
              <div
                className={
                  "rounded-xl px-4 py-3 text-sm " +
                  (lookupStatus === "ok"
                    ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300"
                    : lookupStatus === "loading"
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                      : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300")
                }
              >
                {lookupMsg}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 관심 품목 */}
      <section className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
        <h2 className="text-lg font-semibold text-blue-600">📦 관심 품목</h2>
        <p className="mt-1.5 text-sm text-zinc-500">해당하는 품목을 모두 선택하세요.</p>
        <div className="mt-4">
          <CheckChips
            items={PRODUCTS}
            selected={form.interests}
            onToggle={(item) => toggleInList("interests", item)}
            etcValue={form.interestEtc}
            onEtcChange={(v) => setField("interestEtc", v)}
            etcPlaceholder="기타 관심 품목"
          />
        </div>
      </section>

      {/* 문의 내용 (분류별) */}
      <section className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
        <h2 className="text-lg font-semibold text-blue-600">💬 문의 내용</h2>
        <p className="mt-1.5 text-sm text-zinc-500">고객이 문의한 항목을 분류별로 선택하세요.</p>

        <div className="mt-4 space-y-5">
          {INQUIRY_GROUPS.map((group) => (
            <div key={group.label}>
              <span className="mb-2 block text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                {group.label}
              </span>
              <ChipRow
                items={group.items}
                selected={form.inquiries}
                onToggle={(item) => toggleInList("inquiries", item)}
              />
            </div>
          ))}

          {/* 기타: 직접 입력 */}
          <div>
            <span className="mb-2 block text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              기타
            </span>
            <input
              type="text"
              value={form.inquiryEtc}
              onChange={(e) => setField("inquiryEtc", e.target.value)}
              placeholder="기타 문의 내용을 직접 입력하세요"
              className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base dark:border-white/15 dark:bg-zinc-900"
            />
          </div>
        </div>
      </section>

      {/* 중요도 · 관심도 */}
      <section className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
        <h2 className="text-lg font-semibold text-blue-600">⭐ 중요도 · 관심도</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <span className="mb-2 block text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              중요도
            </span>
            <GradeSelect value={form.importance} onChange={(v) => setField("importance", v)} />
          </div>
          <div>
            <span className="mb-2 block text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              관심도
            </span>
            <GradeSelect value={form.interestLevel} onChange={(v) => setField("interestLevel", v)} />
          </div>
        </div>
      </section>

      {/* 상담 메모 */}
      <section className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
        <h2 className="text-lg font-semibold text-blue-600">📝 상담 메모</h2>
        <textarea
          value={form.memo}
          onChange={(e) => setField("memo", e.target.value)}
          rows={5}
          placeholder="상담하면서 메모할 내용을 자유롭게 적어주세요."
          className="mt-4 w-full resize-y rounded-xl border border-black/15 bg-white px-4 py-3 text-base leading-relaxed dark:border-white/15 dark:bg-zinc-900"
        />
      </section>
    </div>
  );
}
