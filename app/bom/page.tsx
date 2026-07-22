"use client";

// BOM 조회 — ERP(smarthub.v_bom)의 완제품별 실제 부품(BOM)을 검색해서 봅니다.
//  - 완제품 목록은 서버(/api/bom-search)에서 한 번 받아오고, 검색은 브라우저에서 여러 단어(AND)로 합니다.
//  - 제품을 고르면 그 제품의 BOM(부품·품번·규격·필요수량)을 서버에서 정확히 가져옵니다.
//  - 엑셀 추출 가능. 로그인은 서버에서만 하므로 링크만 공유하면 누구나 쓸 수 있어요.

import { useEffect, useMemo, useState } from "react";

type Parent = { no: string; name: string; spec: string };
type Part = { itemNo: string; name: string; spec: string; qty: number };

export default function BomPage() {
  const [products, setProducts] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Parent | null>(null);
  const [bom, setBom] = useState<Part[] | null>(null);
  const [bomLoading, setBomLoading] = useState(false);

  // 완제품 목록 로드
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setLoadErr("");
      try {
        const res = await fetch("/api/bom-search");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "불러오기 실패");
        if (alive) setProducts(data.products || []);
      } catch (e) {
        if (alive) setLoadErr(e instanceof Error ? e.message : "불러오기 실패");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 여러 단어 검색(AND): 이름·규격·품번 어디든 모든 단어가 들어간 것만
  const list = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return products;
    return products.filter((p) => {
      const hay = `${p.name} ${p.spec} ${p.no}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }, [products, query]);

  const selectProduct = async (p: Parent) => {
    setSelected(p);
    setBom(null);
    setBomLoading(true);
    try {
      const res = await fetch(`/api/bom-search?no=${encodeURIComponent(p.no)}`);
      const data = await res.json();
      setBom(data.bom || []);
    } catch {
      setBom([]);
    } finally {
      setBomLoading(false);
    }
  };

  const exportExcel = async () => {
    if (!selected || !bom) return;
    const XLSX = await import("xlsx");
    const rows = bom.map((p, i) => ({
      번호: i + 1,
      부품: p.name,
      규격: p.spec,
      품번: p.itemNo,
      필요수량: p.qty,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "BOM");
    const safe = (selected.name || "제품").replace(/[\\/:*?"<>|]/g, "_");
    XLSX.writeFile(wb, `BOM_${safe}_${selected.spec}.xlsx`);
  };

  // 부품을 대분류(이름 첫 토큰)로 묶어 보기 좋게
  const grouped = useMemo(() => {
    if (!bom) return [];
    const sorted = [...bom].sort(
      (a, b) =>
        (a.name.split("/")[0] || "").localeCompare(b.name.split("/")[0] || "") ||
        a.name.localeCompare(b.name),
    );
    return sorted;
  }, [bom]);

  return (
    <main className="w-full px-8 py-8">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">BOM 조회</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          ERP의 완제품별 실제 부품(BOM)을 검색합니다. 제품을 고르면 정확한 품번·규격·필요수량이 나와요.
        </p>
      </div>

      {/* 검색 */}
      <div className="mb-4 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 여러 단어로 검색 (띄어쓰면 모두 포함 · 예: 일본 타공 / 하단오픈 800 화이트 / H하우스 트롤리)"
          className="w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm dark:border-white/15 dark:bg-zinc-950"
        />
        <div className="mt-1.5 text-xs text-zinc-400">
          💡 띄어쓴 단어가 <b>모두</b> 들어간 제품만 나와요. 이름·규격·품번 어디든 매칭됩니다.
          {loading ? " · 목록 불러오는 중..." : ` · 완제품 ${products.length.toLocaleString()}종`}
        </div>
      </div>

      {loadErr && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          불러오기 실패: {loadErr}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[420px_1fr]">
        {/* 완제품 목록 */}
        <div className="rounded-2xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-zinc-900">
          <div className="mb-2 px-1 text-sm font-semibold">
            완제품 {query ? `${list.length.toLocaleString()}종` : "목록"}
          </div>
          <div className="max-h-[620px] space-y-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-zinc-400">불러오는 중...</div>
            ) : list.length === 0 ? (
              <div className="p-4 text-center text-sm text-zinc-400">검색 결과가 없어요.</div>
            ) : (
              list.slice(0, 300).map((p) => (
                <button
                  key={p.no}
                  onClick={() => selectProduct(p)}
                  className={
                    "block w-full rounded-lg px-3 py-2 text-left transition-colors " +
                    (selected?.no === p.no
                      ? "bg-blue-50 ring-1 ring-blue-400 dark:bg-blue-950/40"
                      : "bg-black/[0.02] hover:bg-black/[0.05] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]")
                  }
                >
                  <div className="break-all text-[13px] font-medium">{p.name}</div>
                  <div className="mt-0.5 text-[11px] text-zinc-500">
                    <span className="rounded bg-black/[0.05] px-1.5 py-0.5 dark:bg-white/10">{p.spec}</span>
                    <span className="ml-1.5 font-mono">{p.no}</span>
                  </div>
                </button>
              ))
            )}
            {!loading && list.length > 300 && (
              <div className="p-2 text-center text-xs text-zinc-400">
                …상위 300개만 표시. 검색어로 좁혀보세요.
              </div>
            )}
          </div>
        </div>

        {/* BOM 상세 */}
        <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
          {!selected ? (
            <div className="flex h-40 items-center justify-center text-sm text-zinc-400">
              ← 왼쪽에서 완제품을 선택하세요
            </div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-base font-semibold">📦 {selected.name}</div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    규격 <b>{selected.spec}</b> · 품번 <span className="font-mono">{selected.no}</span>
                    {bom ? ` · 부품 ${bom.length}종` : ""}
                  </div>
                </div>
                <button
                  onClick={exportExcel}
                  disabled={!bom || bom.length === 0}
                  className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  ⬇ 엑셀 추출
                </button>
              </div>

              <div className="max-h-[560px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-zinc-50 text-xs text-zinc-500 dark:bg-zinc-800">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">부품명</th>
                      <th className="px-3 py-2 text-left font-medium">규격</th>
                      <th className="px-3 py-2 text-left font-medium">품번</th>
                      <th className="px-3 py-2 text-right font-medium">필요수량</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bomLoading ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-zinc-400">
                          BOM 불러오는 중...
                        </td>
                      </tr>
                    ) : grouped.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-zinc-400">
                          부품이 없어요.
                        </td>
                      </tr>
                    ) : (
                      grouped.map((p, i) => (
                        <tr key={`${p.itemNo}-${i}`} className="border-b border-black/5 last:border-0 dark:border-white/5">
                          <td className="px-3 py-2">{p.name}</td>
                          <td className="px-3 py-2 text-zinc-500">{p.spec || "-"}</td>
                          <td className="px-3 py-2 font-mono text-xs text-zinc-500">{p.itemNo}</td>
                          <td className="px-3 py-2 text-right font-semibold tabular-nums">
                            {Number.isInteger(p.qty) ? p.qty : Number(p.qty.toFixed(2))}개
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
