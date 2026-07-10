"use client";

// 전시회 준비 체크리스트 화면입니다.
//  - 기본 항목 목록은 lib/checklist.ts(CHECKLIST)에서 가져옵니다.
//  - 항목마다 체크 + "진행상황 및 비고"를 적을 수 있고, 직접 항목을 추가/삭제할 수 있어요.
//  - 저장은 선택한 전시회별로 checklist:<전시회id> 키에 담깁니다.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useExhibitions } from "@/components/ExhibitionProvider";
import { CHECKLIST, type ChecklistItem, type ChecklistPhase } from "@/lib/checklist";

// 항목 하나의 상태(체크 여부 · 진행상황 및 비고)
type ItemState = { done?: boolean; note?: string };
// 직접 추가한 항목
type CustomItem = { id: string; phase: ChecklistPhase["key"]; label: string };
// 전시회 한 개의 체크리스트 저장 형태
type Data = { items: Record<string, ItemState>; custom: CustomItem[] };

// 기본(템플릿) 항목 id 전부
const TEMPLATE_ITEMS: ChecklistItem[] = CHECKLIST.flatMap((p) => p.groups.flatMap((g) => g.items));

// 저장된 값 불러오기 (예전에 배열/진행상황 분리 형식도 처리)
function loadData(raw: string | null): Data {
  if (!raw) return { items: {}, custom: [] };
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) {
    const items: Record<string, ItemState> = {};
    for (const id of parsed as string[]) items[id] = { done: true };
    return { items, custom: [] };
  }
  // 예전에 progress/note 두 칸으로 저장했던 경우 하나로 합칩니다.
  const items: Record<string, ItemState> = {};
  for (const [id, v] of Object.entries((parsed.items ?? {}) as Record<string, { done?: boolean; progress?: string; note?: string }>)) {
    const merged = [v.progress, v.note].filter((s) => s && s.trim()).join(" · ");
    items[id] = { done: v.done, note: merged || undefined };
  }
  return { items, custom: parsed.custom ?? [] };
}

export default function ChecklistPage() {
  const { selected } = useExhibitions();
  const storageKey = selected ? `checklist:${selected.id}` : null;

  const [data, setData] = useState<Data>({ items: {}, custom: [] });

  useEffect(() => {
    if (!storageKey) {
      setData({ items: {}, custom: [] });
      return;
    }
    setData(loadData(localStorage.getItem(storageKey)));
  }, [storageKey]);

  function update(next: Data) {
    setData(next);
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function setItem(id: string, patch: Partial<ItemState>) {
    update({ ...data, items: { ...data.items, [id]: { ...data.items[id], ...patch } } });
  }

  function addCustom(phase: ChecklistPhase["key"], label: string) {
    const clean = label.trim();
    if (!clean) return;
    update({
      ...data,
      custom: [...data.custom, { id: `custom-${crypto.randomUUID()}`, phase, label: clean }],
    });
  }

  function removeCustom(id: string) {
    const items = { ...data.items };
    delete items[id];
    update({ items, custom: data.custom.filter((c) => c.id !== id) });
  }

  function resetAll() {
    if (!confirm("이 전시회의 체크·진행상황 및 비고·추가항목을 모두 지울까요?")) return;
    update({ items: {}, custom: [] });
  }

  // 진행률 계산 (기본 + 추가 항목 전부)
  const { doneCount, total } = useMemo(() => {
    const allIds = [...TEMPLATE_ITEMS.map((it) => it.id), ...data.custom.map((c) => c.id)];
    return {
      doneCount: allIds.filter((id) => data.items[id]?.done).length,
      total: allIds.length,
    };
  }, [data]);
  const overallPct = total ? Math.round((doneCount / total) * 100) : 0;

  // 전시회 미선택 안내
  if (!selected) {
    return (
      <main className="w-full px-8 py-8">
        <h1 className="text-3xl font-bold">체크리스트</h1>
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

  return (
    <main className="w-full px-8 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">체크리스트</h1>
        <button
          type="button"
          onClick={resetAll}
          className="rounded-lg border border-black/15 px-3 py-1.5 text-sm text-zinc-600 hover:bg-black/[0.05] dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/[0.06]"
        >
          전체 초기화
        </button>
      </div>

      {/* 전시회 배너 */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-blue-50 px-5 py-3.5 text-base dark:bg-blue-950/40">
        <span className="text-lg">🎪</span>
        <span className="font-semibold">{selected.name}</span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {selected.country}
          {selected.city ? ` · ${selected.city}` : ""}
        </span>
      </div>

      {/* 전체 진행률 */}
      <section className="mt-4 rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <div className="flex items-end justify-between">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">전체 진행률</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            <b className="text-lg text-blue-600 dark:text-blue-400">{doneCount}</b> / {total} 완료 · {overallPct}%
          </span>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
          <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${overallPct}%` }} />
        </div>
      </section>

      <p className="mt-3 text-sm text-zinc-500">
        💡 항목마다 <b>진행상황 및 비고</b>를 바로 적을 수 있어요. 각 단계 끝의 카드에서 항목을 직접 추가할 수 있어요.
      </p>

      {/* 단계별(전/중/후) 체크리스트 */}
      <div className="mt-6 space-y-10">
        {CHECKLIST.map((phase) => (
          <PhaseBlock
            key={phase.key}
            phase={phase}
            data={data}
            onToggle={(id) => setItem(id, { done: !data.items[id]?.done })}
            onNote={(id, v) => setItem(id, { note: v })}
            onAddCustom={(label) => addCustom(phase.key, label)}
            onRemoveCustom={removeCustom}
          />
        ))}
      </div>
    </main>
  );
}

// 한 단계(전/중/후) 블록
function PhaseBlock({
  phase,
  data,
  onToggle,
  onNote,
  onAddCustom,
  onRemoveCustom,
}: {
  phase: ChecklistPhase;
  data: Data;
  onToggle: (id: string) => void;
  onNote: (id: string, v: string) => void;
  onAddCustom: (label: string) => void;
  onRemoveCustom: (id: string) => void;
}) {
  const customItems = data.custom.filter((c) => c.phase === phase.key);
  const templateItems = phase.groups.flatMap((g) => g.items);
  const allIds = [...templateItems.map((it) => it.id), ...customItems.map((c) => c.id)];
  const done = allIds.filter((id) => data.items[id]?.done).length;
  const pct = allIds.length ? Math.round((done / allIds.length) * 100) : 0;

  return (
    <section>
      {/* 단계 헤더 */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-2xl">{phase.emoji}</span>
        <h2 className="text-xl font-bold">{phase.label}</h2>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden h-2 w-32 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08] sm:block">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {done} / {allIds.length}
          </span>
        </div>
      </div>

      {/* 대분류 카드들 — 넓게 여러 열로 배치 */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {phase.groups.map((group) => {
          const gDone = group.items.filter((it) => data.items[it.id]?.done).length;
          return (
            <GroupCard key={group.title} title={group.title} done={gDone} all={group.items.length}>
              {group.items.map((item) => (
                <ItemRow
                  key={item.id}
                  label={item.label}
                  note={item.note}
                  state={data.items[item.id]}
                  onToggle={() => onToggle(item.id)}
                  onNote={(v) => onNote(item.id, v)}
                />
              ))}
            </GroupCard>
          );
        })}

        {/* 직접 추가한 항목 + 추가 폼 */}
        <AddCard
          items={customItems}
          data={data}
          onToggle={onToggle}
          onNote={onNote}
          onRemove={onRemoveCustom}
          onAdd={onAddCustom}
        />
      </div>
    </section>
  );
}

// 대분류 카드 껍데기
function GroupCard({
  title,
  done,
  all,
  children,
}: {
  title: string;
  done: number;
  all: number;
  children: React.ReactNode;
}) {
  const complete = all > 0 && done === all;
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-zinc-700 dark:text-zinc-200">{title}</h3>
        <span
          className={
            "rounded-full px-2 py-0.5 text-xs font-semibold " +
            (complete
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
              : "bg-black/[0.05] text-zinc-500 dark:bg-white/[0.08] dark:text-zinc-400")
          }
        >
          {done}/{all}
        </span>
      </div>
      <ul className="space-y-3">{children}</ul>
    </div>
  );
}

// 항목 한 줄 (체크 + 라벨 + 항상 보이는 "진행상황 및 비고" 칸)
function ItemRow({
  label,
  note,
  state,
  onToggle,
  onNote,
  onRemove,
}: {
  label: string;
  note?: string;
  state?: ItemState;
  onToggle: () => void;
  onNote: (v: string) => void;
  onRemove?: () => void;
}) {
  const on = !!state?.done;

  return (
    <li>
      <div className="flex items-start gap-2.5">
        {/* 체크박스 */}
        <button
          type="button"
          onClick={onToggle}
          aria-label="완료 체크"
          className={
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-sm text-white transition " +
            (on ? "border-blue-600 bg-blue-600" : "border-black/25 bg-transparent dark:border-white/30")
          }
        >
          {on ? "✓" : ""}
        </button>

        {/* 라벨 */}
        <div className="flex-1">
          <span
            className={
              "text-base " +
              (on ? "text-zinc-400 line-through dark:text-zinc-500" : "text-zinc-800 dark:text-zinc-100")
            }
          >
            {label}
          </span>
          {note && <span className="mt-0.5 block text-sm text-zinc-400 dark:text-zinc-500">{note}</span>}
        </div>

        {/* 삭제(추가 항목만) */}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="항목 삭제"
            className="shrink-0 rounded-md px-1.5 py-0.5 text-sm text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
          >
            ✕
          </button>
        )}
      </div>

      {/* 진행상황 및 비고 (항상 보임) */}
      <input
        type="text"
        value={state?.note ?? ""}
        onChange={(e) => onNote(e.target.value)}
        placeholder="진행상황 및 비고"
        className="mt-1.5 ml-9 w-[calc(100%-2.25rem)] rounded-lg border border-black/10 bg-black/[0.02] px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/[0.04]"
      />
    </li>
  );
}

// "직접 추가한 항목" 카드 (목록 + 추가 입력)
function AddCard({
  items,
  data,
  onToggle,
  onNote,
  onRemove,
  onAdd,
}: {
  items: CustomItem[];
  data: Data;
  onToggle: (id: string) => void;
  onNote: (id: string, v: string) => void;
  onRemove: (id: string) => void;
  onAdd: (label: string) => void;
}) {
  const [text, setText] = useState("");
  const done = items.filter((it) => data.items[it.id]?.done).length;

  function submit() {
    onAdd(text);
    setText("");
  }

  return (
    <div className="rounded-2xl border border-dashed border-blue-400/60 bg-blue-50/40 p-5 dark:border-blue-500/40 dark:bg-blue-950/15">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-blue-700 dark:text-blue-300">➕ 직접 추가한 항목</h3>
        {items.length > 0 && (
          <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-white/[0.08] dark:text-zinc-400">
            {done}/{items.length}
          </span>
        )}
      </div>

      {items.length > 0 && (
        <ul className="mb-3 space-y-3">
          {items.map((it) => (
            <ItemRow
              key={it.id}
              label={it.label}
              state={data.items[it.id]}
              onToggle={() => onToggle(it.id)}
              onNote={(v) => onNote(it.id, v)}
              onRemove={() => onRemove(it.id)}
            />
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="새 항목 입력 후 Enter"
          className="flex-1 rounded-lg border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-950"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim()}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
        >
          추가
        </button>
      </div>
    </div>
  );
}
