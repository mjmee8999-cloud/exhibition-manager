"use client";

// 팔로우업 메일 — 감사·후속 안내 메일 자동 생성 화면입니다.
//  - 선택한 전시회의 상담일지 중 "이메일이 있는" 고객을 팔로업 대상으로 보여줍니다.
//  - 상단에서 "내 서명"을 한 번 입력해두면 모든 메일 맺음말에 자동으로 들어가요.
//  - 고객마다 언어(영어/일본어/한국어)와 목적(감사/견적/샘플/미팅)을 고르면 양식이 바뀌고,
//    "AI 초안"을 누르면 Gemini가 상담 내용을 살려 더 자연스러운 초안을 만들어 줍니다.
//  - "전체 AI 초안 생성"으로 대상 전원 초안을 한 번에 만들 수 있어요.
//  - 본문을 복사해 그룹웨어에 붙여넣어 발송합니다. ("메일 앱 열기"는 보조)

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useExhibitions } from "@/components/ExhibitionProvider";
import { GradeBadge } from "@/components/formControls";
import { consultationDate, type Consultation } from "@/lib/consultation";
import { listConsultations } from "@/lib/consultationStore";
import {
  buildTemplate,
  DEFAULT_OPTIONS,
  EMPTY_SIGNATURE,
  formatSignature,
  LANGS,
  pickLang,
  type FollowupExhibition,
  type FollowupOptions,
  type Lang,
  type Purpose,
  type Signature,
} from "@/lib/followup";

// 중요도 순서(A가 위로)로 정렬하기 위한 가중치
const IMP_ORDER: Record<string, number> = { A: 0, B: 1, C: 2, "": 3 };

// 내 서명·양식 옵션은 전시회와 무관한 "내 정보"라 앱 전체 공용으로 저장해요.
const SIG_KEY = "followup_signature";
const OPT_KEY = "followup_options";

export default function FollowupPage() {
  const { selected } = useExhibitions();

  const [records, setRecords] = useState<Consultation[]>([]);
  const [sortBy, setSortBy] = useState<"recent" | "old" | "importance">("recent");
  const [copiedAll, setCopiedAll] = useState(false);

  // 내 서명
  const [signature, setSignature] = useState<Signature>(EMPTY_SIGNATURE);
  const [showSig, setShowSig] = useState(false);

  // 전시회 원어명 (예: LIFESTYLE Week TOKYO) — 메일에 이 이름을 그대로 씁니다. 전시회별 저장.
  const [exOfficial, setExOfficial] = useState("");

  // 양식 옵션 (첨부 안내 · 회사 소개 · 참조)
  const [options, setOptions] = useState<FollowupOptions>(DEFAULT_OPTIONS);
  const [copiedCc, setCopiedCc] = useState(false);

  // 전체 생성 진행 상태
  const [batch, setBatch] = useState({ running: false, done: 0, total: 0 });

  // 카드별 "AI 초안 생성" 함수를 모아두는 곳 (전체 생성용)
  const genRef = useRef(new Map<string, () => Promise<void>>());
  const register = useCallback((id: string, fn: () => Promise<void>) => {
    genRef.current.set(id, fn);
  }, []);
  const unregister = useCallback((id: string) => {
    genRef.current.delete(id);
  }, []);

  useEffect(() => {
    const exId = selected?.id;
    if (!exId) {
      setRecords([]);
      return;
    }
    let alive = true;
    listConsultations(exId).then((list) => {
      if (alive) setRecords(list);
    });
    return () => {
      alive = false;
    };
  }, [selected?.id]);

  // 서명 불러오기 (앱 공용) — 이름이 비어 있으면 설정칸을 펼쳐 안내
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIG_KEY);
      if (raw) {
        const s = { ...EMPTY_SIGNATURE, ...JSON.parse(raw) } as Signature;
        setSignature(s);
        if (!s.name.trim()) setShowSig(true);
      } else {
        setShowSig(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const updateSig = (patch: Partial<Signature>) => {
    setSignature((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(SIG_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // 양식 옵션 불러오기 (앱 공용)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(OPT_KEY);
      if (raw) setOptions({ ...DEFAULT_OPTIONS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  const updateOptions = (patch: Partial<FollowupOptions>) => {
    setOptions((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(OPT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  async function copyCc() {
    if (!options.cc.trim()) return;
    try {
      await navigator.clipboard.writeText(options.cc.trim());
      setCopiedCc(true);
      setTimeout(() => setCopiedCc(false), 1500);
    } catch {
      /* 무시 */
    }
  }

  // 전시회 원어명 불러오기/저장 (전시회별)
  useEffect(() => {
    if (!selected) {
      setExOfficial("");
      return;
    }
    try {
      setExOfficial(localStorage.getItem(`followup_exname:${selected.id}`) || "");
    } catch {
      setExOfficial("");
    }
  }, [selected]);

  const updateExOfficial = (v: string) => {
    setExOfficial(v);
    if (selected) {
      try {
        localStorage.setItem(`followup_exname:${selected.id}`, v);
      } catch {
        /* ignore */
      }
    }
  };

  // 전시회 정보 (메일용) — 안정적인 참조를 위해 memo
  const ex = useMemo<FollowupExhibition>(
    () => ({
      // 원어명을 입력했으면 그걸 그대로 메일에 사용 (번역 안 됨 방지)
      name: exOfficial.trim() || selected?.name || "",
      startDate: selected?.startDate ?? "",
      endDate: selected?.endDate ?? "",
      country: selected?.country ?? "",
      city: selected?.city ?? "",
    }),
    [selected, exOfficial],
  );

  // 이메일이 있는 상담만 팔로업 대상. 선택한 기준으로 정렬.
  const targets = useMemo(() => {
    const withEmail = records.filter((r) => (r.email || "").trim());
    const byDate = (a: Consultation, b: Consultation) =>
      consultationDate(a).localeCompare(consultationDate(b)); // 오래된 → 최신
    return [...withEmail].sort((a, b) => {
      if (sortBy === "recent") return -byDate(a, b); // 최신 순
      if (sortBy === "old") return byDate(a, b); // 오래된 순
      // 중요도 순 (A→B→C), 같으면 최신 순
      const d = (IMP_ORDER[a.importance] ?? 3) - (IMP_ORDER[b.importance] ?? 3);
      if (d !== 0) return d;
      return -byDate(a, b);
    });
  }, [records, sortBy]);

  const noEmailCount = records.filter((r) => !(r.email || "").trim()).length;

  // "받는사람 전체 복사"
  async function copyAllEmails() {
    const emails = targets.map((r) => r.email.trim()).filter(Boolean).join("; ");
    if (!emails) return;
    try {
      await navigator.clipboard.writeText(emails);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    } catch {
      /* 무시 */
    }
  }

  // 전체 AI 초안 생성 — 대상 카드의 생성 함수를 하나씩 순서대로 실행
  async function generateAll() {
    if (batch.running) return;
    const list = targets;
    if (list.length === 0) return;
    setBatch({ running: true, done: 0, total: list.length });
    for (const c of list) {
      const fn = genRef.current.get(c.id);
      if (fn) {
        try {
          await fn();
        } catch {
          /* 개별 실패는 건너뜀 */
        }
      }
      setBatch((b) => ({ ...b, done: b.done + 1 }));
      // Gemini 무료 한도(분당 호출 수)를 배려해 살짝 간격을 둠
      await new Promise((r) => setTimeout(r, 600));
    }
    setBatch((b) => ({ ...b, running: false }));
  }

  // 전시회 미선택
  if (!selected) {
    return (
      <main className="w-full px-8 py-8">
        <h1 className="text-3xl font-bold tracking-tight">팔로우업 메일</h1>
        <div className="mt-8 rounded-3xl border border-dashed border-black/15 bg-black/[0.02] p-12 text-center dark:border-white/15 dark:bg-white/[0.03]">
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

  const sigPreview = formatSignature(signature, "ko");

  return (
    <main className="w-full px-8 py-8">
      {/* 제목 */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">팔로우업 메일</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            상담 고객에게 보낼 감사·후속 메일을 자동으로 만들어 드려요. 복사해서 그룹웨어에 붙여넣어 보내세요.
          </p>
        </div>
      </div>

      {/* 전시회 배너 + 대상 건수 */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-blue-50 px-5 py-3.5 text-base dark:bg-blue-950/40">
        <span className="font-semibold">{selected.name}</span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {selected.country}
          {selected.city ? ` · ${selected.city}` : ""}
        </span>
        <span className="ml-auto font-medium text-blue-700 dark:text-blue-300">
          팔로업 대상 {targets.length}명
        </span>
      </div>

      {/* ── 내 서명 설정 ── */}
      <section className="mt-4 rounded-2xl border border-black/10 dark:border-white/10">
        <button
          type="button"
          onClick={() => setShowSig((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3.5 text-left"
        >
          <span className="text-sm font-semibold">
            ⚙ 양식 설정
            {!signature.name.trim() && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                서명 비어있어요
              </span>
            )}
          </span>
          <span className="text-sm text-zinc-400">
            {signature.name.trim() ? `${signature.name} 님 · ` : ""}
            {showSig ? "접기 ▲" : "펼치기 ▼"}
          </span>
        </button>

        {showSig && (
          <div className="space-y-5 border-t border-black/10 px-5 py-4 dark:border-white/10">
            {/* 전시회 원어명 */}
            <div>
              <div className="mb-1 text-sm font-semibold">전시회 원어명 (이 전시회)</div>
              <p className="mb-2 text-xs text-zinc-500">
                메일에 들어갈 전시회 이름을 현지 표기 그대로 적어주세요. (비워두면 등록된 이름 「{selected.name}」을 사용해요.)
              </p>
              <input
                type="text"
                value={exOfficial}
                onChange={(e) => updateExOfficial(e.target.value)}
                placeholder="예: LIFESTYLE Week TOKYO 2026【夏】"
                className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
              />
            </div>

            {/* 내 서명 */}
            <div>
              <div className="mb-1 text-sm font-semibold">내 서명</div>
              <p className="mb-3 text-xs text-zinc-500">
                <b>이름·이메일·전화</b>만 입력하면 돼요. 직책(해외영업부)과 홈페이지(www.homedant.com)는 자동으로 들어가요.
                한 번만 입력해두면 <b>모든 메일 맺음말</b>에 자동 적용돼요. (이 브라우저에 저장)
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SigField label="이름" value={signature.name} onChange={(v) => updateSig({ name: v })} placeholder="예: 명재민 / Jaemin Myung" />
                <SigField label="이메일" value={signature.email} onChange={(v) => updateSig({ email: v })} placeholder="예: mjmee7757@homedant.com" />
                <SigField label="전화" value={signature.phone} onChange={(v) => updateSig({ phone: v })} placeholder="예: +82-10-1234-5678" />
              </div>

              {/* 미리보기 */}
              <div className="mt-4">
                <div className="mb-1 text-xs font-semibold text-zinc-500">서명 미리보기 (메일 맨 아래에 이렇게 들어가요)</div>
                <pre className="whitespace-pre-wrap rounded-xl bg-black/[0.03] p-3 text-xs leading-relaxed text-zinc-700 dark:bg-white/[0.05] dark:text-zinc-200">
                  {sigPreview}
                </pre>
              </div>
            </div>

            {/* 추가 양식 옵션 */}
            <div className="space-y-4 border-t border-black/10 pt-4 dark:border-white/10">
              {/* 첨부 안내 켜기/끄기 */}
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={options.attach}
                  onChange={(e) => updateOptions({ attach: e.target.checked })}
                  className="mt-0.5 h-4 w-4"
                />
                <span className="text-sm">
                  <b>자료 첨부 안내문 넣기</b>
                  <span className="ml-1 text-xs text-zinc-500">
                    (&ldquo;안내 자료를 첨부합니다&rdquo; 문장 자동 삽입 — 첨부 안 할 땐 꺼두세요)
                  </span>
                </span>
              </label>

              {/* 회사 한 줄 소개 */}
              <div>
                <div className="mb-1 text-sm font-semibold">회사 한 줄 소개 (선택)</div>
                <p className="mb-2 text-xs text-zinc-500">
                  메일에 넣을 회사 소개 한 문장. AI 작성 시엔 언어에 맞게 자동 번역돼요.
                </p>
                <input
                  type="text"
                  value={options.companyIntro}
                  onChange={(e) => updateOptions({ companyIntro: e.target.value })}
                  placeholder="예: 홈던트는 조립식 무볼트 선반 전문 브랜드입니다."
                  className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
                />
              </div>

              {/* 참조(CC) 이메일 */}
              <div>
                <div className="mb-1 text-sm font-semibold">참조(CC) 이메일 (선택)</div>
                <p className="mb-2 text-xs text-zinc-500">
                  항상 참조로 넣을 주소. 그룹웨어 &ldquo;참조&rdquo;란에 붙여넣으세요.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={options.cc}
                    onChange={(e) => updateOptions({ cc: e.target.value })}
                    placeholder="예: overseas@homedant.com"
                    className="flex-1 rounded-xl border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={copyCc}
                    disabled={!options.cc.trim()}
                    className="shrink-0 rounded-xl border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/[0.05] disabled:opacity-40 dark:border-white/15 dark:hover:bg-white/[0.06]"
                  >
                    {copiedCc ? "✓ 복사됨" : "참조 복사"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {records.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-black/15 bg-black/[0.02] p-12 text-center dark:border-white/15 dark:bg-white/[0.03]">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">아직 저장된 상담일지가 없어요.</p>
          <Link
            href="/during/consultation"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
          >
            ✍ 상담일지 작성하러 가기
          </Link>
        </div>
      ) : (
        <>
          {/* 필터 · 전체 생성 · 전체 복사 바 */}
          <section className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-300">정렬</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "recent" | "old" | "importance")}
              className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
            >
              <option value="recent">최신 순</option>
              <option value="old">오래된 순</option>
              <option value="importance">중요도 순</option>
            </select>

            <button
              type="button"
              onClick={generateAll}
              disabled={batch.running || targets.length === 0}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {batch.running ? `AI 작성 중… ${batch.done}/${batch.total}` : `✨ 전체 AI 작성 (${targets.length}명)`}
            </button>

            <button
              type="button"
              onClick={copyAllEmails}
              disabled={targets.length === 0}
              className="ml-auto rounded-xl border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-blue-300 dark:hover:bg-blue-950/40"
            >
              {copiedAll ? "✓ 복사됨" : "받는사람 전체 복사"}
            </button>

            {noEmailCount > 0 && (
              <span className="w-full text-xs text-zinc-400 dark:text-zinc-500">
                * 이메일이 없는 상담 {noEmailCount}건은 대상에서 제외했어요.
              </span>
            )}
          </section>

          <p className="mt-3 rounded-xl bg-violet-50 px-4 py-2.5 text-xs text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
            ✨ <b>AI 작성</b>은 상담일지의 고객 정보를 반영해, 선택한 언어로 정중한 팔로우업 메일 초안을 자동으로 만들어 줘요.
            만들어진 내용은 언제든 자유롭게 수정할 수 있어요.
          </p>

          {targets.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-black/15 p-8 text-center text-zinc-500 dark:border-white/15 dark:text-zinc-400">
              조건에 맞는 팔로업 대상이 없어요.
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {targets.map((c) => (
                <FollowupCard
                  key={c.id}
                  ex={ex}
                  c={c}
                  signature={signature}
                  options={options}
                  register={register}
                  unregister={unregister}
                />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

// 서명 입력 한 칸
function SigField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-zinc-500 dark:text-zinc-400">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
      />
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// 고객 한 명의 팔로업 메일 카드
// ─────────────────────────────────────────────────────────────
function FollowupCard({
  ex,
  c,
  signature,
  options,
  register,
  unregister,
}: {
  ex: FollowupExhibition;
  c: Consultation;
  signature: Signature;
  options: FollowupOptions;
  register: (id: string, fn: () => Promise<void>) => void;
  unregister: (id: string) => void;
}) {
  const [lang, setLang] = useState<Lang>(() => pickLang(ex.country));
  const purpose: Purpose = "thanks"; // 목적 선택은 제거 → 감사 인사 기본
  const initial = useMemo(
    () =>
      buildTemplate(ex, c, pickLang(ex.country), {
        purpose,
        signature,
        attach: options.attach,
        companyIntro: options.companyIntro,
      }),
    // 최초 1회만 사용 (이후는 아래 핸들러/effect가 관리)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);

  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "ok" | "warn" | "error">("idle");
  const [aiMsg, setAiMsg] = useState("");
  const [copied, setCopied] = useState<"" | "body">("");

  // 현재 언어·서명·옵션으로 고정 양식을 다시 채움
  const rebuild = useCallback(
    (l: Lang) => {
      const t = buildTemplate(ex, c, l, {
        purpose,
        signature,
        attach: options.attach,
        companyIntro: options.companyIntro,
      });
      setSubject(t.subject);
      setBody(t.body);
    },
    [ex, c, signature, options.attach, options.companyIntro],
  );

  function changeLang(next: Lang) {
    setLang(next);
    setAiStatus("idle");
    setAiMsg("");
    rebuild(next);
  }

  // 서명·옵션이 바뀌면(설정 저장) 양식을 다시 채움 — 단, AI 초안을 보고 있으면 보존
  const firstSig = useRef(true);
  useEffect(() => {
    if (firstSig.current) {
      firstSig.current = false;
      return; // 최초 렌더는 useState 초기값으로 이미 채워짐
    }
    if (aiStatus === "ok") return;
    rebuild(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, options.attach, options.companyIntro]);

  // AI 맞춤 초안 생성
  const makeAiDraft = useCallback(async () => {
    setAiStatus("loading");
    setAiMsg("");
    try {
      const res = await fetch("/api/draft-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exhibition: ex,
          customer: {
            company: c.company,
            name: c.name,
            title: c.title,
            companyTypeDetail: c.companyTypeDetail,
            importance: c.importance,
          },
          lang,
          purpose,
          signature: formatSignature(signature, lang),
          attach: options.attach,
          companyIntro: options.companyIntro,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAiStatus(json.error === "NO_KEY" ? "warn" : "error");
        setAiMsg(json.message || "AI 초안 생성에 실패했어요. 아래 양식을 그대로 쓰세요.");
        return;
      }
      const d = json.data ?? {};
      if (d.subject) setSubject(d.subject);
      if (d.body) setBody(d.body);
      setAiStatus("ok");
      setAiMsg("AI 초안을 불러왔어요. 필요하면 수정 후 복사하세요.");
    } catch {
      setAiStatus("error");
      setAiMsg("AI 서버에 연결하지 못했어요. 아래 양식을 그대로 쓰세요.");
    }
  }, [ex, c, lang, purpose, signature, options.attach, options.companyIntro]);

  // 전체 생성에서 이 카드를 호출할 수 있도록 등록 (항상 최신 makeAiDraft 실행)
  const genRef = useRef(makeAiDraft);
  genRef.current = makeAiDraft;
  useEffect(() => {
    const fn = () => genRef.current();
    register(c.id, fn);
    return () => unregister(c.id);
  }, [c.id, register, unregister]);

  async function copyBody() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied("body");
      setTimeout(() => setCopied(""), 1500);
    } catch {
      /* 무시 */
    }
  }

  return (
    <section className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
      {/* 헤더: 회사·담당자·중요도·이메일 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-base font-bold">{c.company || "(회사명 없음)"}</span>
        {c.name && (
          <span className="text-sm text-zinc-600 dark:text-zinc-300">
            {c.name}
            {c.title ? ` · ${c.title}` : ""}
          </span>
        )}
        <GradeBadge grade={c.importance} />
        <span className="text-xs text-zinc-400 dark:text-zinc-500">상담일 {consultationDate(c)}</span>
        <span className="ml-auto text-sm text-zinc-500 dark:text-zinc-400">✉ {c.email}</span>
      </div>

      {/* 언어 + AI 작성 버튼 */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">언어</span>
          <div className="flex gap-1">
            {LANGS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => changeLang(l.value)}
                className={
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
                  (lang === l.value
                    ? "bg-blue-600 text-white"
                    : "border border-black/15 hover:bg-black/[0.05] dark:border-white/15 dark:hover:bg-white/[0.06]")
                }
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={makeAiDraft}
          disabled={aiStatus === "loading"}
          className="ml-auto rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {aiStatus === "loading" ? "AI 작성 중…" : "✨ AI 작성"}
        </button>
      </div>

      {aiMsg && (
        <p
          className={
            "mt-2 text-xs " +
            (aiStatus === "ok"
              ? "text-green-600 dark:text-green-400"
              : aiStatus === "warn"
                ? "text-amber-600 dark:text-amber-400"
                : "text-red-600 dark:text-red-400")
          }
        >
          {aiMsg}
        </p>
      )}

      {/* 제목 */}
      <label className="mt-4 block text-xs font-semibold text-zinc-500 dark:text-zinc-400">제목</label>
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="mt-1 w-full rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm dark:border-white/15 dark:bg-zinc-900"
      />

      {/* 본문 */}
      <label className="mt-3 block text-xs font-semibold text-zinc-500 dark:text-zinc-400">본문</label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={14}
        className="mt-1 w-full resize-y rounded-xl border border-black/15 bg-white px-4 py-3 text-sm leading-relaxed dark:border-white/15 dark:bg-zinc-900"
      />

      {/* 버튼 줄 */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyBody}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {copied === "body" ? "✓ 복사됨" : "본문 복사"}
        </button>
      </div>
    </section>
  );
}
