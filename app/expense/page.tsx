"use client";

// 출장비 정산 화면입니다.
//  - 전시회 출장에 쓴 비용을 정산서처럼 "항목(섹션)별"로 묶어 보여줍니다.
//    (판촉물 제작 / 쉽먼트 / 항공·숙박 / 현지 비용 / 기타)
//  - 각 비용에 영수증(사진·PDF)을 여러 장 붙일 수 있고, 목록에서 바로 조회·추가할 수 있어요.
//  - 나중에 언제든 영수증을 더 추가할 수 있어요. 내용 수정·삭제도 가능합니다.
//  - 비용은 선택한 전시회의 expenses:<전시회id> 키로 localStorage에 저장됩니다.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useExhibitions } from "@/components/ExhibitionProvider";
import { formatDate, resizeImage } from "@/lib/consultation";
import {
  CATEGORIES,
  CURRENCIES,
  emptyDraft,
  expenseKey,
  formatMoney,
  formatTotals,
  groupByCategory,
  normalizeExpense,
  totalsByCurrency,
  type Expense,
  type ExpenseCategory,
  type Currency,
  type Receipt,
} from "@/lib/expense";

// 파일 → 영수증(데이터 URL). 사진은 용량을 줄이고, 그 외(PDF 등)는 그대로 읽어요.
async function readReceipt(file: File): Promise<Receipt> {
  if (file.type.startsWith("image/")) {
    const dataUrl = await resizeImage(file, 1600);
    return { name: file.name, dataUrl, kind: "image" };
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  const kind: Receipt["kind"] = file.type === "application/pdf" ? "pdf" : "file";
  return { name: file.name, dataUrl, kind };
}

// 여러 파일을 한 번에 영수증으로 읽기
async function readReceipts(files: FileList): Promise<Receipt[]> {
  const out: Receipt[] = [];
  for (const f of Array.from(files)) {
    try {
      out.push(await readReceipt(f));
    } catch {
      /* 못 읽는 파일은 건너뜀 */
    }
  }
  return out;
}

export default function ExpensePage() {
  const { selected } = useExhibitions();
  const storageKey = selected ? expenseKey(selected.id) : null;

  const [items, setItems] = useState<Expense[]>([]);
  const [draft, setDraft] = useState(emptyDraft());
  const [editing, setEditing] = useState<Expense | null>(null); // 수정 중인 비용
  const [viewer, setViewer] = useState<Receipt | null>(null); // 영수증 크게 보기
  const [busy, setBusy] = useState(false); // 파일 읽는 중

  const draftFileRef = useRef<HTMLInputElement>(null); // 새 비용 폼 영수증 입력
  const itemFileRef = useRef<HTMLInputElement>(null); // 목록에서 바로 추가할 때 쓰는 입력
  const pendingItemId = useRef<string | null>(null); // 어느 비용에 추가할지 기억

  // 저장된 비용 불러오기 (전시회 바뀌면 다시) — 예전 형식은 자동 변환
  useEffect(() => {
    if (!storageKey) {
      setItems([]);
      return;
    }
    const saved = localStorage.getItem(storageKey);
    const parsed: unknown[] = saved ? JSON.parse(saved) : [];
    setItems(parsed.map(normalizeExpense));
  }, [storageKey]);

  function save(next: Expense[]) {
    if (!storageKey) return;
    const sorted = [...next].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    try {
      localStorage.setItem(storageKey, JSON.stringify(sorted));
    } catch {
      alert("저장 공간이 부족해요. 영수증 파일 용량이 큰 경우 일부를 지워 주세요.");
      return;
    }
    setItems(sorted);
  }

  // 새 비용 폼에 영수증 첨부 (여러 장 가능)
  async function handleDraftFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setBusy(true);
    const receipts = await readReceipts(files);
    setDraft((d) => ({ ...d, receipts: [...d.receipts, ...receipts] }));
    setBusy(false);
    if (draftFileRef.current) draftFileRef.current.value = "";
  }

  // 목록의 특정 비용에 영수증 추가 (버튼 → 숨은 파일 입력 열기)
  function clickAddReceipt(id: string) {
    pendingItemId.current = id;
    itemFileRef.current?.click();
  }
  async function handleItemFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    const id = pendingItemId.current;
    if (!files?.length || !id) return;
    setBusy(true);
    const receipts = await readReceipts(files);
    save(items.map((x) => (x.id === id ? { ...x, receipts: [...x.receipts, ...receipts] } : x)));
    setBusy(false);
    pendingItemId.current = null;
    if (itemFileRef.current) itemFileRef.current.value = "";
  }

  // 비용 추가
  function handleAdd() {
    if (!draft.title.trim() || !(Number(draft.amount) > 0)) {
      alert("내용과 금액을 입력해 주세요.");
      return;
    }
    const entry: Expense = {
      ...draft,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      title: draft.title.trim(),
      memo: draft.memo.trim(),
      amount: Number(draft.amount),
    };
    save([...items, entry]);
    // 다음 입력을 위해 날짜·항목·통화는 유지, 내용/금액/비고/영수증만 비움
    setDraft((d) => ({ ...d, title: "", amount: 0, memo: "", receipts: [] }));
  }

  function handleDelete(id: string) {
    if (!confirm("이 비용 내역을 삭제할까요?")) return;
    save(items.filter((e) => e.id !== id));
  }

  // 수정 저장
  function saveEdit(updated: Expense) {
    save(items.map((e) => (e.id === updated.id ? updated : e)));
    setEditing(null);
  }

  // 전체 통화별 합계
  const grandTotals = useMemo(() => totalsByCurrency(items), [items]);
  // 항목(섹션)별 그룹
  const groups = useMemo(() => groupByCategory(items), [items]);

  // 엑셀 내려받기 (영수증 장수 표시)
  async function handleExport() {
    if (!items.length || !selected) return;
    const XLSX = await import("xlsx");
    const rows = groupByCategory(items).flatMap((g) =>
      g.items.map((e) => ({
        항목: g.label,
        지출일: e.date || "-",
        내용: e.title,
        금액: e.amount,
        통화: e.currency,
        비고: e.memo,
        영수증: e.receipts.length ? `${e.receipts.length}장` : "",
      })),
    );
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "출장비");
    const today = formatDate(new Date().toISOString()).slice(0, 10);
    XLSX.writeFile(wb, `${selected.name}_출장비_${today}.xlsx`);
  }

  // 전시회 미선택 안내
  if (!selected) {
    return (
      <main className="w-full px-8 py-8">
        <h1 className="text-3xl font-bold tracking-tight">출장비 정산</h1>
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

  const inputCls =
    "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900";

  return (
    <main className="mx-auto w-full max-w-4xl px-8 py-8">
      {/* 목록에서 영수증을 바로 추가할 때 쓰는 숨은 파일 입력 */}
      <input
        ref={itemFileRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        onChange={handleItemFiles}
        className="hidden"
      />

      {/* 헤더 */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">출장비 정산</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            항목별로 비용을 적으면 정산서처럼 한눈에 정리돼요. 영수증은 나중에도 추가할 수 있어요.
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={handleExport}
            className="rounded-xl border border-blue-300 px-5 py-2.5 text-base font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/30"
          >
            ⬇ 엑셀 추출 (.xlsx)
          </button>
        )}
      </div>

      {/* 전시회 배너 + 총 건수 */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-blue-50 px-5 py-3.5 text-base dark:bg-blue-950/40">
        <span className="font-semibold">{selected.name}</span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {selected.country}
          {selected.city ? ` · ${selected.city}` : ""}
        </span>
        <span className="ml-auto font-medium text-blue-700 dark:text-blue-300">
          총 {items.length}건
        </span>
      </div>

      {/* 총 합계 카드 (통화별) */}
      <div className="mt-4 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">총 합계</div>
        {grandTotals.length === 0 ? (
          <div className="mt-1 text-lg text-zinc-400">아직 기록된 비용이 없어요.</div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-x-8 gap-y-2">
            {grandTotals.map((t) => (
              <div key={t.currency}>
                <span className="text-2xl font-bold tabular-nums text-blue-700 dark:text-blue-300">
                  {formatMoney(t.total, t.currency)}
                </span>
                <span className="ml-1 text-xs text-zinc-400">{t.currency}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 비용 입력 폼 */}
      <div className="mt-6 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
        <div className="mb-3 text-sm font-semibold">＋ 비용 추가</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="text-xs text-zinc-500">지출일</span>
            <input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="text-xs text-zinc-500">항목</span>
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value as ExpenseCategory })}
              className={inputCls}
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs text-zinc-500">내용</span>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              placeholder="예: 인천-도쿄 왕복 항공권 (3명)"
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="text-xs text-zinc-500">금액</span>
            <input
              type="number"
              min={0}
              value={draft.amount || ""}
              onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              placeholder="0"
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="text-xs text-zinc-500">통화</span>
            <select
              value={draft.currency}
              onChange={(e) => setDraft({ ...draft, currency: e.target.value as Currency })}
              className={inputCls}
            >
              {CURRENCIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.symbol} {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs text-zinc-500">비고 (선택)</span>
            <input
              type="text"
              value={draft.memo}
              onChange={(e) => setDraft({ ...draft, memo: e.target.value })}
              placeholder="예: 카탈로그 스탠드 대여"
              className={inputCls}
            />
          </label>
        </div>

        {/* 새 비용 영수증 첨부 (여러 장 가능) */}
        <div className="mt-3">
          <span className="text-xs text-zinc-500">영수증 (선택 · 여러 장 가능)</span>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {draft.receipts.map((r, i) => (
              <ReceiptChip
                key={i}
                receipt={r}
                onView={() => setViewer(r)}
                onRemove={() =>
                  setDraft((d) => ({ ...d, receipts: d.receipts.filter((_, idx) => idx !== i) }))
                }
              />
            ))}
            <button
              type="button"
              onClick={() => draftFileRef.current?.click()}
              disabled={busy}
              className="rounded-lg border border-dashed border-black/20 px-3 py-2 text-xs text-zinc-500 hover:bg-black/[0.03] disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/[0.04]"
            >
              {busy ? "읽는 중..." : "＋ 파일 첨부 (사진·PDF)"}
            </button>
            <input
              ref={draftFileRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={handleDraftFiles}
              className="hidden"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            추가
          </button>
        </div>
      </div>

      {/* 항목(섹션)별 정리 */}
      {items.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-black/15 bg-black/[0.02] p-12 text-center dark:border-white/15 dark:bg-white/[0.03]">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            위에서 첫 비용을 추가해 보세요.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {groups.map((g, gi) => {
            if (g.items.length === 0) return null;
            const subtotal = totalsByCurrency(g.items);
            return (
              <section
                key={g.key}
                className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10"
              >
                {/* 섹션 머리 (정산서의 "1. 항공 및 숙박 관련 비용 ..." 줄) */}
                <div className="flex flex-wrap items-center gap-2 border-b border-black/10 bg-black/[0.03] px-5 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                  <span className="text-base font-bold">
                    {gi + 1}. {g.icon} {g.label}
                  </span>
                  <span className="text-xs text-zinc-400">{g.items.length}건</span>
                  <span className="ml-auto text-base font-bold tabular-nums text-blue-700 dark:text-blue-300">
                    {formatTotals(subtotal)}
                  </span>
                </div>
                {/* 섹션 안 비용들 — 한 건을 두 줄로 (내용+금액 / 날짜·메모·영수증·버튼) */}
                <ul className="divide-y divide-black/5 dark:divide-white/5">
                  {g.items.map((e) => (
                    <li
                      key={e.id}
                      className="group px-5 py-3.5 transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* 왼쪽: 내용 + 아래 메타 */}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium leading-snug">{e.title}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400 dark:text-zinc-500">
                            <span className="tabular-nums">{e.date || "날짜 미정"}</span>
                            {e.memo && (
                              <>
                                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                                <span className="truncate">{e.memo}</span>
                              </>
                            )}
                          </div>
                          {/* 영수증 조회 + 추가 (내용별로) */}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {e.receipts.map((r, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setViewer(r)}
                                title={r.name}
                                className="inline-flex max-w-[160px] items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60"
                              >
                                <span>{r.kind === "image" ? "🖼" : r.kind === "pdf" ? "📄" : "📎"}</span>
                                <span className="truncate">{r.name}</span>
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => clickAddReceipt(e.id)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 rounded-full border border-dashed border-black/20 px-2 py-0.5 text-[11px] text-zinc-500 hover:bg-black/[0.04] disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/[0.05]"
                            >
                              ＋ 영수증
                            </button>
                          </div>
                        </div>
                        {/* 오른쪽: 금액 + 아래 수정/삭제 */}
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <span className="text-base font-bold tabular-nums">
                            {formatMoney(e.amount, e.currency)}
                          </span>
                          <div className="flex gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => setEditing(e)}
                              className="rounded-md px-1.5 py-0.5 text-xs text-zinc-500 hover:bg-black/[0.06] dark:text-zinc-400 dark:hover:bg-white/[0.08]"
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(e.id)}
                              className="rounded-md px-1.5 py-0.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {/* ── 수정 창 ── */}
      {editing && (
        <EditModal
          expense={editing}
          onCancel={() => setEditing(null)}
          onSave={saveEdit}
          onView={(r) => setViewer(r)}
        />
      )}

      {/* ── 영수증 크게 보기 ── */}
      {viewer && <ReceiptViewer receipt={viewer} onClose={() => setViewer(null)} />}
    </main>
  );
}

// 영수증 한 장을 나타내는 작은 알약 (조회 + × 삭제)
function ReceiptChip({
  receipt,
  onView,
  onRemove,
}: {
  receipt: Receipt;
  onView: () => void;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-blue-50 py-1 pl-2 pr-1 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
      <button
        type="button"
        onClick={onView}
        title={receipt.name}
        className="max-w-[140px] truncate hover:underline"
      >
        {receipt.kind === "image" ? "🖼" : receipt.kind === "pdf" ? "📄" : "📎"} {receipt.name}
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="rounded px-1 text-blue-400 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/50"
        aria-label="영수증 삭제"
      >
        ✕
      </button>
    </span>
  );
}

// 영수증 크게 보기 창
function ReceiptViewer({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-8"
    >
      <div
        onClick={(ev) => ev.stopPropagation()}
        className="my-4 w-full max-w-3xl rounded-3xl bg-white p-4 shadow-2xl dark:bg-zinc-950 sm:p-6"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm text-zinc-500">📎 {receipt.name}</span>
          <div className="flex items-center gap-2">
            <a
              href={receipt.dataUrl}
              download={receipt.name}
              className="rounded-lg border border-black/15 px-3 py-1 text-xs hover:bg-black/[0.05] dark:border-white/15 dark:hover:bg-white/[0.06]"
            >
              ⬇ 저장
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-3 py-1 text-2xl text-zinc-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="mt-3">
          {receipt.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={receipt.dataUrl}
              alt={receipt.name}
              className="mx-auto max-h-[70vh] w-auto max-w-full rounded-xl object-contain"
            />
          ) : receipt.kind === "pdf" ? (
            <iframe src={receipt.dataUrl} title={receipt.name} className="h-[70vh] w-full rounded-xl" />
          ) : (
            <a
              href={receipt.dataUrl}
              download={receipt.name}
              className="inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              ⬇ 파일 내려받기
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// 비용 수정 창 — 항목·내용·금액·통화·영수증까지 모두 고칠 수 있어요.
function EditModal({
  expense,
  onCancel,
  onSave,
  onView,
}: {
  expense: Expense;
  onCancel: () => void;
  onSave: (e: Expense) => void;
  onView: (r: Receipt) => void;
}) {
  const [form, setForm] = useState<Expense>(expense);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const inputCls =
    "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900";

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setBusy(true);
    const receipts = await readReceipts(files);
    setForm((f) => ({ ...f, receipts: [...f.receipts, ...receipts] }));
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function submit() {
    if (!form.title.trim() || !(Number(form.amount) > 0)) {
      alert("내용과 금액을 입력해 주세요.");
      return;
    }
    onSave({
      ...form,
      title: form.title.trim(),
      memo: form.memo.trim(),
      amount: Number(form.amount),
    });
  }

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8"
    >
      <div
        onClick={(ev) => ev.stopPropagation()}
        className="my-4 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-950"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">비용 수정</h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-3 py-1 text-2xl text-zinc-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-zinc-500">지출일</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="text-xs text-zinc-500">항목</span>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
              className={inputCls}
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="col-span-2 block">
            <span className="text-xs text-zinc-500">내용</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="text-xs text-zinc-500">금액</span>
            <input
              type="number"
              min={0}
              value={form.amount || ""}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="text-xs text-zinc-500">통화</span>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value as Currency })}
              className={inputCls}
            >
              {CURRENCIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.symbol} {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="col-span-2 block">
            <span className="text-xs text-zinc-500">비고</span>
            <input
              type="text"
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              className={inputCls}
            />
          </label>
          {/* 영수증 (여러 장) */}
          <div className="col-span-2">
            <span className="text-xs text-zinc-500">영수증 (여러 장 가능)</span>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {form.receipts.map((r, i) => (
                <ReceiptChip
                  key={i}
                  receipt={r}
                  onView={() => onView(r)}
                  onRemove={() =>
                    setForm((f) => ({ ...f, receipts: f.receipts.filter((_, idx) => idx !== i) }))
                  }
                />
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="rounded-lg border border-dashed border-black/20 px-3 py-2 text-xs text-zinc-500 hover:bg-black/[0.03] disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/[0.04]"
              >
                {busy ? "읽는 중..." : "＋ 파일 첨부 (사진·PDF)"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={handleFiles}
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-black/15 px-5 py-2.5 text-sm hover:bg-black/[0.05] dark:border-white/15 dark:hover:bg-white/[0.06]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
