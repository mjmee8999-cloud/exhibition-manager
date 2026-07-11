"use client";

// 실적 대시보드 화면입니다.
//  - 선택한 전시회의 상담일지(consultations:<전시회id>)를 자동 집계해 한눈에 보여줍니다.
//  - 별도 라이브러리 없이 Tailwind만으로 막대그래프를 그립니다.
//  - "정리" 화면과 같은 데이터를 읽기만 하므로, 상담일지를 추가/수정하면 여기 숫자도 바뀝니다.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useExhibitions } from "@/components/ExhibitionProvider";
import { GradeBadge } from "@/components/formControls";
import { consultationDate, joinList, type Consultation } from "@/lib/consultation";

export default function DashboardPage() {
  const { selected } = useExhibitions();
  const storageKey = selected ? `consultations:${selected.id}` : null;

  const [records, setRecords] = useState<Consultation[]>([]);

  // 전체 순위 보기 창 (제목 + 전체 항목 목록)
  const [detail, setDetail] = useState<{ title: string; items: RankItem[] } | null>(null);

  useEffect(() => {
    if (!storageKey) {
      setRecords([]);
      return;
    }
    const saved = localStorage.getItem(storageKey);
    setRecords(saved ? JSON.parse(saved) : []);
  }, [storageKey]);

  // 데이터 집계 (records 가 바뀔 때만 다시 계산)
  const stats = useMemo(() => summarize(records), [records]);

  // 날짜별 상담 건수 (전시회 기간의 날짜들 + 실제 상담 날짜를 합쳐 시간순 정렬)
  const dayCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of records) {
      const d = consultationDate(r);
      if (d) map.set(d, (map.get(d) ?? 0) + 1);
    }
    const days = new Set<string>([
      ...listDays(selected?.startDate ?? "", selected?.endDate ?? ""),
      ...map.keys(),
    ]);
    return [...days].sort().map((date) => ({ date, count: map.get(date) ?? 0 }));
  }, [records, selected]);

  // ── 전시회 미선택 안내 ──
  if (!selected) {
    return (
      <main className="w-full px-8 py-8">
        <h1 className="text-3xl font-bold">실적 대시보드</h1>
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
      <h1 className="text-3xl font-bold tracking-tight">실적 대시보드</h1>

      {/* 전시회 배너 */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-blue-50 px-5 py-3.5 text-base dark:bg-blue-950/40">
        <span className="text-lg">🎪</span>
        <span className="font-semibold">{selected.name}</span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {selected.country}
          {selected.city ? ` · ${selected.city}` : ""}
        </span>
        <Link
          href="/after/organize"
          className="ml-auto rounded-lg border border-blue-300 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/50"
        >
          상담일지 정리 보기 →
        </Link>
      </div>

      {records.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-black/15 bg-black/[0.02] p-12 text-center dark:border-white/15 dark:bg-white/[0.03]">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            아직 집계할 상담일지가 없어요.
          </p>
          <Link
            href="/during/consultation"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
          >
            ✍ 상담일지 작성하러 가기
          </Link>
        </div>
      ) : (
        <>
          {/* ── 요약 카드 (KPI) — 총 건수 + 날짜별(일차별) 건수 ── */}
          <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard label="총 상담 건수" value={stats.total} unit="건" accent="blue" />
            {dayCounts.map((d, i) => (
              <KpiCard
                key={d.date}
                label={`${i + 1}일차`}
                value={d.count}
                unit="건"
                accent="green"
                sub={formatDay(d.date)}
              />
            ))}
          </section>

          {/* ── 중요도 · 관심도 · 업체유형 분포 (원형) ── */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Panel title="중요도 분포" hint="이번 전시회에서 만난 업체의 중요도 비중">
              <Donut segments={gradeSegments(stats.importanceCount, stats.total)} />
            </Panel>
            <Panel title="관심도 분포" hint="상담 상대가 우리 제품에 보인 관심 정도">
              <Donut segments={gradeSegments(stats.interestCount, stats.total)} />
            </Panel>
            <Panel title="업체유형 분포" hint="상담한 업체들의 종류별 비중">
              <Donut segments={rankSegments(stats.companyTypes)} />
            </Panel>
          </div>

          {/* ── 관심품목 · 문의내용 TOP ── */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title="인기 관심품목 TOP" hint="상담에서 많이 언급된 품목">
              <RankBars
                items={stats.interests}
                color="bg-blue-500"
                empty="아직 선택된 관심품목이 없어요."
                onExpand={() => setDetail({ title: "관심품목 전체 순위", items: stats.interests })}
              />
            </Panel>
            <Panel title="많이 나온 문의내용 TOP" hint="바이어들이 자주 물어본 항목">
              <RankBars
                items={stats.inquiries}
                color="bg-teal-500"
                empty="아직 기록된 문의내용이 없어요."
                onExpand={() => setDetail({ title: "문의내용 전체 순위", items: stats.inquiries })}
              />
            </Panel>
          </div>

          {/* ── 핵심 고객 리스트 (중요도 A) ── */}
          <Panel
            title="⭐ 핵심 고객 (중요도 A)"
            hint="전시회 후 우선 연락할 업체들"
            className="mt-6"
          >
            {stats.keyClients.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">
                아직 중요도 A로 표시한 업체가 없어요. 상담일지에서 중요도를 지정해 보세요.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-black/[0.03] text-left dark:bg-white/[0.05]">
                      <Th>회사명</Th>
                      <Th>담당자</Th>
                      <Th>관심품목</Th>
                      <Th>관심도</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.keyClients.map((r) => (
                      <tr key={r.id} className="border-t border-black/10 align-top dark:border-white/10">
                        <Td className="font-medium">{r.company || "-"}</Td>
                        <Td>{r.name || "-"}</Td>
                        <Td className="max-w-[20rem] whitespace-normal text-zinc-600 dark:text-zinc-300">
                          {joinList(r.interests, r.interestEtc) || "-"}
                        </Td>
                        <Td>
                          <GradeBadge grade={r.interestLevel} />
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}

      {/* ── 전체 순위 보기 창 (모달) ── */}
      {detail && (
        <div
          onClick={() => setDetail(null)}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="my-4 w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-950 sm:p-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{detail.title}</h2>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-full px-3 py-1 text-2xl text-zinc-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              총 {detail.items.length}개 항목 · 많이 나온 순
            </p>
            <div className="mt-5 space-y-2.5">
              {detail.items.map((it, i) => (
                <div key={it.label} className="flex items-center gap-3">
                  <span className="w-6 shrink-0 text-right text-sm font-semibold text-zinc-400">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium">{it.label}</span>
                  <span className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
                    {it.count}건
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ─────────────────────────────────────────────
//  집계 로직
// ─────────────────────────────────────────────

type RankItem = { label: string; count: number };

// 전시회 시작일~종료일 사이의 모든 날짜(YYYY-MM-DD)를 순서대로 만듭니다.
function listDays(start: string, end: string): string[] {
  if (!start) return [];
  const s = new Date(start + "T00:00:00");
  const e = new Date((end || start) + "T00:00:00");
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return [];
  const days: string[] = [];
  const pad = (n: number) => String(n).padStart(2, "0");
  // 안전장치: 최대 60일까지만
  for (let d = new Date(s), i = 0; d <= e && i < 60; d.setDate(d.getDate() + 1), i++) {
    days.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  }
  return days;
}

// 날짜(YYYY-MM-DD)를 "07.09 (목)" 형태로 보기 좋게 만듭니다.
function formatDay(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  const week = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${pad(d.getMonth() + 1)}.${pad(d.getDate())} (${week})`;
}

function summarize(records: Consultation[]) {
  const total = records.length;

  // 중요도 · 관심도 A/B/C 개수 세기
  const emptyGrade = { A: 0, B: 0, C: 0 };
  const importanceCount = { ...emptyGrade };
  const interestCount = { ...emptyGrade };
  let cardCount = 0;

  for (const r of records) {
    if (r.importance === "A" || r.importance === "B" || r.importance === "C")
      importanceCount[r.importance]++;
    if (r.interestLevel === "A" || r.interestLevel === "B" || r.interestLevel === "C")
      interestCount[r.interestLevel]++;
    if (r.cardImage) cardCount++;
  }

  // 여러 항목(품목·채널·문의)을 세어 많은 순으로 정렬
  const tally = (
    pick: (r: Consultation) => string[] | undefined,
    pickEtc?: (r: Consultation) => string | undefined,
  ): RankItem[] => {
    const map = new Map<string, number>();
    for (const r of records) {
      const items = [...(pick(r) ?? [])];
      const etc = pickEtc?.(r);
      if (etc && etc.trim()) items.push(etc.trim());
      for (const it of items) map.set(it, (map.get(it) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  };

  // 한 건에 하나만 있는 값(업체 유형)을 세어 많은 순으로 정렬
  const tallyOne = (pick: (r: Consultation) => string | undefined): RankItem[] => {
    const map = new Map<string, number>();
    for (const r of records) {
      const v = (pick(r) ?? "").trim();
      if (v) map.set(v, (map.get(v) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  };

  const cardRate = total ? Math.round((cardCount / total) * 100) : 0;

  return {
    total,
    importanceCount,
    interestCount,
    cardCount,
    cardRate,
    interests: tally((r) => r.interests, (r) => r.interestEtc),
    companyTypes: tallyOne((r) => r.companyType),
    inquiries: tally((r) => r.inquiries, (r) => r.inquiryEtc),
    keyClients: records.filter((r) => r.importance === "A"),
  };
}

// ─────────────────────────────────────────────
//  화면 조각들
// ─────────────────────────────────────────────

// 요약 카드
function KpiCard({
  label,
  value,
  unit,
  accent,
  sub,
}: {
  label: string;
  value: number;
  unit: string;
  accent: "blue" | "red" | "orange" | "green";
  sub?: string;
}) {
  const accentText = {
    blue: "text-blue-600 dark:text-blue-400",
    red: "text-red-600 dark:text-red-400",
    orange: "text-orange-600 dark:text-orange-400",
    green: "text-green-600 dark:text-green-400",
  }[accent];

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={"mt-2 text-3xl font-bold " + accentText}>
        {value}
        <span className="ml-1 text-base font-medium text-zinc-400">{unit}</span>
      </p>
      {sub && <p className="mt-1 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

// 패널(제목 + 설명 + 내용) 감싸기
function Panel({
  title,
  hint,
  children,
  className = "",
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={
        "rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900 " +
        className
      }
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

// 원형(도넛) 차트에 넣을 한 조각
type Segment = { label: string; count: number; color: string };

// 업체유형처럼 종류가 여럿일 때 쓰는 색 팔레트 (순서대로 배정)
const PIE_PALETTE = [
  "#8b5cf6", // 보라
  "#3b82f6", // 파랑
  "#14b8a6", // 청록
  "#22c55e", // 초록
  "#f59e0b", // 노랑
  "#f97316", // 주황
  "#f43f5e", // 분홍
  "#64748b", // 회색
];

// 중요도/관심도(A·B·C) → 원형 조각. A=빨강·B=주황·C=파랑, 미지정=회색.
function gradeSegments(counts: { A: number; B: number; C: number }, total: number): Segment[] {
  const segs: Segment[] = [
    { label: "A (높음)", count: counts.A, color: "#ef4444" },
    { label: "B (보통)", count: counts.B, color: "#f59e0b" },
    { label: "C (낮음)", count: counts.C, color: "#3b82f6" },
  ];
  const unset = total - (counts.A + counts.B + counts.C);
  if (unset > 0) segs.push({ label: "미지정", count: unset, color: "#d4d4d8" });
  return segs.filter((s) => s.count > 0);
}

// 순위형(업체유형) → 원형 조각. 팔레트 색을 순서대로.
function rankSegments(items: RankItem[]): Segment[] {
  return items.map((it, i) => ({
    label: it.label,
    count: it.count,
    color: PIE_PALETTE[i % PIE_PALETTE.length],
  }));
}

// 원형(도넛) 차트 + 범례
function Donut({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  if (total === 0) {
    return <p className="py-10 text-center text-sm text-zinc-500">표시할 데이터가 없어요.</p>;
  }

  const size = 168;
  const stroke = 26;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const center = size / 2;

  let acc = 0; // 지금까지 그린 길이(도넛을 이어 그리기 위함)

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {/* 바탕 원 */}
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke="currentColor"
          className="text-black/[0.06] dark:text-white/[0.08]"
        />
        {/* 각 조각 */}
        {segments.map((s) => {
          const dash = (s.count / total) * c;
          const el = (
            <circle
              key={s.label}
              cx={center}
              cy={center}
              r={r}
              fill="none"
              strokeWidth={stroke}
              stroke={s.color}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-acc}
              transform={`rotate(-90 ${center} ${center})`}
            />
          );
          acc += dash;
          return el;
        })}
        {/* 가운데 총 건수 */}
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          className="fill-zinc-800 text-2xl font-bold dark:fill-zinc-100"
        >
          {total}
        </text>
        <text x={center} y={center + 15} textAnchor="middle" className="fill-zinc-400 text-xs">
          건
        </text>
      </svg>

      {/* 범례 (색·이름·건수·비율) */}
      <ul className="w-full space-y-1.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="flex-1 truncate">{s.label}</span>
            <span className="shrink-0 text-zinc-500 dark:text-zinc-400">
              {s.count}건 · {Math.round((s.count / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 순위형(품목·채널·문의) 막대
function RankBars({
  items,
  color,
  empty,
  onExpand,
}: {
  items: RankItem[];
  color: string;
  empty: string;
  onExpand: () => void;
}) {
  if (items.length === 0) {
    return <p className="py-4 text-center text-sm text-zinc-500">{empty}</p>;
  }
  // 막대 길이는 가장 많은 항목을 기준으로 (상대 비교가 잘 보이게)
  const max = items[0].count || 1;
  return (
    <div className="space-y-2.5">
      {items.slice(0, 8).map((it) => (
        <Bar key={it.label} label={it.label} count={it.count} total={max} color={color} suffix={`${it.count}건`} />
      ))}
      {items.length > 8 && (
        <button
          type="button"
          onClick={onExpand}
          className="mt-1 w-full rounded-lg border border-black/10 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:border-white/10 dark:text-blue-400 dark:hover:bg-blue-950/30"
        >
          전체 순위 보기 (총 {items.length}개) →
        </button>
      )}
    </div>
  );
}

// 막대 하나 (라벨 + 채워진 막대 + 수치)
function Bar({
  label,
  count,
  total,
  color,
  suffix,
  muted,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  suffix?: string;
  muted?: boolean;
}) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className={muted ? "text-zinc-400" : "font-medium"}>{label}</span>
        <span className="text-zinc-500 dark:text-zinc-400">{suffix ?? `${count}건 · ${pct}%`}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
        <div
          className={"h-full rounded-full " + color}
          style={{ width: `${Math.max(count ? 4 : 0, pct)}%` }}
        />
      </div>
    </div>
  );
}

// 표 헤더/내용 칸
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-zinc-600 dark:text-zinc-300">
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={"px-3 py-2.5 " + className}>{children}</td>;
}
