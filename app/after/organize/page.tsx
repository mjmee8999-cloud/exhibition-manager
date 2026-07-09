"use client";

// 명함 및 상담일지 정리 화면입니다.
//  - 저장한 상담일지를 (선택 전시회 기준) 표로 한눈에 봅니다.
//  - 행을 누르면 상세 창이 열려 명함을 크게 보고, 내용을 수정할 수 있어요.
//  - 오른쪽 위 "엑셀 추출" 버튼으로 .xlsx 파일을 내려받습니다.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useExhibitions } from "@/components/ExhibitionProvider";
import ConsultationFormFields from "@/components/ConsultationFormFields";
import { GradeBadge } from "@/components/formControls";
import {
  EMPTY_FORM,
  formatDate,
  joinList,
  resizeImage,
  toFormState,
  type Consultation,
  type FormState,
} from "@/lib/consultation";

export default function OrganizePage() {
  const { selected } = useExhibitions();
  const storageKey = selected ? `consultations:${selected.id}` : null;

  const [records, setRecords] = useState<Consultation[]>([]);

  // 상세/수정 창 상태
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>({ ...EMPTY_FORM });
  const [editCardImage, setEditCardImage] = useState<string>("");
  const [editLookupStatus, setEditLookupStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [editLookupMsg, setEditLookupMsg] = useState("");
  const replaceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!storageKey) {
      setRecords([]);
      return;
    }
    const saved = localStorage.getItem(storageKey);
    setRecords(saved ? JSON.parse(saved) : []);
  }, [storageKey]);

  function saveRecords(next: Consultation[]) {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(next));
    setRecords(next);
  }

  function handleDelete(id: string) {
    if (!confirm("이 상담일지를 삭제할까요? 되돌릴 수 없어요.")) return;
    saveRecords(records.filter((r) => r.id !== id));
    if (editId === id) closeEdit();
  }

  // 상세/수정 창 열기
  function openEdit(record: Consultation) {
    setEditId(record.id);
    setEditForm(toFormState(record));
    setEditCardImage(record.cardImage);
    setEditLookupStatus("idle");
    setEditLookupMsg("");
  }

  function closeEdit() {
    setEditId(null);
  }

  // 수정 내용 저장
  function handleUpdate() {
    if (!editId) return;
    const original = records.find((r) => r.id === editId);
    if (!original) return;
    const updated: Consultation = {
      id: original.id,
      createdAt: original.createdAt,
      cardImage: editCardImage,
      ...editForm,
    };
    saveRecords(records.map((r) => (r.id === editId ? updated : r)));
    closeEdit();
  }

  // 수정 창에서 명함 교체
  async function handleReplaceCard(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file, 1000);
      setEditCardImage(dataUrl);
    } catch {
      alert("사진을 불러올 수 없어요.");
    }
    if (replaceInputRef.current) replaceInputRef.current.value = "";
  }

  // 수정 창에서 업체 정보 AI 자동 조회
  async function handleEditLookup() {
    if (!editForm.company.trim()) {
      setEditLookupStatus("error");
      setEditLookupMsg("회사명을 먼저 입력해 주세요.");
      return;
    }
    setEditLookupStatus("loading");
    setEditLookupMsg("AI가 웹에서 업체 정보를 찾고 있어요...");
    try {
      const res = await fetch("/api/lookup-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: editForm.company.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEditLookupStatus("error");
        setEditLookupMsg(json.message || "조회에 실패했어요. 직접 입력해 주세요.");
        return;
      }
      const d = json.data ?? {};
      setEditForm((prev) => ({
        ...prev,
        companyType: d.companyType || prev.companyType,
        homepage: d.homepage || prev.homepage,
        revenue: d.revenue || prev.revenue,
        salesChannels:
          Array.isArray(d.salesChannels) && d.salesChannels.length
            ? Array.from(new Set([...prev.salesChannels, ...d.salesChannels]))
            : prev.salesChannels,
      }));
      setEditLookupStatus("ok");
      setEditLookupMsg("✅ 조회 완료");
    } catch {
      setEditLookupStatus("error");
      setEditLookupMsg("AI 서버에 연결하지 못했어요. 직접 입력해 주세요.");
    }
  }

  // 엑셀(.xlsx) 내려받기
  async function handleExport() {
    if (!records.length || !selected) return;
    const XLSX = await import("xlsx");

    const rows = records.map((r, i) => ({
      번호: i + 1,
      회사명: r.company,
      담당자: r.name,
      "부서/직책": r.title,
      이메일: r.email,
      연락처: r.phone,
      업체유형: r.companyType,
      판매채널: joinList(r.salesChannels, r.salesChannelEtc),
      홈페이지: r.homepage,
      매출액: r.revenue,
      관심품목: joinList(r.interests, r.interestEtc),
      문의내용: joinList(r.inquiries, r.inquiryEtc),
      중요도: r.importance,
      관심도: r.interestLevel,
      상담메모: r.memo,
      명함: r.cardImage ? "있음" : "없음",
      저장일시: formatDate(r.createdAt),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "상담일지");

    const today = formatDate(new Date().toISOString()).slice(0, 10);
    XLSX.writeFile(wb, `${selected.name}_상담일지_${today}.xlsx`);
  }

  // 전시회 미선택 안내
  if (!selected) {
    return (
      <main className="w-full px-8 py-8">
        <h1 className="text-3xl font-bold">명함 및 상담일지 정리</h1>
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
      {/* 제목 + 엑셀 추출 버튼 (오른쪽 위) */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">명함 및 상담일지 정리</h1>
        <button
          type="button"
          onClick={handleExport}
          disabled={records.length === 0}
          className="rounded-xl bg-green-600 px-5 py-2.5 text-base font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ⬇ 엑셀 추출 (.xlsx)
        </button>
      </div>

      {/* 전시회 배너 + 건수 */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-blue-50 px-5 py-3.5 text-base dark:bg-blue-950/40">
        <span className="text-lg">🎪</span>
        <span className="font-semibold">{selected.name}</span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {selected.country}
          {selected.city ? ` · ${selected.city}` : ""}
        </span>
        <span className="ml-auto font-medium text-blue-700 dark:text-blue-300">
          총 {records.length}건
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
          <p className="mt-4 text-sm text-zinc-500">💡 행을 누르면 상세 보기 · 수정 창이 열려요.</p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-black/[0.03] text-left dark:bg-white/[0.05]">
                  <Th>#</Th>
                  <Th>명함</Th>
                  <Th>회사명</Th>
                  <Th>담당자</Th>
                  <Th>부서/직책</Th>
                  <Th>이메일</Th>
                  <Th>연락처</Th>
                  <Th>업체유형</Th>
                  <Th>판매채널</Th>
                  <Th>관심품목</Th>
                  <Th>문의내용</Th>
                  <Th>중요도</Th>
                  <Th>관심도</Th>
                  <Th>저장일시</Th>
                  <Th>삭제</Th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr
                    key={r.id}
                    onClick={() => openEdit(r)}
                    className="cursor-pointer border-t border-black/10 align-top hover:bg-blue-50/40 dark:border-white/10 dark:hover:bg-blue-950/20"
                  >
                    <Td>{i + 1}</Td>
                    <Td>
                      {r.cardImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.cardImage} alt="명함" className="h-12 w-20 rounded-md object-cover" />
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </Td>
                    <Td className="font-medium">{r.company || "-"}</Td>
                    <Td>{r.name || "-"}</Td>
                    <Td>{r.title || "-"}</Td>
                    <Td>{r.email || "-"}</Td>
                    <Td>{r.phone || "-"}</Td>
                    <Td className="max-w-[14rem] whitespace-normal">{r.companyType || "-"}</Td>
                    <Td className="max-w-[10rem] whitespace-normal">
                      {joinList(r.salesChannels, r.salesChannelEtc) || "-"}
                    </Td>
                    <Td className="max-w-[16rem] whitespace-normal">
                      {joinList(r.interests, r.interestEtc) || "-"}
                    </Td>
                    <Td className="max-w-[16rem] whitespace-normal">
                      {joinList(r.inquiries, r.inquiryEtc) || "-"}
                    </Td>
                    <Td>
                      <GradeBadge grade={r.importance} />
                    </Td>
                    <Td>
                      <GradeBadge grade={r.interestLevel} />
                    </Td>
                    <Td className="whitespace-nowrap text-zinc-500">{formatDate(r.createdAt)}</Td>
                    <Td>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(r.id);
                        }}
                        className="rounded-lg border border-red-300 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
                      >
                        삭제
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── 상세 / 수정 창 ─────────────────────── */}
      {editId && (
        <div
          onClick={closeEdit}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="my-4 w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-950 sm:p-8"
          >
            {/* 창 헤더 */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">상담일지 상세 · 수정</h2>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-full px-3 py-1 text-2xl text-zinc-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {/* 명함 크게 보기 */}
            <section className="mt-5 rounded-2xl border border-black/10 p-6 dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-blue-600">📇 명함</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => replaceInputRef.current?.click()}
                    className="rounded-lg border border-black/15 px-3 py-1.5 text-sm hover:bg-black/[0.05] dark:border-white/15 dark:hover:bg-white/[0.06]"
                  >
                    명함 교체
                  </button>
                  {editCardImage && (
                    <button
                      type="button"
                      onClick={() => setEditCardImage("")}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
                    >
                      명함 제거
                    </button>
                  )}
                </div>
              </div>
              <input
                ref={replaceInputRef}
                type="file"
                accept="image/*"
                onChange={handleReplaceCard}
                className="hidden"
              />
              <div className="mt-4 flex justify-center">
                {editCardImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={editCardImage}
                    alt="명함 크게 보기"
                    className="max-h-[55vh] w-auto max-w-full rounded-xl object-contain"
                  />
                ) : (
                  <div className="w-full rounded-xl border border-dashed border-black/15 py-16 text-center text-zinc-400 dark:border-white/15">
                    등록된 명함이 없어요. "명함 교체"로 추가할 수 있어요.
                  </div>
                )}
              </div>
            </section>

            {/* 입력 항목 본문 (작성 화면과 동일) */}
            <div className="mt-6">
              <ConsultationFormFields
                form={editForm}
                setForm={setEditForm}
                onLookup={handleEditLookup}
                lookupStatus={editLookupStatus}
                lookupMsg={editLookupMsg}
              />
            </div>

            {/* 창 하단 버튼 */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => handleDelete(editId)}
                className="rounded-xl border border-red-300 px-5 py-3 text-base text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
              >
                🗑 이 일지 삭제
              </button>
              <div className="flex gap-3 sm:ml-auto">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-xl border border-black/15 px-6 py-3 text-base hover:bg-black/[0.05] dark:border-white/15 dark:hover:bg-white/[0.06]"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  className="rounded-xl bg-blue-600 px-8 py-3 text-base font-semibold text-white hover:bg-blue-700"
                >
                  수정 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// 표 헤더 칸
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-3 py-3 font-semibold text-zinc-600 dark:text-zinc-300">
      {children}
    </th>
  );
}

// 표 내용 칸
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={"px-3 py-3 " + className}>{children}</td>;
}
