"use client";

// 명함 및 상담일지 정리 화면입니다.
//  - 저장한 상담일지를 (선택 전시회 기준) 표로 한눈에 봅니다.
//  - 행을 누르면 상세 창이 열려 명함을 크게 보고, 내용을 수정할 수 있어요.
//  - 오른쪽 위 "엑셀 추출" 버튼으로 .xlsx 파일을 내려받습니다.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useExhibitions } from "@/components/ExhibitionProvider";
import ConsultationDetailModal from "@/components/ConsultationDetailModal";
import { GradeBadge, LeadBadge } from "@/components/formControls";
import {
  consultationDate,
  formatDate,
  joinList,
  leadStatusOf,
  LEAD_STATUSES,
  PRODUCTS,
  type Consultation,
} from "@/lib/consultation";
import {
  listConsultations,
  saveConsultation,
  deleteConsultation,
  migrateConsultationCards,
} from "@/lib/consultationStore";

export default function OrganizePage() {
  const { selected } = useExhibitions();

  const [records, setRecords] = useState<Consultation[]>([]);
  const [migrating, setMigrating] = useState(false); // 예전 명함을 창고로 옮기는 중

  // 상세/수정 창 상태 (열려 있는 상담일지)
  const [editRecord, setEditRecord] = useState<Consultation | null>(null);

  // 검색 · 필터 · 정렬 상태
  const [query, setQuery] = useState("");
  const [fImportance, setFImportance] = useState("");
  const [fInterest, setFInterest] = useState("");
  const [fProduct, setFProduct] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "old" | "importance" | "company">("recent");

  useEffect(() => {
    const exId = selected?.id;
    if (!exId) {
      setRecords([]);
      return;
    }
    let alive = true;
    (async () => {
      let list = await listConsultations(exId);
      if (!alive) return;
      setRecords(list);
      // 예전 자료(명함이 DB 안에 base64로 든 것)를 자동으로 창고(Storage)로 옮깁니다.
      if (list.some((r) => (r.cardImage ?? "").startsWith("data:"))) {
        setMigrating(true);
        const changed = await migrateConsultationCards(exId, list);
        if (changed) {
          list = await listConsultations(exId);
          if (alive) setRecords(list);
        }
        if (alive) setMigrating(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [selected?.id]);

  function handleDelete(id: string) {
    if (!confirm("이 상담일지를 삭제할까요? 되돌릴 수 없어요.")) return;
    const target = records.find((r) => r.id === id);
    setRecords((prev) => prev.filter((r) => r.id !== id)); // 화면에 바로 반영
    deleteConsultation(id, target?.cardPath); // 뒤에서 DB + 창고 파일 삭제
    if (editRecord?.id === id) setEditRecord(null);
  }

  // 상세/수정 창에서 "수정 저장"을 누르면 실행 (공통 모달이 완성된 상담일지를 넘겨줌)
  function handleSaveEdit(updated: Consultation) {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r))); // 화면에 바로 반영
    if (selected) {
      saveConsultation(selected.id, updated).then((saved) => {
        // 명함 주소(공개 URL) 등 최종 저장본으로 목록을 맞춰줍니다.
        setRecords((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      });
    }
  }

  // 검색 · 필터 · 정렬 적용
  const gradeRank = (g: string) => (g === "A" ? 3 : g === "B" ? 2 : g === "C" ? 1 : 0);
  const filtered = records
    .filter((r) => {
      if (fImportance && r.importance !== fImportance) return false;
      if (fInterest && r.interestLevel !== fInterest) return false;
      if (fProduct && !(r.interests ?? []).includes(fProduct)) return false;
      if (fStatus && leadStatusOf(r) !== fStatus) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hay = [
          r.company,
          r.name,
          r.title,
          r.email,
          r.phone,
          r.companyType,
          r.companyTypeDetail,
          r.memo,
          joinList(r.salesChannels, r.salesChannelEtc),
          joinList(r.interests, r.interestEtc),
          joinList(r.inquiries, r.inquiryEtc),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "old") return a.createdAt.localeCompare(b.createdAt);
      if (sortBy === "company") return (a.company || "").localeCompare(b.company || "", "ko");
      if (sortBy === "importance") {
        const d = gradeRank(b.importance) - gradeRank(a.importance);
        return d !== 0 ? d : b.createdAt.localeCompare(a.createdAt);
      }
      return b.createdAt.localeCompare(a.createdAt); // 최신순(기본)
    });

  const selectCls =
    "rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm dark:border-white/15 dark:bg-zinc-900";

  function resetFilters() {
    setQuery("");
    setFImportance("");
    setFInterest("");
    setFProduct("");
    setFStatus("");
    setSortBy("recent");
  }

  // 엑셀(.xlsx) 내려받기 (지금 화면의 필터된 목록을 내보냄)
  async function handleExport() {
    if (!filtered.length || !selected) return;
    const XLSX = await import("xlsx");

    const rows = filtered.map((r, i) => ({
      번호: i + 1,
      상담일자: consultationDate(r),
      회사명: r.company,
      담당자: r.name,
      "부서/직책": r.title,
      이메일: r.email,
      연락처: r.phone,
      업체유형: r.companyType,
      "업체유형 상세": r.companyTypeDetail,
      판매채널: joinList(r.salesChannels, r.salesChannelEtc),
      홈페이지: r.homepage,
      매출액: r.revenue,
      관심품목: joinList(r.interests, r.interestEtc),
      문의내용: joinList(r.inquiries, r.inquiryEtc),
      중요도: r.importance,
      관심도: r.interestLevel,
      상담메모: r.memo,
      후속상태: leadStatusOf(r),
      "다음 할 일": r.nextAction ?? "",
      "다음 할 일 예정일": r.nextActionDate ?? "",
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
          disabled={filtered.length === 0}
          className="rounded-xl bg-green-600 px-5 py-2.5 text-base font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ⬇ 엑셀 추출 (.xlsx)
        </button>
      </div>

      {/* 전시회 배너 + 건수 */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-blue-50 px-5 py-3.5 text-base dark:bg-blue-950/40">
        <span className="font-semibold">{selected.name}</span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {selected.country}
          {selected.city ? ` · ${selected.city}` : ""}
        </span>
        <span className="ml-auto font-medium text-blue-700 dark:text-blue-300">
          {filtered.length === records.length
            ? `총 ${records.length}건`
            : `${filtered.length} / ${records.length}건`}
        </span>
      </div>

      {migrating && (
        <div className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          ⏳ 예전 명함 사진을 사진 창고로 옮기는 중이에요… (한 번만 진행돼요)
        </div>
      )}

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
          {/* 검색 · 필터 바 */}
          <section className="mt-4 space-y-3 rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 회사명 · 담당자 · 이메일 · 연락처 · 메모 등으로 검색"
              className="w-full rounded-xl border border-black/15 bg-white px-4 py-2.5 text-base dark:border-white/15 dark:bg-zinc-900"
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={selectCls}>
                <option value="">후속상태 전체</option>
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select value={fImportance} onChange={(e) => setFImportance(e.target.value)} className={selectCls}>
                <option value="">중요도 전체</option>
                <option value="A">중요도 A</option>
                <option value="B">중요도 B</option>
                <option value="C">중요도 C</option>
              </select>
              <select value={fInterest} onChange={(e) => setFInterest(e.target.value)} className={selectCls}>
                <option value="">관심도 전체</option>
                <option value="A">관심도 A</option>
                <option value="B">관심도 B</option>
                <option value="C">관심도 C</option>
              </select>
              <select value={fProduct} onChange={(e) => setFProduct(e.target.value)} className={selectCls}>
                <option value="">관심품목 전체</option>
                {PRODUCTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className={selectCls}
              >
                <option value="recent">최신순</option>
                <option value="old">오래된순</option>
                <option value="importance">중요도순</option>
                <option value="company">회사명순</option>
              </select>
            </div>
            {(query || fImportance || fInterest || fProduct || fStatus || sortBy !== "recent") && (
              <button type="button" onClick={resetFilters} className="text-sm text-blue-600 hover:underline">
                필터 초기화
              </button>
            )}
          </section>

          <p className="mt-4 text-sm text-zinc-500">💡 행을 누르면 상세 보기 · 수정 창이 열려요.</p>

          {filtered.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-black/15 p-12 text-center text-zinc-500 dark:border-white/15">
              검색 · 필터 조건에 맞는 상담일지가 없어요.
            </div>
          ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-black/[0.03] text-left dark:bg-white/[0.05]">
                  <Th>#</Th>
                  <Th>후속상태</Th>
                  <Th>상담일자</Th>
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
                {filtered.map((r, i) => (
                  <tr
                    key={r.id}
                    onClick={() => setEditRecord(r)}
                    className="cursor-pointer border-t border-black/10 align-top hover:bg-blue-50/40 dark:border-white/10 dark:hover:bg-blue-950/20"
                  >
                    <Td>{i + 1}</Td>
                    <Td>
                      <LeadBadge status={leadStatusOf(r)} />
                    </Td>
                    <Td className="whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                      {consultationDate(r) || "-"}
                    </Td>
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
                    <Td className="max-w-[14rem] whitespace-normal">
                      {r.companyType || "-"}
                      {r.companyTypeDetail ? (
                        <span className="block text-xs text-zinc-400">{r.companyTypeDetail}</span>
                      ) : null}
                    </Td>
                    <Td className="min-w-[9rem] max-w-[12rem]">
                      <TagList items={r.salesChannels} etc={r.salesChannelEtc} />
                    </Td>
                    <Td className="min-w-[11rem] max-w-[16rem]">
                      <TagList items={r.interests} etc={r.interestEtc} />
                    </Td>
                    <Td className="min-w-[11rem] max-w-[18rem]">
                      <TagList items={r.inquiries} etc={r.inquiryEtc} />
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
          )}
        </>
      )}

      {/* ── 상세 / 수정 창 (공통 컴포넌트) ─────────────── */}
      {editRecord && (
        <ConsultationDetailModal
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
        />
      )}
    </main>
  );
}

// 여러 항목을 작은 태그(칩)로 보기 좋게 나열합니다. (표에서 쉼표 나열 대신 사용)
function TagList({ items, etc }: { items?: string[]; etc?: string }) {
  const list = [...(items ?? [])];
  if (etc && etc.trim()) list.push(`기타: ${etc.trim()}`);
  if (list.length === 0) return <span className="text-zinc-400">-</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {list.map((t) => (
        <span
          key={t}
          className="rounded-md bg-black/[0.05] px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-white/[0.08] dark:text-zinc-300"
        >
          {t}
        </span>
      ))}
    </div>
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
