"use client";

// 상담일지 작성 화면입니다.
//  - 명함 사진을 찍거나 올리면 → Gemini AI가 고객 정보를 자동으로 채워줍니다.
//  - "AI 자동 조회"를 누르면 → 업체 유형/판매채널/홈페이지/매출액을 웹에서 찾아줍니다.
//  - 입력 항목 본문은 공통 컴포넌트(ConsultationFormFields)를 씁니다.
//    (저장된 목록은 뒤쪽 "명함 및 상담일지 정리"에서 봅니다.)

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useExhibitions } from "@/components/ExhibitionProvider";
import ConsultationFormFields from "@/components/ConsultationFormFields";
import {
  EMPTY_FORM,
  resizeImage,
  type Consultation,
  type FormState,
} from "@/lib/consultation";

export default function ConsultationPage() {
  const { selected } = useExhibitions();

  const storageKey = selected ? `consultations:${selected.id}` : null;

  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [cardImage, setCardImage] = useState<string>("");
  const [records, setRecords] = useState<Consultation[]>([]);

  const [scanStatus, setScanStatus] = useState<"idle" | "loading" | "ok" | "warn" | "error">("idle");
  const [scanMsg, setScanMsg] = useState("");

  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [lookupMsg, setLookupMsg] = useState("");

  const [savedMsg, setSavedMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!storageKey) {
      setRecords([]);
      return;
    }
    const saved = localStorage.getItem(storageKey);
    setRecords(saved ? JSON.parse(saved) : []);
  }, [storageKey]);

  function persist(next: Consultation[]) {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setRecords(next);
    } catch {
      alert("저장 공간이 부족해요. 나중에 데이터베이스(공유 저장)로 옮겨야 해요.");
    }
  }

  // 명함 사진 선택 → AI 자동 인식
  async function handleCardSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    let dataUrl = "";
    try {
      dataUrl = await resizeImage(file, 1000);
    } catch {
      setScanStatus("error");
      setScanMsg("사진을 불러올 수 없어요.");
      return;
    }
    setCardImage(dataUrl);

    setScanStatus("loading");
    setScanMsg("AI가 명함을 읽고 있어요...");
    try {
      const res = await fetch("/api/scan-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const json = await res.json();

      if (!res.ok) {
        setScanStatus(json.error === "NO_KEY" ? "warn" : "error");
        setScanMsg(json.message || "AI 인식에 실패했어요. 정보를 직접 입력해 주세요.");
        return;
      }

      const d = json.data ?? {};
      setForm((prev) => ({
        ...prev,
        company: d.company || prev.company,
        name: d.name || prev.name,
        title: d.title || prev.title,
        email: d.email || prev.email,
        phone: d.phone || prev.phone,
      }));
      setScanStatus("ok");
      setScanMsg("✅ 인식 완료 — 아래 내용을 확인해 주세요.");
    } catch {
      setScanStatus("error");
      setScanMsg("AI 서버에 연결하지 못했어요. 정보를 직접 입력해 주세요.");
    }
  }

  // 회사명으로 업체 정보 AI 자동 조회 (웹 검색)
  async function handleLookup() {
    if (!form.company.trim()) {
      setLookupStatus("error");
      setLookupMsg("회사명을 먼저 입력(또는 명함 스캔)해 주세요.");
      return;
    }
    setLookupStatus("loading");
    setLookupMsg("AI가 웹에서 업체 정보를 찾고 있어요...");
    try {
      const res = await fetch("/api/lookup-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: form.company.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setLookupStatus("error");
        setLookupMsg(json.message || "조회에 실패했어요. 직접 입력해 주세요.");
        return;
      }
      const d = json.data ?? {};
      setForm((prev) => ({
        ...prev,
        companyType: d.companyType || prev.companyType,
        companyTypeDetail: d.companyTypeDetail || prev.companyTypeDetail,
        homepage: d.homepage || prev.homepage,
        revenue: d.revenue || prev.revenue,
        salesChannels:
          Array.isArray(d.salesChannels) && d.salesChannels.length
            ? Array.from(new Set([...prev.salesChannels, ...d.salesChannels]))
            : prev.salesChannels,
      }));
      setLookupStatus("ok");
      setLookupMsg("✅ 조회 완료");
    } catch {
      setLookupStatus("error");
      setLookupMsg("AI 서버에 연결하지 못했어요. 직접 입력해 주세요.");
    }
  }

  function handleSave() {
    if (!storageKey) return;
    if (!form.company.trim() && !form.name.trim()) {
      alert("회사명 또는 담당자명을 입력해 주세요.");
      return;
    }
    const record: Consultation = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      cardImage,
      ...form,
    };
    persist([record, ...records]);
    resetForm();
    setSavedMsg("✅ 저장했어요. 뒤쪽 「명함 및 상담일지 정리」에서 확인할 수 있어요.");
    setTimeout(() => setSavedMsg(""), 4000);
  }

  function resetForm() {
    setForm({ ...EMPTY_FORM });
    setCardImage("");
    setScanStatus("idle");
    setScanMsg("");
    setLookupStatus("idle");
    setLookupMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // 전시회 미선택 안내
  if (!selected) {
    return (
      <main className="w-full px-8 py-8">
        <h1 className="text-3xl font-bold">상담일지 작성</h1>
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
      <h1 className="text-3xl font-bold tracking-tight">상담일지 작성</h1>

      {/* 전시회 배너 */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-blue-50 px-5 py-3.5 text-base dark:bg-blue-950/40">
        <span className="text-lg">🎪</span>
        <span className="font-semibold">{selected.name}</span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {selected.country}
          {selected.city ? ` · ${selected.city}` : ""}
        </span>
      </div>

      {/* 명함 스캔 (맨 위, 넓게) */}
      <section className="mt-6 rounded-2xl border border-black/10 p-6 dark:border-white/10">
        <h2 className="text-lg font-semibold text-blue-600">📇 명함 스캔</h2>
        <p className="mt-1.5 text-sm text-zinc-500">
          명함을 찍거나 올리면 AI가 아래 고객 정보를 자동으로 채워줘요.
        </p>

        <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-start">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-black/15 py-10 text-center transition hover:border-blue-400 hover:bg-blue-50/50 dark:border-white/15 dark:hover:bg-blue-950/20"
          >
            <span className="text-5xl">📸</span>
            <span className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
              명함 사진 촬영 / 업로드
            </span>
            <span className="text-sm text-zinc-400">여기를 누르세요</span>
          </button>
          {cardImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cardImage}
              alt="명함 미리보기"
              className="max-h-56 w-full rounded-2xl object-contain md:w-1/2"
            />
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCardSelect}
          className="hidden"
        />

        {scanMsg && (
          <div
            className={
              "mt-5 rounded-xl px-4 py-3 text-base " +
              (scanStatus === "ok"
                ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300"
                : scanStatus === "loading"
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                  : scanStatus === "warn"
                    ? "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                    : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300")
            }
          >
            {scanMsg}
          </div>
        )}
      </section>

      {/* 입력 항목 본문 (공통 컴포넌트) */}
      <div className="mt-6">
        <ConsultationFormFields
          form={form}
          setForm={setForm}
          onLookup={handleLookup}
          lookupStatus={lookupStatus}
          lookupMsg={lookupMsg}
        />
      </div>

      {/* 저장 / 초기화 */}
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-end">
        {savedMsg && (
          <span className="mr-auto text-sm font-medium text-green-600 dark:text-green-400">
            {savedMsg}
          </span>
        )}
        <button
          onClick={resetForm}
          className="rounded-xl border border-black/15 px-6 py-3 text-base hover:bg-black/[0.05] dark:border-white/15 dark:hover:bg-white/[0.06]"
        >
          초기화
        </button>
        <button
          onClick={handleSave}
          className="rounded-xl bg-blue-600 px-8 py-3 text-base font-semibold text-white hover:bg-blue-700"
        >
          상담일지 저장
        </button>
      </div>
    </main>
  );
}
