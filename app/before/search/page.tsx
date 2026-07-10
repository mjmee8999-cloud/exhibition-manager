"use client";

// 전시회 일정 조회 화면입니다.
//  - GEP(글로벌 전시 플랫폼, 공공데이터) 해외전시회 17,000여 건을 국가·연도·산업분야·이름으로 검색합니다.
//  - "🏠 홈던트 중요도 높은 순"을 켜면, 홈던트 사업 적합도+규모로 점수를 매겨 중요한 전시회를 위로 올려줘요.
//  - 마음에 드는 전시회는 "내 전시회로 등록"으로 바로 관리 목록에 추가돼요.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useExhibitions } from "@/components/ExhibitionProvider";
import {
  GEP_COUNTRIES,
  GEP_INDUSTRIES,
  GEP_YEARS,
  HOMEDANT_INDUSTRY_WEIGHTS,
  scoreExhibition,
  type GepExhibition,
  type ScoredExhibition,
} from "@/lib/gep";

const PER_PAGE = 30;
const RANK_PER = 500; // 중요도순: 한 번에 가져오는 양
const RANK_CAP = 2000; // 중요도순: 분석 최대 건수

export default function SearchPage() {
  const { exhibitions, addExhibition } = useExhibitions();
  const router = useRouter();

  // 검색 조건
  const [country, setCountry] = useState("");
  const [year, setYear] = useState("");
  const [industry, setIndustry] = useState("");
  const [keyword, setKeyword] = useState("");
  const [rankMode, setRankMode] = useState(false); // 중요도 높은 순 여부

  // 결과 (기본순: 서버 페이지 / 중요도순: 전체를 받아 정렬해 보관)
  const [serverResults, setServerResults] = useState<GepExhibition[]>([]);
  const [serverCount, setServerCount] = useState(0);
  const [rankedAll, setRankedAll] = useState<ScoredExhibition[]>([]);
  const [rankTotal, setRankTotal] = useState(0); // 서버 전체 건수(분석 상한보다 클 수 있음)
  const [usedRank, setUsedRank] = useState(false); // 지금 화면이 중요도순인지

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // 화면에 그릴 목록 (둘 다 점수를 매겨 배지 표시)
  const pageItems: ScoredExhibition[] = usedRank
    ? rankedAll.slice((page - 1) * PER_PAGE, page * PER_PAGE)
    : serverResults.map(scoreExhibition);
  const displayCount = usedRank ? rankedAll.length : serverCount;
  const totalPages = Math.max(1, Math.ceil(displayCount / PER_PAGE));

  function buildParams() {
    const p = new URLSearchParams();
    if (country) p.set("country", country);
    if (year) p.set("year", year);
    if (industry) p.set("industry", industry);
    if (keyword.trim()) p.set("keyword", keyword.trim());
    return p;
  }

  // 기본순 검색 (서버 페이지네이션)
  async function runNormal(targetPage: number) {
    setStatus("loading");
    setErrorMsg("");
    try {
      const params = buildParams();
      params.set("page", String(targetPage));
      params.set("perPage", String(PER_PAGE));
      const res = await fetch(`/api/gep-exhibitions?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(json.message || "조회에 실패했어요.");
        return;
      }
      setServerResults(json.data ?? []);
      setServerCount(json.matchCount ?? 0);
      setUsedRank(false);
      setPage(targetPage);
      setStatus("done");
    } catch {
      setStatus("error");
      setErrorMsg("전시 정보 서버에 연결하지 못했어요.");
    }
  }

  // 중요도순 검색 (여러 페이지를 받아 점수로 정렬)
  async function runRanked() {
    if (!country && !year && !industry && !keyword.trim()) {
      alert("중요도순은 데이터가 많아, 먼저 국가·연도·산업분야 중 하나 이상을 골라주세요.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const acc: GepExhibition[] = [];
      let total = 0;
      for (let p = 1; acc.length < RANK_CAP; p++) {
        const params = buildParams();
        params.set("page", String(p));
        params.set("perPage", String(RANK_PER));
        const res = await fetch(`/api/gep-exhibitions?${params.toString()}`);
        const json = await res.json();
        if (!res.ok) {
          setStatus("error");
          setErrorMsg(json.message || "조회에 실패했어요.");
          return;
        }
        total = json.matchCount ?? 0;
        const batch: GepExhibition[] = json.data ?? [];
        acc.push(...batch);
        if (batch.length < RANK_PER || acc.length >= total) break;
      }
      const scored = acc.map(scoreExhibition).sort((a, b) => b.score - a.score);
      setRankedAll(scored);
      setRankTotal(total);
      setUsedRank(true);
      setPage(1);
      setStatus("done");
    } catch {
      setStatus("error");
      setErrorMsg("전시 정보 서버에 연결하지 못했어요.");
    }
  }

  function onSearch() {
    if (rankMode) runRanked();
    else runNormal(1);
  }

  function goPage(target: number) {
    if (usedRank) setPage(target); // 이미 받아둔 목록 안에서 페이지 이동
    else runNormal(target);
  }

  function resetFilters() {
    setCountry("");
    setYear("");
    setIndustry("");
    setKeyword("");
    setRankMode(false);
    setServerResults([]);
    setRankedAll([]);
    setServerCount(0);
    setStatus("idle");
  }

  function registerExhibition(ex: GepExhibition) {
    if (exhibitions.some((e) => e.name === ex.해외전시회명.trim())) {
      alert("이미 등록된 전시회예요.");
      return;
    }
    const memo = [ex.산업분야, ex.전시장명, ex.개최주기 ? `개최주기 ${ex.개최주기}` : ""]
      .filter(Boolean)
      .join(" · ");
    addExhibition({
      name: ex.해외전시회명.trim(),
      country: ex.개최국가명,
      city: ex.개최도시명,
      startDate: ex.개최시작예정일자,
      endDate: ex.개최종료예정일자,
      headcount: "",
      memo,
    });
    if (confirm(`"${ex.해외전시회명.trim()}" 을(를) 내 전시회로 등록했어요.\n전시회 관리로 이동할까요?`)) {
      router.push("/exhibitions");
    }
  }

  return (
    <main className="w-full px-8 py-8">
      <h1 className="text-3xl font-bold tracking-tight">전시회 일정 조회</h1>
      <p className="mt-2 text-sm text-zinc-500">
        GEP(글로벌 전시 플랫폼) 해외전시회 데이터에서 국가·연도·산업분야·이름으로 검색해요.
      </p>

      {/* 검색 조건 */}
      <section className="mt-6 rounded-2xl border border-black/10 p-6 dark:border-white/10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="국가" value={country} onChange={setCountry} placeholder="전체 국가">
            {GEP_COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select label="연도" value={year} onChange={setYear} placeholder="전체 연도">
            {GEP_YEARS.map((y) => (
              <option key={y} value={String(y)}>
                {y}년
              </option>
            ))}
          </Select>
          <Select label="산업분야" value={industry} onChange={setIndustry} placeholder="전체 분야">
            {GEP_INDUSTRIES.map((ind) => (
              <option key={ind.q} value={ind.q}>
                {ind.label}
              </option>
            ))}
          </Select>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-300">
              전시회명 검색
            </span>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              placeholder="예: 가구, 선반, 하드웨어"
              className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base dark:border-white/15 dark:bg-zinc-900"
            />
          </label>
        </div>

        {/* 중요도순 토글 */}
        <label className="mt-4 flex w-fit cursor-pointer items-center gap-2.5 rounded-xl bg-amber-50 px-4 py-2.5 dark:bg-amber-950/30">
          <input
            type="checkbox"
            checked={rankMode}
            onChange={(e) => setRankMode(e.target.checked)}
            className="h-4 w-4 accent-amber-600"
          />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
            🏠 홈던트 중요도 높은 순으로 보기
          </span>
        </label>

        <div className="mt-4 flex gap-3">
          <button
            onClick={onSearch}
            disabled={status === "loading"}
            className="rounded-xl bg-blue-600 px-8 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {status === "loading" ? (rankMode ? "분석 중..." : "검색 중...") : "🔍 검색"}
          </button>
          <button
            onClick={resetFilters}
            className="rounded-xl border border-black/15 px-6 py-3 text-base hover:bg-black/[0.05] dark:border-white/15 dark:hover:bg-white/[0.06]"
          >
            초기화
          </button>
        </div>

        {/* 중요도 산정 기준 안내 (접기/펼치기) */}
        <details className="mt-4 rounded-xl bg-black/[0.02] p-4 text-sm dark:bg-white/[0.04]">
          <summary className="cursor-pointer font-medium text-zinc-600 dark:text-zinc-300">
            ℹ️ 홈던트 중요도는 어떻게 매기나요?
          </summary>
          <div className="mt-3 space-y-2 text-zinc-500 dark:text-zinc-400">
            <p>전시회의 <b>산업 적합도 + 규모</b>를 점수로 합산해 A/B/C로 나눠요.</p>
            <ul className="ml-4 list-disc space-y-1">
              {HOMEDANT_INDUSTRY_WEIGHTS.map((w) => (
                <li key={w.q}>
                  {w.label} <b>+{w.weight}</b>
                </li>
              ))}
              <li>전시회명에 수납·선반·정리·가구·하드웨어 등 포함 시 <b>+8/개</b> (최대 +24)</li>
              <li>규모(참가업체·참관객·참가국 수)가 클수록 가점 — 단, 데이터가 비어있는 경우가 많아요</li>
            </ul>
            <p>
              합계 <b className="text-red-600">A: 45+</b> · <b className="text-amber-600">B: 20+</b> ·{" "}
              <b className="text-blue-600">C: 1+</b>
            </p>
          </div>
        </details>
      </section>

      {/* 상태 메시지 */}
      {status === "error" && (
        <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-base text-red-700 dark:bg-red-950/30 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      {status === "done" && (
        <>
          <div className="mt-6">
            <p className="text-base font-medium">
              검색 결과 <span className="text-blue-600">{displayCount.toLocaleString()}</span>건
              {usedRank && (
                <span className="ml-2 rounded-md bg-amber-100 px-2 py-0.5 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  중요도 높은 순
                </span>
              )}
              {displayCount > 0 && (
                <span className="ml-2 text-sm text-zinc-400">
                  ({page} / {totalPages} 페이지)
                </span>
              )}
            </p>
            {usedRank && rankTotal > rankedAll.length && (
              <p className="mt-1 text-sm text-zinc-400">
                * 조건에 맞는 {rankTotal.toLocaleString()}건 중 상위 {rankedAll.length.toLocaleString()}건만
                분석했어요. 국가·산업분야를 좁히면 더 정확해져요.
              </p>
            )}
          </div>

          {pageItems.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-black/15 p-12 text-center text-zinc-500 dark:border-white/15">
              조건에 맞는 전시회가 없어요. 조건을 바꿔보세요.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
              {pageItems.map((ex, i) => (
                <ExhibitionCard
                  key={`${ex.해외전시회명}-${i}`}
                  ex={ex}
                  registered={exhibitions.some((e) => e.name === ex.해외전시회명.trim())}
                  onRegister={() => registerExhibition(ex)}
                />
              ))}
            </div>
          )}

          {displayCount > PER_PAGE && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => goPage(page - 1)}
                disabled={page <= 1 || status !== "done"}
                className="rounded-xl border border-black/15 px-5 py-2.5 hover:bg-black/[0.05] disabled:opacity-40 dark:border-white/15 dark:hover:bg-white/[0.06]"
              >
                ← 이전
              </button>
              <span className="text-sm text-zinc-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => goPage(page + 1)}
                disabled={page >= totalPages || status !== "done"}
                className="rounded-xl border border-black/15 px-5 py-2.5 hover:bg-black/[0.05] disabled:opacity-40 dark:border-white/15 dark:hover:bg-white/[0.06]"
              >
                다음 →
              </button>
            </div>
          )}
        </>
      )}

      {status === "idle" && (
        <div className="mt-8 rounded-2xl border border-dashed border-black/15 p-12 text-center text-zinc-500 dark:border-white/15">
          조건을 고르고 <b>검색</b>을 눌러보세요. (예: 국가 미국 + 연도 2026)
        </div>
      )}

      <p className="mt-8 text-xs text-zinc-400">
        데이터 출처: 공공데이터포털 · KOTRA/GEP 해외전시회 개최 정보 (API 사용)
      </p>
    </main>
  );
}

// 드롭다운 (라벨 + select)
function Select({
  label,
  value,
  onChange,
  placeholder,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-300">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base dark:border-white/15 dark:bg-zinc-900"
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
    </label>
  );
}

// 중요도 배지 (A=빨강, B=주황, C=파랑)
function ScoreBadge({ grade, score }: { grade: "" | "A" | "B" | "C"; score: number }) {
  if (!grade) return null;
  const color =
    grade === "A"
      ? "bg-red-600 text-white"
      : grade === "B"
        ? "bg-amber-500 text-white"
        : "bg-blue-600 text-white";
  return (
    <span
      className={"shrink-0 rounded-lg px-2.5 py-1 text-sm font-bold " + color}
      title={`중요도 점수 ${score}점`}
    >
      {grade} · {score}
    </span>
  );
}

// 전시회 한 건 카드
function ExhibitionCard({
  ex,
  registered,
  onRegister,
}: {
  ex: ScoredExhibition;
  registered: boolean;
  onRegister: () => void;
}) {
  const period =
    ex.개최시작예정일자 === ex.개최종료예정일자
      ? ex.개최시작예정일자
      : `${ex.개최시작예정일자} ~ ${ex.개최종료예정일자}`;

  const scale: string[] = [];
  if (ex.참가업체수 > 0) scale.push(`참가업체 ${ex.참가업체수.toLocaleString()}개`);
  if (ex.참관인수 > 0) scale.push(`참관객 ${ex.참관인수.toLocaleString()}명`);
  if (ex.참가국가수 > 0) scale.push(`${ex.참가국가수}개국`);

  return (
    <div className="flex flex-col rounded-2xl border border-black/10 p-5 dark:border-white/10">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold leading-snug">{ex.해외전시회명.trim()}</h3>
        <ScoreBadge grade={ex.grade} score={ex.score} />
      </div>

      <div className="mt-3 space-y-1.5 text-sm text-zinc-600 dark:text-zinc-300">
        <p>
          📅 {period} {ex.개최주기 && <span className="text-zinc-400">· {ex.개최주기}</span>}
        </p>
        <p>
          📍 {ex.개최국가명}
          {ex.개최도시명 ? ` · ${ex.개최도시명}` : ""}
          {ex.전시장명 ? <span className="text-zinc-400"> · {ex.전시장명}</span> : ""}
        </p>
        {ex.산업분야 && <p>🏷 {ex.산업분야.replace(/&/g, " · ")}</p>}
        {scale.length > 0 && <p className="text-zinc-500">👥 {scale.join(" · ")}</p>}
      </div>

      {/* 점수 근거 */}
      {ex.reasons.length > 0 && (
        <p className="mt-2 text-xs text-zinc-400">💡 {ex.reasons.join(" · ")}</p>
      )}

      <div className="mt-4 flex-1" />
      <button
        onClick={onRegister}
        disabled={registered}
        className={
          "mt-2 self-start rounded-xl px-5 py-2.5 text-sm font-medium " +
          (registered
            ? "cursor-default bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
            : "bg-blue-600 text-white hover:bg-blue-700")
        }
      >
        {registered ? "✓ 등록됨" : "＋ 내 전시회로 등록"}
      </button>
    </div>
  );
}
