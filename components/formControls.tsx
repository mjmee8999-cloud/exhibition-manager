"use client";

// 상담일지 화면들이 함께 쓰는 작은 입력 부품들입니다.
//  - Field: 라벨 + 한 줄 입력칸
//  - ChipRow: 여러 개 고르는 칩(체크박스) 한 줄
//  - CheckChips: 칩 + "기타" 직접입력칸
//  - GradeSelect: 중요도/관심도 A·B·C 선택
//  - GradeBadge: 표에서 A/B/C를 색배지로 표시

import type { Grade } from "@/lib/consultation";

// 입력칸 하나 (라벨 + input)
export function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-300">
        {label}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base dark:border-white/15 dark:bg-zinc-900"
      />
    </label>
  );
}

// 칩(체크박스) 한 줄
export function ChipRow({
  items,
  selected,
  onToggle,
}: {
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {items.map((item) => {
        const on = selected.includes(item);
        return (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            className={
              "rounded-full border px-4 py-2 text-sm font-medium transition " +
              (on
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-black/15 text-zinc-600 hover:border-blue-400 dark:border-white/15 dark:text-zinc-300")
            }
          >
            {on ? "✓ " : ""}
            {item}
          </button>
        );
      })}
    </div>
  );
}

// 칩 + "기타" 입력칸까지 (관심 품목 / 판매 채널용)
export function CheckChips({
  items,
  selected,
  onToggle,
  etcValue,
  onEtcChange,
  etcPlaceholder,
}: {
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  etcValue: string;
  onEtcChange: (value: string) => void;
  etcPlaceholder: string;
}) {
  return (
    <>
      <ChipRow items={[...items, "기타"]} selected={selected} onToggle={onToggle} />
      {selected.includes("기타") && (
        <input
          type="text"
          value={etcValue}
          onChange={(e) => onEtcChange(e.target.value)}
          placeholder={etcPlaceholder}
          className="mt-3 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base dark:border-white/15 dark:bg-zinc-900 sm:max-w-md"
        />
      )}
    </>
  );
}

// 중요도/관심도 A·B·C 선택 (다시 누르면 해제). 버튼에 등급과 뜻을 함께 표시.
export function GradeSelect({
  value,
  onChange,
}: {
  value: Grade;
  onChange: (v: Grade) => void;
}) {
  const options: Array<{ g: "A" | "B" | "C"; label: string }> = [
    { g: "A", label: "높음" },
    { g: "B", label: "보통" },
    { g: "C", label: "낮음" },
  ];
  return (
    <div className="flex gap-2.5">
      {options.map(({ g, label }) => (
        <button
          key={g}
          type="button"
          onClick={() => onChange(value === g ? "" : g)}
          className={gradeButtonClass(g, value === g)}
        >
          <span className="text-lg font-bold">{g}</span>
          <span className="text-xs font-normal opacity-80">({label})</span>
        </button>
      ))}
    </div>
  );
}

// A/B/C 버튼 색상 (선택 시 A=빨강, B=주황, C=파랑)
function gradeButtonClass(grade: "A" | "B" | "C", on: boolean): string {
  const base = "flex flex-1 flex-col items-center gap-0.5 rounded-xl border py-3 transition ";
  if (!on) {
    return (
      base +
      "border-black/15 text-zinc-500 hover:bg-black/[0.03] dark:border-white/15 dark:text-zinc-400 dark:hover:bg-white/[0.05]"
    );
  }
  if (grade === "A") return base + "border-red-600 bg-red-600 text-white";
  if (grade === "B") return base + "border-amber-500 bg-amber-500 text-white";
  return base + "border-blue-600 bg-blue-600 text-white";
}

// 표에서 중요도/관심도를 색배지로 (A=빨강, B=주황, C=파랑)
export function GradeBadge({ grade }: { grade: Grade }) {
  if (!grade) return <span className="text-zinc-400">-</span>;
  const color =
    grade === "A"
      ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
      : grade === "B"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
        : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";
  return (
    <span className={"inline-block rounded-full px-2.5 py-1 text-xs font-bold " + color}>
      {grade}
    </span>
  );
}
