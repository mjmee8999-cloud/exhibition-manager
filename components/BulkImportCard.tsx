"use client";

// 엑셀(리드 명단)을 한 번에 여러 상담일지로 추가하는 카드입니다.
//  1) 엑셀(.xlsx/.csv)을 올리면 → 헤더(열 제목)만 AI에게 보내 각 항목과 자동으로 짝지어요.
//     (영어·일본어·한국어 등 언어 상관없이 인식)
//  2) 미리보기 표에서 "이렇게 들어갈 거예요"를 보여주고, 틀리면 드롭다운으로 직접 바꿔요.
//  3) "N명 모두 저장"을 누르면 한꺼번에 저장돼요.

import { useRef, useState } from "react";
import {
  EMPTY_MAPPING,
  rowsToForms,
  type ColumnMapping,
} from "@/lib/bulkImport";
import { todayStr, type Consultation } from "@/lib/consultation";
import { saveConsultationsBulk } from "@/lib/consultationStore";

type Status = "idle" | "parsing" | "mapping" | "ready" | "saving" | "done" | "error";

export default function BulkImportCard({
  exhibitionId,
  onImported,
}: {
  exhibitionId: string;
  onImported?: () => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState("");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>(EMPTY_MAPPING);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 고를 수 있는 열 제목 목록(빈 제목·중복 제거)
  const headerOptions = Array.from(new Set(headers.filter((h) => h.trim() !== "")));

  // 엑셀 파일 1개를 읽어 헤더/데이터로 나누고 → AI 헤더 매칭까지 진행합니다.
  async function processFile(file: File) {
    setFileName(file.name);
    setStatus("parsing");
    setMsg("엑셀을 읽고 있어요...");

    let grid: string[][] = [];
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const aoa = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: "",
        blankrows: false,
      }) as unknown[][];
      grid = aoa.map((r) => (Array.isArray(r) ? r.map((c) => String(c ?? "")) : []));
    } catch {
      setStatus("error");
      setMsg("엑셀 파일을 읽을 수 없어요. .xlsx 또는 .csv 파일인지 확인해 주세요.");
      return;
    }

    if (grid.length < 2) {
      setStatus("error");
      setMsg("데이터가 없어요. 첫 줄은 제목, 둘째 줄부터 사람 정보가 있어야 해요.");
      return;
    }

    const head = grid[0];
    const dataRows = grid.slice(1).filter((r) => r.some((c) => c.trim() !== ""));
    setHeaders(head);
    setRows(dataRows);

    // AI에게 헤더 매칭 요청 (헤더 + 샘플 3줄만 전송)
    setStatus("mapping");
    setMsg("AI가 어느 열이 회사명·담당자·이메일인지 파악하고 있어요...");
    try {
      const res = await fetch("/api/map-columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headers: head, sampleRows: dataRows.slice(0, 3) }),
      });
      const json = await res.json();
      if (!res.ok) {
        // AI 키가 없거나 실패해도, 미리보기에서 직접 고를 수 있게 계속 진행합니다.
        setMapping(EMPTY_MAPPING);
        setStatus("ready");
        setMsg(json.message || "AI 자동 매칭에 실패했어요. 아래에서 열을 직접 골라 주세요.");
        return;
      }
      setMapping({ ...EMPTY_MAPPING, ...json.data });
      setStatus("ready");
      setMsg("");
    } catch {
      setMapping(EMPTY_MAPPING);
      setStatus("ready");
      setMsg("AI 서버에 연결하지 못했어요. 아래에서 열을 직접 골라 주세요.");
    }
  }

  function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  // 매칭에서 한 항목(회사명/이메일 등)의 열을 바꿉니다.
  function setField(field: keyof ColumnMapping, value: string) {
    setMapping((prev) => ({ ...prev, [field]: value }));
  }

  // 담당자명은 성/이름이 나뉜 경우를 위해 열을 2개까지 고릅니다.
  function setNameAt(index: 0 | 1, value: string) {
    setMapping((prev) => {
      const next = [...prev.name];
      if (value) next[index] = value;
      else next.splice(index, 1);
      // 빈 값 정리
      return { ...prev, name: next.filter(Boolean) };
    });
  }

  async function handleSave() {
    const forms = rowsToForms(headers, rows, mapping);
    if (forms.length === 0) {
      setMsg("저장할 사람이 없어요. 회사명 또는 담당자명 열을 골라 주세요.");
      return;
    }
    const today = todayStr();
    const consultations: Consultation[] = forms.map((f) => ({
      ...f,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      cardImage: "",
      consultDate: today,
      status: "신규",
    }));

    setStatus("saving");
    setMsg(`${consultations.length}명을 저장하고 있어요...`);
    const saved = await saveConsultationsBulk(exhibitionId, consultations);
    setStatus("done");
    setMsg(`✅ ${saved}명을 저장했어요. 「명함 및 상담일지 정리」에서 확인할 수 있어요.`);
    onImported?.();
  }

  function reset() {
    setStatus("idle");
    setMsg("");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping(EMPTY_MAPPING);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const previewForms = status === "ready" ? rowsToForms(headers, rows, mapping) : [];

  return (
    <section className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
      <h2 className="text-lg font-semibold text-blue-600">📋 엑셀로 여러 명 한꺼번에 추가</h2>
      <p className="mt-1.5 text-sm text-zinc-500">
        QR 리드 명단 같은 엑셀(.xlsx / .csv)을 올리면 AI가 열을 알아서 짝지어요. 미국·일본 전시회처럼 명함 대신 리드로 받은 경우에 편해요.
      </p>

      {/* ── 1) 파일 올리기 ── */}
      {(status === "idle" || status === "error") && (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={
              "mt-5 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed py-10 text-center transition " +
              (dragOver
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                : "border-black/15 hover:border-blue-400 hover:bg-blue-50/50 dark:border-white/15 dark:hover:bg-blue-950/20")
            }
          >
            <span className="text-5xl">📑</span>
            <span className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
              엑셀 파일 올리기
            </span>
            <span className="text-sm text-zinc-400">
              여기를 누르거나 · 파일을 끌어다 놓으세요 (.xlsx / .csv)
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleSelect}
            className="hidden"
          />
        </>
      )}

      {/* ── 진행 중 안내 ── */}
      {(status === "parsing" || status === "mapping" || status === "saving") && (
        <div className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-base text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          {msg}
        </div>
      )}

      {/* ── 2) 매칭 확인 + 미리보기 ── */}
      {status === "ready" && (
        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-lg bg-black/[0.05] px-2.5 py-1 font-medium dark:bg-white/[0.08]">
              📄 {fileName}
            </span>
            <span className="font-semibold text-blue-600">총 {previewForms.length}명 인식됨</span>
            <button onClick={reset} className="ml-auto text-sm text-zinc-500 hover:underline">
              다른 파일 올리기
            </button>
          </div>

          {msg && (
            <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              {msg}
            </div>
          )}

          {/* 열 짝(매칭) — 틀리면 여기서 바꿔요 */}
          <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-black/10 p-4 dark:border-white/10 sm:grid-cols-2">
            <MapRow label="회사명">
              <HeaderSelect value={mapping.company} options={headerOptions} onChange={(v) => setField("company", v)} />
            </MapRow>
            <MapRow label="담당자명">
              <div className="flex gap-2">
                <HeaderSelect value={mapping.name[0] ?? ""} options={headerOptions} onChange={(v) => setNameAt(0, v)} />
                <HeaderSelect value={mapping.name[1] ?? ""} options={headerOptions} onChange={(v) => setNameAt(1, v)} placeholder="(성/이름 2번째)" />
              </div>
            </MapRow>
            <MapRow label="부서 / 직책">
              <HeaderSelect value={mapping.title} options={headerOptions} onChange={(v) => setField("title", v)} />
            </MapRow>
            <MapRow label="이메일">
              <HeaderSelect value={mapping.email} options={headerOptions} onChange={(v) => setField("email", v)} />
            </MapRow>
            <MapRow label="연락처">
              <HeaderSelect value={mapping.phone} options={headerOptions} onChange={(v) => setField("phone", v)} />
            </MapRow>
            <MapRow label="홈페이지">
              <HeaderSelect value={mapping.homepage} options={headerOptions} onChange={(v) => setField("homepage", v)} />
            </MapRow>
            <MapRow label="매출액">
              <HeaderSelect value={mapping.revenue} options={headerOptions} onChange={(v) => setField("revenue", v)} />
            </MapRow>
          </div>

          {mapping.memoColumns.length > 0 && (
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              🗒️ 그 외 참고 정보는 <b>상담 메모</b>에 함께 저장돼요: {mapping.memoColumns.join(" · ")}
            </p>
          )}

          {/* 미리보기 표 (처음 5명) */}
          <div className="mt-4 overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-black/[0.03] text-xs text-zinc-500 dark:bg-white/[0.05] dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-2 font-semibold">회사명</th>
                  <th className="px-3 py-2 font-semibold">담당자명</th>
                  <th className="px-3 py-2 font-semibold">부서/직책</th>
                  <th className="px-3 py-2 font-semibold">이메일</th>
                  <th className="px-3 py-2 font-semibold">연락처</th>
                </tr>
              </thead>
              <tbody>
                {previewForms.slice(0, 5).map((f, i) => (
                  <tr key={i} className="border-t border-black/5 dark:border-white/5">
                    <td className="px-3 py-2">{f.company || "-"}</td>
                    <td className="px-3 py-2">{f.name || "-"}</td>
                    <td className="px-3 py-2">{f.title || "-"}</td>
                    <td className="px-3 py-2">{f.email || "-"}</td>
                    <td className="px-3 py-2">{f.phone || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {previewForms.length > 5 && (
            <p className="mt-2 text-xs text-zinc-400">…외 {previewForms.length - 5}명 더</p>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={reset}
              className="rounded-xl border border-black/15 px-5 py-2.5 text-base hover:bg-black/[0.05] dark:border-white/15 dark:hover:bg-white/[0.06]"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="rounded-xl bg-blue-600 px-7 py-2.5 text-base font-semibold text-white hover:bg-blue-700"
            >
              {previewForms.length}명 모두 저장
            </button>
          </div>
        </div>
      )}

      {/* ── 3) 저장 완료 ── */}
      {status === "done" && (
        <div className="mt-5">
          <div className="rounded-xl bg-green-50 px-4 py-3 text-base text-green-700 dark:bg-green-950/30 dark:text-green-300">
            {msg}
          </div>
          <button
            onClick={reset}
            className="mt-4 rounded-xl border border-black/15 px-5 py-2.5 text-base hover:bg-black/[0.05] dark:border-white/15 dark:hover:bg-white/[0.06]"
          >
            다른 파일 올리기
          </button>
        </div>
      )}
    </section>
  );
}

// 매칭 한 줄(라벨 + 드롭다운)
function MapRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-sm font-medium text-zinc-600 dark:text-zinc-300">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </label>
  );
}

// 열 제목을 고르는 드롭다운
function HeaderSelect({
  value,
  options,
  onChange,
  placeholder = "(없음)",
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-black/15 bg-white px-2.5 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
    >
      <option value="">{placeholder}</option>
      {options.map((h) => (
        <option key={h} value={h}>
          {h}
        </option>
      ))}
    </select>
  );
}
