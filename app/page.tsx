"use client";

// 홈 = 현재 선택한 전시회의 "종합 현황판(대시보드)"입니다.
//  - 체크리스트 진행도, 상담 실적 요약, 현장 사진, 핵심 고객 등을 한눈에 보여줍니다.
//  - 자료는 각 기능이 저장한 localStorage(전시회별 키)에서 읽어와 요약합니다.
//  - 각 카드에서 상세 화면으로 바로 이동할 수 있어요.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useExhibitions, type Exhibition } from "@/components/ExhibitionProvider";
import { type Consultation } from "@/lib/consultation";
import { DEFAULT_CHECKLIST, type ChecklistPhase } from "@/lib/checklist";

type EditForm = Omit<Exhibition, "id">;
type Photo = { id: string; image: string; caption?: string };

// 체크리스트 구조 불러오기 (수정본이 있으면 그것, 없으면 기본값)
function loadStructure(): ChecklistPhase[] {
  const raw = localStorage.getItem("checklist:structure");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as ChecklistPhase[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {
      /* 무시 */
    }
  }
  return DEFAULT_CHECKLIST;
}

// 체크리스트 진행 상태(체크된 항목) 불러오기 (옛 형식도 처리)
function loadChecked(raw: string | null): Set<string> {
  if (!raw) return new Set();
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) return new Set(parsed as string[]);
  const items = (parsed.items ?? {}) as Record<string, { done?: boolean }>;
  return new Set(Object.entries(items).filter(([, v]) => v.done).map(([id]) => id));
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function Home() {
  const { selected, updateExhibition } = useExhibitions();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [structure, setStructure] = useState<ChecklistPhase[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const [editForm, setEditForm] = useState<EditForm | null>(null);

  // 선택된 전시회의 자료를 읽어옵니다.
  useEffect(() => {
    if (!selected) {
      setConsultations([]);
      setPhotos([]);
      setChecked(new Set());
      return;
    }
    setConsultations(readJSON<Consultation[]>(`consultations:${selected.id}`, []));
    setPhotos(readJSON<Photo[]>(`photos:${selected.id}`, []));
    setStructure(loadStructure());
    setChecked(loadChecked(localStorage.getItem(`checklist:${selected.id}`)));
  }, [selected]);

  // 요약 통계 계산
  const stats = useMemo(() => {
    // 상담 실적
    const grade = (arr: Consultation[], field: "importance" | "interestLevel") => ({
      A: arr.filter((c) => c[field] === "A").length,
      B: arr.filter((c) => c[field] === "B").length,
      C: arr.filter((c) => c[field] === "C").length,
    });
    const interestTally = new Map<string, number>();
    for (const c of consultations) {
      for (const it of c.interests ?? []) interestTally.set(it, (interestTally.get(it) ?? 0) + 1);
    }
    const topInterests = [...interestTally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

    // 체크리스트 진행도 (단계별)
    const phases = structure.map((p) => {
      const ids = p.groups.flatMap((g) => g.items.map((it) => it.id));
      const done = ids.filter((id) => checked.has(id)).length;
      return { key: p.key, label: p.label, emoji: p.emoji, total: ids.length, done };
    });
    const clTotal = phases.reduce((s, p) => s + p.total, 0);
    const clDone = phases.reduce((s, p) => s + p.done, 0);

    return {
      total: consultations.length,
      importance: grade(consultations, "importance"),
      interest: grade(consultations, "interestLevel"),
      topInterests,
      keyClients: consultations.filter((c) => c.importance === "A"),
      photoCount: photos.length,
      checklist: { total: clTotal, done: clDone, phases },
    };
  }, [consultations, photos, structure, checked]);

  const clPct = stats.checklist.total ? Math.round((stats.checklist.done / stats.checklist.total) * 100) : 0;

  // ── 수정 창 ──
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

  // 전시회 미선택
  if (!selected) {
    return (
      <main className="w-full px-8 py-8">
        <h1 className="text-3xl font-bold">대시보드</h1>
        <div className="mt-8 max-w-2xl rounded-3xl border border-dashed border-black/15 bg-black/[0.02] p-12 text-center dark:border-white/15 dark:bg-white/[0.03]">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            아직 선택된 전시회가 없어요. 전시회를 <b>등록/선택</b>하면 현황이 여기에 모여요.
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
      {/* ── 전시회 헤더 ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-blue-600 dark:text-blue-400">현재 전시회</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{selected.name}</h1>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
            <span>
              📍 {selected.country}
              {selected.city ? ` · ${selected.city}` : ""}
            </span>
            <span>
              🗓 {selected.startDate || "-"} ~ {selected.endDate || "-"}
            </span>
            {selected.headcount && <span>👥 {selected.headcount}</span>}
          </div>
          {selected.memo && <div className="mt-1 text-sm text-zinc-400">📝 {selected.memo}</div>}
        </div>
        <button
          type="button"
          onClick={openEdit}
          className="shrink-0 rounded-lg border border-blue-500 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
        >
          ✏ 정보 수정
        </button>
      </div>

      {/* ── 요약 통계 타일 ── */}
      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="상담 건수" value={stats.total} unit="건" accent="blue" href="/after/organize" />
        <StatTile label="핵심 고객 (중요도 A)" value={stats.importance.A} unit="곳" accent="red" href="/after/dashboard" />
        <StatTile label="현장 사진" value={stats.photoCount} unit="장" accent="teal" href="/during/photos" />
        <StatTile label="체크리스트" value={clPct} unit="%" accent="green" href="/before/checklist" />
      </section>

      {/* ── 상세 카드 ── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 체크리스트 진행 */}
        <Card title="✅ 준비 진행도" href="/before/checklist" cta="체크리스트 열기">
          <div className="flex items-end justify-between">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">전체 진행률</span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              <b className="text-lg text-blue-600 dark:text-blue-400">{stats.checklist.done}</b> / {stats.checklist.total} · {clPct}%
            </span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${clPct}%` }} />
          </div>
          <div className="mt-4 space-y-2.5">
            {stats.checklist.phases.map((p) => {
              const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
              return (
                <div key={p.key} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-zinc-600 dark:text-zinc-300">
                    {p.emoji} {p.label}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
                    <div className="h-full rounded-full bg-blue-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-12 shrink-0 text-right text-zinc-500 dark:text-zinc-400">
                    {p.done}/{p.total}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 상담 실적 요약 */}
        <Card title="📊 상담 실적" href="/after/dashboard" cta="실적 대시보드 열기">
          {stats.total === 0 ? (
            <EmptyHint text="아직 상담일지가 없어요." linkText="상담일지 작성하러 가기" href="/during/consultation" />
          ) : (
            <>
              <div className="flex flex-wrap gap-6">
                <GradeMini title="중요도" g={stats.importance} />
                <GradeMini title="관심도" g={stats.interest} />
              </div>
              <div className="mt-4">
                <div className="mb-1.5 text-sm text-zinc-500 dark:text-zinc-400">많이 언급된 관심품목</div>
                {stats.topInterests.length === 0 ? (
                  <span className="text-sm text-zinc-400">아직 없음</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {stats.topInterests.map(([label, n]) => (
                      <span
                        key={label}
                        className="rounded-md bg-black/[0.05] px-2 py-1 text-xs text-zinc-600 dark:bg-white/[0.08] dark:text-zinc-300"
                      >
                        {label} <b className="text-zinc-500 dark:text-zinc-400">{n}</b>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── 핵심 고객 + 현장 사진 ── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 핵심 고객 */}
        <Card title="⭐ 핵심 고객 (중요도 A)" href="/after/dashboard" cta="자세히">
          {stats.keyClients.length === 0 ? (
            <p className="py-4 text-sm text-zinc-500">아직 중요도 A로 표시한 업체가 없어요.</p>
          ) : (
            <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
              {stats.keyClients.slice(0, 5).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="font-medium">{c.company || "(회사명 미입력)"}</span>
                  <span className="truncate text-zinc-500 dark:text-zinc-400">{c.name}</span>
                </li>
              ))}
              {stats.keyClients.length > 5 && (
                <li className="pt-2 text-xs text-zinc-400">외 {stats.keyClients.length - 5}곳</li>
              )}
            </ul>
          )}
        </Card>

        {/* 현장 사진 */}
        <Card title="📸 현장 사진" href="/during/photos" cta="사진 관리">
          {stats.photoCount === 0 ? (
            <EmptyHint text="아직 올린 현장 사진이 없어요." linkText="사진 올리러 가기" href="/during/photos" />
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {photos.slice(0, 5).map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p.id}
                  src={p.image}
                  alt={p.caption || "현장 사진"}
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ))}
              {stats.photoCount > 5 && (
                <div className="flex aspect-square items-center justify-center rounded-lg bg-black/[0.05] text-sm font-medium text-zinc-500 dark:bg-white/[0.08]">
                  +{stats.photoCount - 5}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* ── 빠른 이동 ── */}
      <section className="mt-6 flex flex-wrap gap-2">
        <QuickLink href="/during/consultation" label="✍ 상담일지 작성" primary />
        <QuickLink href="/after/organize" label="📇 명함·상담일지 정리" />
      </section>

      {/* ── 전시회 정보 수정 창 ── */}
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
              <EditField label="전시회 이름" value={editForm.name} onChange={(v) => setField("name", v)} placeholder="예: 2025 광저우 캔톤페어" required />
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

// ── 작은 조각들 ──

function StatTile({
  label,
  value,
  unit,
  accent,
  href,
}: {
  label: string;
  value: number;
  unit: string;
  accent: "blue" | "red" | "teal" | "green";
  href: string;
}) {
  const color = {
    blue: "text-blue-600 dark:text-blue-400",
    red: "text-red-600 dark:text-red-400",
    teal: "text-teal-600 dark:text-teal-400",
    green: "text-green-600 dark:text-green-400",
  }[accent];
  return (
    <Link
      href={href}
      className="rounded-2xl border border-black/10 bg-white p-5 transition hover:border-black/20 hover:shadow-sm dark:border-white/10 dark:bg-zinc-900 dark:hover:border-white/20"
    >
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={"mt-2 text-3xl font-bold " + color}>
        {value}
        <span className="ml-1 text-base font-medium text-zinc-400">{unit}</span>
      </p>
    </Link>
  );
}

function Card({
  title,
  href,
  cta,
  children,
}: {
  title: string;
  href: string;
  cta: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link href={href} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
          {cta} →
        </Link>
      </div>
      {children}
    </section>
  );
}

function GradeMini({ title, g }: { title: string; g: { A: number; B: number; C: number } }) {
  const dot = (c: string) => <span className={"inline-block h-2.5 w-2.5 rounded-full " + c} />;
  return (
    <div>
      <div className="mb-1.5 text-sm text-zinc-500 dark:text-zinc-400">{title}</div>
      <div className="flex items-center gap-3 text-sm">
        <span className="flex items-center gap-1.5">{dot("bg-red-500")} A {g.A}</span>
        <span className="flex items-center gap-1.5">{dot("bg-amber-500")} B {g.B}</span>
        <span className="flex items-center gap-1.5">{dot("bg-blue-500")} C {g.C}</span>
      </div>
    </div>
  );
}

function EmptyHint({ text, linkText, href }: { text: string; linkText: string; href: string }) {
  return (
    <div className="py-3 text-sm">
      <span className="text-zinc-500">{text} </span>
      <Link href={href} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
        {linkText} →
      </Link>
    </div>
  );
}

function QuickLink({ href, label, primary }: { href: string; label: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={
        "rounded-xl px-4 py-2.5 text-sm font-semibold transition " +
        (primary
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "border border-black/15 text-zinc-700 hover:bg-black/[0.05] dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/[0.06]")
      }
    >
      {label}
    </Link>
  );
}

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
