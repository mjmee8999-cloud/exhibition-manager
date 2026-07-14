"use client";

// 후속 대응 자료 — 팔로업(감사·후속 안내) 메일 자동 생성 화면입니다.
//  - 선택한 전시회의 상담일지 중 "이메일이 있는" 고객을 팔로업 대상으로 보여줍니다.
//  - 고객마다 언어(영어/일본어/한국어)를 고르면 고정 양식으로 제목·본문이 자동으로 채워집니다.
//  - "AI 초안 작성"을 누르면 Gemini가 업체·문의 내용을 살려 더 자연스러운 초안을 만들어 줍니다.
//  - 본문/이메일을 복사해 그룹웨어(gw.speedrack.kr)에 붙여넣어 발송합니다. ("메일 앱 열기"는 보조)

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useExhibitions } from "@/components/ExhibitionProvider";
import { GradeBadge } from "@/components/formControls";
import { consultationDate, type Consultation } from "@/lib/consultation";
import {
  buildTemplate,
  LANGS,
  pickLang,
  type FollowupExhibition,
  type Lang,
} from "@/lib/followup";

// 중요도 순서(A가 위로)로 정렬하기 위한 가중치
const IMP_ORDER: Record<string, number> = { A: 0, B: 1, C: 2, "": 3 };

export default function FollowupPage() {
  const { selected } = useExhibitions();
  const storageKey = selected ? `consultations:${selected.id}` : null;

  const [records, setRecords] = useState<Consultation[]>([]);
  const [fImportance, setFImportance] = useState("");
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    if (!storageKey) {
      setRecords([]);
      return;
    }
    const saved = localStorage.getItem(storageKey);
    setRecords(saved ? JSON.parse(saved) : []);
  }, [storageKey]);

  // 이메일이 있는 상담만 팔로업 대상. 중요도 필터 적용 후 중요도·회사명 순 정렬.
  const targets = useMemo(() => {
    const withEmail = records.filter((r) => (r.email || "").trim());
    const filtered = fImportance ? withEmail.filter((r) => r.importance === fImportance) : withEmail;
    return [...filtered].sort((a, b) => {
      const d = (IMP_ORDER[a.importance] ?? 3) - (IMP_ORDER[b.importance] ?? 3);
      if (d !== 0) return d;
      return (a.company || "").localeCompare(b.company || "");
    });
  }, [records, fImportance]);

  const noEmailCount = records.filter((r) => !(r.email || "").trim()).length;

  // 전시회 미선택
  if (!selected) {
    return (
      <main className="w-full px-8 py-8">
        <div className="rounded-3xl border border-dashed border-black/15 bg-black/[0.02] p-12 text-center dark:border-white/15 dark:bg-white/[0.03]">
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

  const ex: FollowupExhibition = {
    name: selected.name,
    startDate: selected.startDate,
    endDate: selected.endDate,
    country: selected.country,
    city: selected.city,
  };

  // "받는사람 전체 복사" — 대상 이메일을 세미콜론으로 이어 붙여 복사(그룹웨어 받는사람/BCC 붙여넣기용)
  async function copyAllEmails() {
    const emails = targets.map((r) => r.email.trim()).filter(Boolean).join("; ");
    if (!emails) return;
    try {
      await navigator.clipboard.writeText(emails);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    } catch {
      /* 클립보드 접근 실패 시 조용히 무시 */
    }
  }

  return (
    <main className="w-full px-8 py-8">
      {/* 제목 */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">후속 대응 자료 · 팔로업 메일</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            상담 고객에게 보낼 감사·후속 메일을 자동으로 만들어 드려요. 복사해서 그룹웨어에 붙여넣어 보내세요.
          </p>
        </div>
      </div>

      {/* 전시회 배너 + 대상 건수 */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-blue-50 px-5 py-3.5 text-base dark:bg-blue-950/40">
        <span className="text-lg">🎪</span>
        <span className="font-semibold">{selected.name}</span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {selected.country}
          {selected.city ? ` · ${selected.city}` : ""}
        </span>
        <span className="ml-auto font-medium text-blue-700 dark:text-blue-300">
          팔로업 대상 {targets.length}명
        </span>
      </div>

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
          {/* 필터 · 전체 복사 바 */}
          <section className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-300">중요도</label>
            <select
              value={fImportance}
              onChange={(e) => setFImportance(e.target.value)}
              className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
            >
              <option value="">전체</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>

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

          {/* mailto 안내 */}
          <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
            💡 그룹웨어로 보낼 땐 <b>본문 복사</b> → 붙여넣기가 가장 안전해요. &ldquo;메일 앱 열기&rdquo;는 기본 메일
            프로그램을 여는 보조 기능이라, 본문이 길면 일부 프로그램에서 잘릴 수 있어요.
          </p>

          {targets.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-black/15 p-8 text-center text-zinc-500 dark:border-white/15 dark:text-zinc-400">
              조건에 맞는 팔로업 대상이 없어요.
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {targets.map((c) => (
                <FollowupCard key={c.id} ex={ex} c={c} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

// ─────────────────────────────────────────────────────────────
// 고객 한 명의 팔로업 메일 카드 (언어·제목·본문·AI초안 각각 독립 관리)
// ─────────────────────────────────────────────────────────────
function FollowupCard({ ex, c }: { ex: FollowupExhibition; c: Consultation }) {
  const [lang, setLang] = useState<Lang>(() => pickLang(ex.country));
  const initial = useMemo(() => buildTemplate(ex, c, pickLang(ex.country)), [ex, c]);
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);

  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "ok" | "warn" | "error">("idle");
  const [aiMsg, setAiMsg] = useState("");
  const [copied, setCopied] = useState<"" | "body" | "email">("");

  // 언어를 바꾸면 해당 언어의 고정 양식으로 다시 채웁니다.
  function changeLang(next: Lang) {
    setLang(next);
    const t = buildTemplate(ex, c, next);
    setSubject(t.subject);
    setBody(t.body);
    setAiStatus("idle");
    setAiMsg("");
  }

  // AI 맞춤 초안 생성
  async function makeAiDraft() {
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
            interests: [c.interests?.join(", "), c.interestEtc].filter(Boolean).join(", "),
            inquiries: [c.inquiries?.join(", "), c.inquiryEtc].filter(Boolean).join(", "),
            companyTypeDetail: c.companyTypeDetail,
            memo: c.memo,
          },
          lang,
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
  }

  async function copyText(text: string, which: "body" | "email") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      /* 무시 */
    }
  }

  const mailtoHref = `mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;

  return (
    <section className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
      {/* 헤더: 회사·담당자·중요도·이메일 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-base font-bold">{c.company || "(회사명 없음)"}</span>
        {c.name && <span className="text-sm text-zinc-600 dark:text-zinc-300">{c.name}{c.title ? ` · ${c.title}` : ""}</span>}
        <GradeBadge grade={c.importance} />
        <span className="text-xs text-zinc-400 dark:text-zinc-500">상담일 {consultationDate(c)}</span>
        <span className="ml-auto text-sm text-zinc-500 dark:text-zinc-400">✉ {c.email}</span>
      </div>

      {/* 언어 선택 + AI 초안 버튼 */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
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
        <button
          type="button"
          onClick={makeAiDraft}
          disabled={aiStatus === "loading"}
          className="ml-auto rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {aiStatus === "loading" ? "AI 작성 중…" : "✨ AI 초안 작성"}
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
        rows={12}
        className="mt-1 w-full resize-y rounded-xl border border-black/15 bg-white px-4 py-3 text-sm leading-relaxed dark:border-white/15 dark:bg-zinc-900"
      />

      {/* 버튼 줄 */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copyText(body, "body")}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {copied === "body" ? "✓ 복사됨" : "본문 복사"}
        </button>
        <button
          type="button"
          onClick={() => copyText(c.email, "email")}
          className="rounded-xl border border-black/15 px-4 py-2.5 text-sm font-medium hover:bg-black/[0.05] dark:border-white/15 dark:hover:bg-white/[0.06]"
        >
          {copied === "email" ? "✓ 복사됨" : "이메일 복사"}
        </button>
        <a
          href={mailtoHref}
          className="rounded-xl border border-black/15 px-4 py-2.5 text-sm font-medium hover:bg-black/[0.05] dark:border-white/15 dark:hover:bg-white/[0.06]"
        >
          메일 앱 열기
        </a>
      </div>
    </section>
  );
}
