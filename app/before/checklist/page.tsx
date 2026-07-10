"use client";

// 전시회 준비 체크리스트 화면입니다.
//  - "구성"(섹션·항목)은 모든 전시회 공통이며 localStorage(checklist:structure)에 저장돼요.
//    처음엔 lib/checklist.ts의 기본값(DEFAULT_CHECKLIST)으로 시작합니다.
//  - "수정" 버튼을 켜면 섹션/항목을 추가·삭제·이름변경·이동할 수 있어요.
//  - 체크 여부와 "진행상황 및 비고"는 전시회별(checklist:<전시회id>)로 따로 저장됩니다.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useExhibitions } from "@/components/ExhibitionProvider";
import {
  DEFAULT_CHECKLIST,
  type ChecklistGroup,
  type ChecklistPhase,
} from "@/lib/checklist";

// 항목별 진행 상태(체크 · 진행상황 및 비고)
type ItemState = { done?: boolean; note?: string };
type Progress = Record<string, ItemState>;

const STRUCTURE_KEY = "checklist:structure";

// 깊은 복사 (구조 변경이 기본값에 영향 주지 않도록)
function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function loadStructure(): ChecklistPhase[] {
  if (typeof window === "undefined") return clone(DEFAULT_CHECKLIST);
  const raw = localStorage.getItem(STRUCTURE_KEY);
  if (!raw) return clone(DEFAULT_CHECKLIST);
  try {
    const parsed = JSON.parse(raw) as ChecklistPhase[];
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {
    // 형식 오류 시 기본값
  }
  return clone(DEFAULT_CHECKLIST);
}

function loadProgress(raw: string | null): Progress {
  if (!raw) return {};
  const parsed = JSON.parse(raw);
  // 예전 배열 형식(체크된 id 목록)도 처리
  if (Array.isArray(parsed)) {
    const p: Progress = {};
    for (const id of parsed as string[]) p[id] = { done: true };
    return p;
  }
  // 예전 {items:{id:{done,progress,note}}} → note 하나로 합치기
  const src = (parsed.items ?? {}) as Record<string, { done?: boolean; progress?: string; note?: string }>;
  const p: Progress = {};
  for (const [id, v] of Object.entries(src)) {
    const merged = [v.progress, v.note].filter((s) => s && s.trim()).join(" · ");
    p[id] = { done: v.done, note: merged || undefined };
  }
  return p;
}

export default function ChecklistPage() {
  const { selected } = useExhibitions();
  const progressKey = selected ? `checklist:${selected.id}` : null;

  const [structure, setStructure] = useState<ChecklistPhase[]>(() => clone(DEFAULT_CHECKLIST));
  const [progress, setProgress] = useState<Progress>({});
  const [editing, setEditing] = useState(false);

  // 구성은 앱 공통이라 처음 한 번만 로드
  useEffect(() => {
    setStructure(loadStructure());
  }, []);

  // 진행 상태는 선택한 전시회에 따라 로드
  useEffect(() => {
    if (!progressKey) {
      setProgress({});
      return;
    }
    setProgress(loadProgress(localStorage.getItem(progressKey)));
  }, [progressKey]);

  function saveStructure(next: ChecklistPhase[]) {
    setStructure(next);
    localStorage.setItem(STRUCTURE_KEY, JSON.stringify(next));
  }

  function saveProgress(next: Progress) {
    setProgress(next);
    if (progressKey) localStorage.setItem(progressKey, JSON.stringify({ items: next }));
  }

  // ── 진행 상태 변경 ──
  function setItem(id: string, patch: Partial<ItemState>) {
    saveProgress({ ...progress, [id]: { ...progress[id], ...patch } });
  }

  // ── 구성 변경 (수정 모드) ──
  function updatePhase(phaseKey: string, fn: (groups: ChecklistGroup[]) => ChecklistGroup[]) {
    saveStructure(
      structure.map((p) => (p.key === phaseKey ? { ...p, groups: fn(p.groups) } : p)),
    );
  }

  function addGroup(phaseKey: string) {
    updatePhase(phaseKey, (groups) => [
      ...groups,
      { id: `g-${crypto.randomUUID()}`, title: "새 섹션", items: [] },
    ]);
  }

  function renameGroup(phaseKey: string, groupId: string, title: string) {
    updatePhase(phaseKey, (groups) => groups.map((g) => (g.id === groupId ? { ...g, title } : g)));
  }

  function deleteGroup(phaseKey: string, groupId: string) {
    const g = structure.find((p) => p.key === phaseKey)?.groups.find((x) => x.id === groupId);
    if (g && g.items.length > 0 && !confirm(`「${g.title}」 섹션과 그 안의 항목 ${g.items.length}개를 지울까요?`)) return;
    updatePhase(phaseKey, (groups) => groups.filter((g) => g.id !== groupId));
  }

  function addItem(phaseKey: string, groupId: string, label: string) {
    const clean = label.trim();
    if (!clean) return;
    updatePhase(phaseKey, (groups) =>
      groups.map((g) =>
        g.id === groupId ? { ...g, items: [...g.items, { id: `i-${crypto.randomUUID()}`, label: clean }] } : g,
      ),
    );
  }

  function renameItem(phaseKey: string, groupId: string, itemId: string, label: string) {
    updatePhase(phaseKey, (groups) =>
      groups.map((g) =>
        g.id === groupId
          ? { ...g, items: g.items.map((it) => (it.id === itemId ? { ...it, label } : it)) }
          : g,
      ),
    );
  }

  function deleteItem(phaseKey: string, groupId: string, itemId: string) {
    updatePhase(phaseKey, (groups) =>
      groups.map((g) => (g.id === groupId ? { ...g, items: g.items.filter((it) => it.id !== itemId) } : g)),
    );
  }

  function moveItem(phaseKey: string, fromGroupId: string, toGroupId: string, itemId: string) {
    if (fromGroupId === toGroupId) return;
    updatePhase(phaseKey, (groups) => {
      const item = groups.find((g) => g.id === fromGroupId)?.items.find((it) => it.id === itemId);
      if (!item) return groups;
      return groups.map((g) => {
        if (g.id === fromGroupId) return { ...g, items: g.items.filter((it) => it.id !== itemId) };
        if (g.id === toGroupId) return { ...g, items: [...g.items, item] };
        return g;
      });
    });
  }

  function resetStructure() {
    if (!confirm("체크리스트 구성을 처음 기본값으로 되돌릴까요? (직접 만든 섹션·항목은 사라져요. 체크·비고 기록은 유지)")) return;
    saveStructure(clone(DEFAULT_CHECKLIST));
  }

  function resetProgress() {
    if (!confirm("이 전시회의 체크·진행상황 및 비고를 모두 지울까요?")) return;
    saveProgress({});
  }

  // 진행률 (구조 안 모든 항목 기준)
  const { doneCount, total } = useMemo(() => {
    const ids = structure.flatMap((p) => p.groups.flatMap((g) => g.items.map((it) => it.id)));
    return { doneCount: ids.filter((id) => progress[id]?.done).length, total: ids.length };
  }, [structure, progress]);
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
        <div className="flex flex-wrap gap-2">
          {editing && (
            <button
              type="button"
              onClick={resetStructure}
              className="rounded-lg border border-black/15 px-3 py-1.5 text-sm text-zinc-600 hover:bg-black/[0.05] dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/[0.06]"
            >
              구성 기본값으로
            </button>
          )}
          {!editing && (
            <button
              type="button"
              onClick={resetProgress}
              className="rounded-lg border border-black/15 px-3 py-1.5 text-sm text-zinc-600 hover:bg-black/[0.05] dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/[0.06]"
            >
              체크 초기화
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            className={
              "rounded-lg px-5 py-2 text-sm font-bold text-white shadow-sm transition " +
              (editing ? "bg-blue-600 hover:bg-blue-700" : "bg-amber-500 hover:bg-amber-600")
            }
          >
            {editing ? "✓ 수정 완료" : "✏ 항목 수정"}
          </button>
        </div>
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

      {editing ? (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          🛠 수정 모드예요. 섹션·항목을 추가/삭제/이름변경/이동할 수 있어요. <b>구성 변경은 모든 전시회에 공통 적용</b>돼요.
        </p>
      ) : (
        <>
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
          <p className="mt-3 text-sm text-zinc-500">💡 항목마다 진행상황 및 비고를 바로 적을 수 있어요.</p>
        </>
      )}

      {/* 단계별(전/중/후) */}
      <div className="mt-6 space-y-10">
        {structure.map((phase) => (
          <PhaseBlock
            key={phase.key}
            phase={phase}
            progress={progress}
            editing={editing}
            onToggle={(id) => setItem(id, { done: !progress[id]?.done })}
            onNote={(id, v) => setItem(id, { note: v })}
            onAddGroup={() => addGroup(phase.key)}
            onRenameGroup={(gid, t) => renameGroup(phase.key, gid, t)}
            onDeleteGroup={(gid) => deleteGroup(phase.key, gid)}
            onAddItem={(gid, label) => addItem(phase.key, gid, label)}
            onRenameItem={(gid, iid, label) => renameItem(phase.key, gid, iid, label)}
            onDeleteItem={(gid, iid) => deleteItem(phase.key, gid, iid)}
            onMoveItem={(from, to, iid) => moveItem(phase.key, from, to, iid)}
          />
        ))}
      </div>
    </main>
  );
}

// 한 단계(전/중/후) 블록
function PhaseBlock({
  phase,
  progress,
  editing,
  onToggle,
  onNote,
  onAddGroup,
  onRenameGroup,
  onDeleteGroup,
  onAddItem,
  onRenameItem,
  onDeleteItem,
  onMoveItem,
}: {
  phase: ChecklistPhase;
  progress: Progress;
  editing: boolean;
  onToggle: (id: string) => void;
  onNote: (id: string, v: string) => void;
  onAddGroup: () => void;
  onRenameGroup: (groupId: string, title: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onAddItem: (groupId: string, label: string) => void;
  onRenameItem: (groupId: string, itemId: string, label: string) => void;
  onDeleteItem: (groupId: string, itemId: string) => void;
  onMoveItem: (fromGroupId: string, toGroupId: string, itemId: string) => void;
}) {
  const allIds = phase.groups.flatMap((g) => g.items.map((it) => it.id));
  const done = allIds.filter((id) => progress[id]?.done).length;
  const pct = allIds.length ? Math.round((done / allIds.length) * 100) : 0;

  return (
    <section>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-2xl">{phase.emoji}</span>
        <h2 className="text-xl font-bold">{phase.label}</h2>
        {!editing && (
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden h-2 w-32 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08] sm:block">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {done} / {allIds.length}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {phase.groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            phase={phase}
            progress={progress}
            editing={editing}
            onToggle={onToggle}
            onNote={onNote}
            onRenameGroup={(t) => onRenameGroup(group.id, t)}
            onDeleteGroup={() => onDeleteGroup(group.id)}
            onAddItem={(label) => onAddItem(group.id, label)}
            onRenameItem={(iid, label) => onRenameItem(group.id, iid, label)}
            onDeleteItem={(iid) => onDeleteItem(group.id, iid)}
            onMoveItem={(to, iid) => onMoveItem(group.id, to, iid)}
          />
        ))}

        {/* 섹션 추가 (수정 모드) */}
        {editing && (
          <button
            type="button"
            onClick={onAddGroup}
            className="flex min-h-[6rem] items-center justify-center rounded-2xl border border-dashed border-blue-400/60 bg-blue-50/40 p-5 text-sm font-semibold text-blue-700 hover:bg-blue-100/60 dark:border-blue-500/40 dark:bg-blue-950/15 dark:text-blue-300 dark:hover:bg-blue-950/30"
          >
            ＋ 섹션 추가
          </button>
        )}
      </div>
    </section>
  );
}

// 섹션(대분류) 카드
function GroupCard({
  group,
  phase,
  progress,
  editing,
  onToggle,
  onNote,
  onRenameGroup,
  onDeleteGroup,
  onAddItem,
  onRenameItem,
  onDeleteItem,
  onMoveItem,
}: {
  group: ChecklistGroup;
  phase: ChecklistPhase;
  progress: Progress;
  editing: boolean;
  onToggle: (id: string) => void;
  onNote: (id: string, v: string) => void;
  onRenameGroup: (title: string) => void;
  onDeleteGroup: () => void;
  onAddItem: (label: string) => void;
  onRenameItem: (itemId: string, label: string) => void;
  onDeleteItem: (itemId: string) => void;
  onMoveItem: (toGroupId: string, itemId: string) => void;
}) {
  const [newItem, setNewItem] = useState("");
  const done = group.items.filter((it) => progress[it.id]?.done).length;
  const complete = group.items.length > 0 && done === group.items.length;
  const otherGroups = phase.groups.filter((g) => g.id !== group.id);

  function submitItem() {
    onAddItem(newItem);
    setNewItem("");
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
      {/* 헤더: 제목 (수정 모드에선 입력칸) */}
      <div className="mb-3 flex items-center justify-between gap-2">
        {editing ? (
          <input
            type="text"
            value={group.title}
            onChange={(e) => onRenameGroup(e.target.value)}
            placeholder="섹션 이름"
            className="min-w-0 flex-1 rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-base font-bold dark:border-white/15 dark:bg-zinc-950"
          />
        ) : (
          <h3 className="text-base font-bold text-zinc-700 dark:text-zinc-200">{group.title}</h3>
        )}
        {editing ? (
          <button
            type="button"
            onClick={onDeleteGroup}
            aria-label="섹션 삭제"
            className="shrink-0 rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
          >
            섹션 삭제
          </button>
        ) : (
          <span
            className={
              "rounded-full px-2 py-0.5 text-xs font-semibold " +
              (complete
                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                : "bg-black/[0.05] text-zinc-500 dark:bg-white/[0.08] dark:text-zinc-400")
            }
          >
            {done}/{group.items.length}
          </span>
        )}
      </div>

      <ul className={editing ? "space-y-2" : "space-y-3"}>
        {group.items.map((item) =>
          editing ? (
            <EditItemRow
              key={item.id}
              label={item.label}
              otherGroups={otherGroups}
              onRename={(v) => onRenameItem(item.id, v)}
              onDelete={() => onDeleteItem(item.id)}
              onMove={(toId) => onMoveItem(toId, item.id)}
            />
          ) : (
            <ItemRow
              key={item.id}
              label={item.label}
              note={item.note}
              state={progress[item.id]}
              onToggle={() => onToggle(item.id)}
              onNote={(v) => onNote(item.id, v)}
            />
          ),
        )}
        {editing && group.items.length === 0 && (
          <li className="rounded-lg py-2 text-center text-xs text-zinc-400">아직 항목이 없어요.</li>
        )}
      </ul>

      {/* 항목 추가 (수정 모드) */}
      {editing && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitItem();
            }}
            placeholder="새 항목 입력 후 Enter"
            className="flex-1 rounded-lg border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-950"
          />
          <button
            type="button"
            onClick={submitItem}
            disabled={!newItem.trim()}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
          >
            추가
          </button>
        </div>
      )}
    </div>
  );
}

// 항목 한 줄 (일반 모드: 체크 + 라벨 + 진행상황 및 비고)
function ItemRow({
  label,
  note,
  state,
  onToggle,
  onNote,
}: {
  label: string;
  note?: string;
  state?: ItemState;
  onToggle: () => void;
  onNote: (v: string) => void;
}) {
  const on = !!state?.done;
  return (
    <li>
      <div className="flex items-start gap-2.5">
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
      </div>
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

// 항목 한 줄 (수정 모드: 이름변경 + 이동 + 삭제)
function EditItemRow({
  label,
  otherGroups,
  onRename,
  onDelete,
  onMove,
}: {
  label: string;
  otherGroups: ChecklistGroup[];
  onRename: (v: string) => void;
  onDelete: () => void;
  onMove: (toGroupId: string) => void;
}) {
  return (
    <li className="flex items-center gap-2">
      <input
        type="text"
        value={label}
        onChange={(e) => onRename(e.target.value)}
        className="min-w-0 flex-1 rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-sm dark:border-white/15 dark:bg-zinc-950"
      />
      {otherGroups.length > 0 && (
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) onMove(e.target.value);
          }}
          aria-label="다른 섹션으로 이동"
          className="shrink-0 rounded-lg border border-black/15 bg-white px-1.5 py-1.5 text-xs text-zinc-600 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-300"
        >
          <option value="">이동…</option>
          {otherGroups.map((g) => (
            <option key={g.id} value={g.id}>
              → {g.title}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        onClick={onDelete}
        aria-label="항목 삭제"
        className="shrink-0 rounded-md px-1.5 py-1 text-sm text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
      >
        ✕
      </button>
    </li>
  );
}
