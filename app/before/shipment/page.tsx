"use client";

// 전시 품목 리스트 페이지
//  - 부스 시뮬레이터의 「전시 품목 리스트 반영」으로 넘어온 배치를 여기서 봅니다.
//  - 저장은 localStorage 키 `booth_shipments` 에 하나만 유지돼요(시뮬레이터와 같은 도메인이라 공유).
//  - 3개 섹션이 유기적으로 연결돼요:
//      ① 전체 품목(선반/파츠 + 수량)
//      ② 품목별 BOM(품목 1개당 부품 — 품목마다)
//      ③ 자재별 BOM(①×② 를 부품별로 전부 합산)  →  ERP 기타출고요청에 입력
//  - 세 섹션 모두 엑셀로 추출할 수 있어요.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useExhibitions } from "@/components/ExhibitionProvider";

// ---- 타입 ----
type RawItem = {
  productId?: string;
  name: string;
  brand: string;
  width: number;
  depth: number;
  height: number;
  tier: number;
  frameColor?: string;
  boardColor?: string;
};

type PartRow = { id: string; part: string; qty: number }; // 품목 1개당 수량

type LineItem = {
  id: string;
  kind: "shelf" | "part"; // 선반 / 추가 파츠
  name: string;
  brand: string;
  width: number;
  depth: number;
  height: number;
  tier: number;
  frameColor: string;
  qty: number;
  bom: PartRow[]; // 이 품목 1개당 부품 목록
};

type Shipment = {
  id: string;
  name: string;
  savedAt: string;
  booth?: { width?: number; depth?: number } | null;
  items?: RawItem[]; // 부스에서 넘어온 원본 (초기화용)
  lineItems?: LineItem[];
};

// 전시품목은 선택한 전시회별로 따로 저장돼요: `booth_shipments:<전시회id>`
const KEY_BASE = "booth_shipments";
const LEGACY_KEY = "booth_shipments"; // 예전(전시회 구분 없던) 저장분

const SHELF_NAMES = [
  "일반 선반",
  "바퀴 선반",
  "타공 선반",
  "하단오픈 선반",
  "행거 선반",
  "연결형 선반",
  "MAX 200/300",
];
const BRANDS = ["스피드랙", "홈던트하우스"];
const FRAME_COLORS = ["black", "white"];

const colorKo = (c?: string) =>
  c === "white" ? "화이트" : c === "black" ? "블랙" : c || "-";

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

// 선반 이름·단수로 "1개당 부품(BOM)" 초안을 만든다. (편집 가능)
function unitBom(name: string, tier: number): PartRow[] {
  const t = tier || 1;
  if (name.includes("연결형")) {
    return [
      { id: uid(), part: "선반 판", qty: 1 },
      { id: uid(), part: "연결 브래킷", qty: 2 },
    ];
  }
  const rows: PartRow[] = [
    { id: uid(), part: "프레임 기둥", qty: 4 },
    { id: uid(), part: "선반 판", qty: t },
    { id: uid(), part: "연결 빔", qty: t * 4 },
  ];
  if (name.includes("바퀴")) rows.push({ id: uid(), part: "바퀴(캐스터)", qty: 4 });
  else rows.push({ id: uid(), part: "받침 발", qty: 4 });
  if (name.includes("타공")) rows.push({ id: uid(), part: "타공판", qty: 1 });
  if (name.includes("행거")) rows.push({ id: uid(), part: "행거 봉", qty: 1 });
  return rows;
}

// 부스에서 넘어온 원본을 같은 사양끼리 묶어 편집용 품목으로 변환
function buildLineItems(raw?: RawItem[]): LineItem[] {
  const map = new Map<string, LineItem>();
  for (const it of raw || []) {
    const brand = it.brand === "HOMEDANT HOUSE" ? "홈던트하우스" : "스피드랙";
    const key = `${it.name}|${brand}|${it.width}x${it.depth}x${it.height}|${it.tier}|${it.frameColor}`;
    const cur = map.get(key);
    if (cur) cur.qty += 1;
    else
      map.set(key, {
        id: uid(),
        kind: "shelf",
        name: it.name,
        brand,
        width: it.width,
        depth: it.depth,
        height: it.height,
        tier: it.tier,
        frameColor: it.frameColor || "",
        qty: 1,
        bom: unitBom(it.name, it.tier),
      });
  }
  return [...map.values()];
}

// 저장돼 있던 lineItems 에 빠진 필드가 있으면 채워 준다(구버전 호환)
function normalizeItems(list: LineItem[]): LineItem[] {
  return list.map((it) => ({
    ...it,
    kind: it.kind || "shelf",
    bom:
      it.bom && it.bom.length
        ? it.bom.map((p) => ({ ...p, id: p.id || uid() }))
        : unitBom(it.name, it.tier),
  }));
}

// ③ 자재별 BOM: 모든 품목의 (1개당 수량 × 품목 수량) 을 부품별로 합산
function aggregate(items: LineItem[]) {
  const map = new Map<string, number>();
  for (const it of items) {
    for (const p of it.bom || []) {
      if (!p.part.trim()) continue;
      map.set(
        p.part,
        (map.get(p.part) || 0) + (Number(p.qty) || 0) * (Number(it.qty) || 0)
      );
    }
  }
  return [...map.entries()].map(([part, total]) => ({ part, total }));
}

export default function ShipmentPage() {
  const { selected } = useExhibitions();
  const storageKey = selected ? `${KEY_BASE}:${selected.id}` : null;

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [editItems, setEditItems] = useState(false);
  const [editBom, setEditBom] = useState(false);

  useEffect(() => {
    if (!storageKey) {
      setShipment(null);
      setItems([]);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    try {
      let raw = window.localStorage.getItem(storageKey);
      // 예전(전시회 구분 없던) 저장분이 있으면 이 전시회로 한 번만 옮겨옴
      if (!raw) {
        const legacy = window.localStorage.getItem(LEGACY_KEY);
        if (legacy) {
          window.localStorage.setItem(storageKey, legacy);
          window.localStorage.removeItem(LEGACY_KEY);
          raw = legacy;
        }
      }
      const list: Shipment[] = raw ? JSON.parse(raw) : [];
      const sh = Array.isArray(list) && list.length ? list[0] : null;
      if (sh) {
        setShipment(sh);
        setItems(
          sh.lineItems ? normalizeItems(sh.lineItems) : buildLineItems(sh.items)
        );
      } else {
        setShipment(null);
        setItems([]);
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, [storageKey]);

  const persist = (nextItems: LineItem[]) => {
    if (!shipment || !storageKey) return;
    const next: Shipment = { ...shipment, lineItems: nextItems };
    setShipment(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([next]));
    } catch {
      /* ignore */
    }
  };
  const updateItems = (next: LineItem[]) => {
    setItems(next);
    persist(next);
  };

  // ── ① 전체 품목 편집 ──
  const patchItem = (id: string, patch: Partial<LineItem>) =>
    updateItems(
      items.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        // 선반 종류/단수가 바뀌면 부품(BOM) 초안을 다시 생성 → 세 섹션 자동 연동
        if ("name" in patch || "tier" in patch) {
          next.bom = unitBom(next.name, next.tier);
        }
        return next;
      })
    );
  const addItem = () =>
    updateItems([
      ...items,
      {
        id: uid(),
        kind: "shelf",
        name: SHELF_NAMES[0],
        brand: BRANDS[0],
        width: 900,
        depth: 400,
        height: 1800,
        tier: 4,
        frameColor: "white",
        qty: 1,
        bom: unitBom(SHELF_NAMES[0], 4),
      },
    ]);
  const removeItem = (id: string) => updateItems(items.filter((r) => r.id !== id));

  // ── ② 품목별 BOM(부품) 편집 ──
  const patchPart = (itemId: string, partId: string, patch: Partial<PartRow>) =>
    updateItems(
      items.map((it) =>
        it.id !== itemId
          ? it
          : { ...it, bom: it.bom.map((p) => (p.id === partId ? { ...p, ...patch } : p)) }
      )
    );
  const addPart = (itemId: string) =>
    updateItems(
      items.map((it) =>
        it.id !== itemId
          ? it
          : { ...it, bom: [...it.bom, { id: uid(), part: "", qty: 1 }] }
      )
    );
  const removePart = (itemId: string, partId: string) =>
    updateItems(
      items.map((it) =>
        it.id !== itemId ? it : { ...it, bom: it.bom.filter((p) => p.id !== partId) }
      )
    );

  const clearShipment = () => {
    if (!storageKey) return;
    if (!confirm("전시 품목 리스트를 비울까요? 되돌릴 수 없어요.")) return;
    window.localStorage.setItem(storageKey, JSON.stringify([]));
    setShipment(null);
    setItems([]);
  };

  // 엑셀 추출: 3개 섹션을 각각 시트로
  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    // ① 전체 품목
    const s1 = items.map((r, i) => ({
      번호: i + 1,
      구분: r.kind === "part" ? "추가 파츠" : "선반",
      품목: r.name,
      브랜드: r.brand,
      "규격(W×D×H)": `${r.width}×${r.depth}×${r.height}`,
      단: r.tier,
      프레임색상: colorKo(r.frameColor),
      수량: r.qty,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s1), "전체 품목");

    // ② 품목별 BOM
    const s2: Record<string, string | number>[] = [];
    items.forEach((r) => {
      (r.bom || []).forEach((p) => {
        s2.push({
          품목: r.kind === "part" ? "추가 파츠" : r.name,
          규격: `${r.width}×${r.depth}×${r.height}`,
          부품: p.part,
          "1개당 수량": p.qty,
          품목수량: r.qty,
          합계: (Number(p.qty) || 0) * (Number(r.qty) || 0),
        });
      });
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s2), "품목별 BOM");

    // ③ 자재별 BOM
    const s3 = aggregate(items).map((r) => ({ 부품: r.part, "총 수량": r.total }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s3), "자재별 BOM");

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `${shipment?.name || "전시품목"}_리스트_${today}.xlsx`);
  };

  const shelfItems = items.filter((r) => r.kind !== "part");
  const partItems = items.filter((r) => r.kind === "part");
  const agg = aggregate(items);
  const totalQty = items.reduce((s, r) => s + (Number(r.qty) || 0), 0);

  const inputCls =
    "w-full rounded border border-black/15 bg-white px-2 py-1 text-sm dark:border-white/15 dark:bg-zinc-900";
  const numCls = inputCls + " text-right tabular-nums";

  const editBtn = (on: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className={
        "rounded-lg px-3 py-1.5 text-sm font-medium " +
        (on
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "border border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30")
      }
    >
      {on ? "완료" : "✏ 수정 및 추가"}
    </button>
  );

  // 전시회 미선택 안내
  if (!selected) {
    return (
      <main className="w-full px-8 py-8">
        <h1 className="text-3xl font-bold tracking-tight">전시 품목 리스트</h1>
        <div className="mt-8 max-w-2xl rounded-3xl border border-dashed border-black/15 bg-black/[0.02] p-12 text-center dark:border-white/15 dark:bg-white/[0.03]">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            먼저 왼쪽에서 <b>전시회를 선택</b>해 주세요.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            전시 품목은 전시회별로 따로 저장돼요.
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
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">전시 품목 리스트</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            부스 시뮬레이터에서 반영한 배치의 품목과 BOM을 정리합니다. 세 섹션이 서로
            연결돼 있어 품목·수량을 바꾸면 아래 BOM도 함께 바뀌어요.
          </p>
        </div>
        {shipment && (
          <div className="flex items-center gap-2">
            <button
              onClick={exportExcel}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              ⬇ 엑셀 추출 (3부문)
            </button>
            <button
              onClick={clearShipment}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-white/10"
            >
              비우기
            </button>
          </div>
        )}
      </div>

      {!loaded ? null : !shipment ? (
        <div className="rounded-2xl border border-black/10 bg-white p-8 text-center dark:border-white/10 dark:bg-zinc-900">
          <div className="text-4xl">📦</div>
          <div className="mt-3 text-base font-semibold">아직 반영된 전시 품목이 없어요</div>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
            <a href="/before/booth" className="text-blue-600 hover:underline dark:text-blue-400">
              부스 시뮬레이션
            </a>
            에서 디자인을 저장한 뒤, 「디자인 보관함」의{" "}
            <span className="font-medium text-blue-600">전시 품목 리스트 반영</span> 버튼을
            누르면 여기로 넘어옵니다.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* 헤더 */}
          <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
            <div className="text-lg font-semibold">{shipment.name}</div>
            <div className="mt-0.5 text-xs text-zinc-500">
              반영 {new Date(shipment.savedAt).toLocaleString()} · 품목 총 {totalQty}개
              {shipment.booth?.width && shipment.booth?.depth
                ? ` · 부스 ${(shipment.booth.width / 1000).toFixed(1)}×${(
                    shipment.booth.depth / 1000
                  ).toFixed(1)}m`
                : ""}
            </div>
          </div>

          {/* ① 전체 품목 */}
          <section className="rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-2 border-b border-black/10 px-4 py-3 dark:border-white/10">
              <div className="text-sm font-semibold">① 전체 품목</div>
              {editBtn(editItems, () => setEditItems((v) => !v))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-zinc-500">
                  <tr className="border-b border-black/5 dark:border-white/10">
                    <th className="px-3 py-2 text-left font-medium">품목</th>
                    <th className="px-3 py-2 text-left font-medium">브랜드</th>
                    <th className="px-3 py-2 text-left font-medium">규격(W×D×H)</th>
                    <th className="px-3 py-2 text-center font-medium">단</th>
                    <th className="px-3 py-2 text-left font-medium">프레임 색상</th>
                    <th className="px-3 py-2 text-right font-medium">수량</th>
                    {editItems && <th className="px-3 py-2" />}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={editItems ? 7 : 6} className="px-3 py-4 text-center text-zinc-400">
                        품목이 없어요. {editItems ? "「＋ 선반 추가」로 넣어보세요." : "「수정 및 추가」를 눌러 넣을 수 있어요."}
                      </td>
                    </tr>
                  )}
                  {items.map((r) =>
                    editItems ? (
                      <tr key={r.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                        <td className="px-2 py-1.5 min-w-[9rem]">
                          <select
                            value={SHELF_NAMES.includes(r.name) ? r.name : "__etc"}
                            onChange={(e) =>
                              patchItem(r.id, {
                                name: e.target.value === "__etc" ? r.name : e.target.value,
                              })
                            }
                            className={inputCls}
                          >
                            {SHELF_NAMES.map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                            {!SHELF_NAMES.includes(r.name) && (
                              <option value="__etc">{r.name}</option>
                            )}
                          </select>
                        </td>
                        <td className="px-2 py-1.5 min-w-[7rem]">
                          <select
                            value={r.brand}
                            onChange={(e) => patchItem(r.id, { brand: e.target.value })}
                            className={inputCls}
                          >
                            <option value="">-</option>
                            {BRANDS.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-1">
                            {(["width", "depth", "height"] as const).map((k) => (
                              <input
                                key={k}
                                type="number"
                                value={r[k]}
                                onChange={(e) =>
                                  patchItem(r.id, { [k]: parseInt(e.target.value, 10) || 0 })
                                }
                                className={numCls + " w-16"}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            value={r.tier}
                            onChange={(e) => patchItem(r.id, { tier: parseInt(e.target.value, 10) || 0 })}
                            className={numCls + " w-14"}
                          />
                        </td>
                        <td className="px-2 py-1.5 min-w-[6rem]">
                          <select
                            value={r.frameColor}
                            onChange={(e) => patchItem(r.id, { frameColor: e.target.value })}
                            className={inputCls}
                          >
                            <option value="">-</option>
                            {FRAME_COLORS.map((c) => (
                              <option key={c} value={c}>
                                {colorKo(c)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            value={r.qty}
                            onChange={(e) => patchItem(r.id, { qty: parseInt(e.target.value, 10) || 0 })}
                            className={numCls + " w-16"}
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <button
                            onClick={() => removeItem(r.id)}
                            className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-800"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={r.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                        <td className="px-3 py-2 font-medium">{r.name}</td>
                        <td className="px-3 py-2">{r.brand || "-"}</td>
                        <td className="px-3 py-2 tabular-nums">
                          {r.width}×{r.depth}×{r.height}
                        </td>
                        <td className="px-3 py-2 text-center tabular-nums">{r.tier}단</td>
                        <td className="px-3 py-2 text-zinc-500">{colorKo(r.frameColor)}</td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums">×{r.qty}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
            {editItems && (
              <div className="border-t border-black/10 px-4 py-3 dark:border-white/10">
                <button
                  onClick={addItem}
                  className="rounded-lg border border-blue-500 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                >
                  ＋ 선반 추가
                </button>
                <span className="ml-3 text-xs text-zinc-400">파츠 종류는 추후 추가될 예정이에요.</span>
              </div>
            )}
          </section>

          {/* ② 품목별 BOM */}
          <section className="rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-2 border-b border-black/10 px-4 py-3 dark:border-white/10">
              <div className="text-sm font-semibold">② 품목별 BOM</div>
              {editBtn(editBom, () => setEditBom((v) => !v))}
            </div>
            <div className="space-y-4 px-4 py-4">
              {shelfItems.length === 0 && partItems.length === 0 && (
                <div className="text-center text-sm text-zinc-400">품목이 없어요.</div>
              )}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {shelfItems.map((it) => (
                <ItemBom
                  key={it.id}
                  item={it}
                  title={`${it.name}`}
                  sub={`${it.brand ? it.brand + " · " : ""}${it.width}×${it.depth}×${it.height} · ${it.tier}단 · ×${it.qty}`}
                  edit={editBom}
                  onPatch={(pid, patch) => patchPart(it.id, pid, patch)}
                  onAdd={() => addPart(it.id)}
                  onRemove={(pid) => removePart(it.id, pid)}
                  inputCls={inputCls}
                  numCls={numCls}
                />
              ))}
              </div>
              {/* 선반이 아닌 파츠는 "추가 파츠" 로 묶음 */}
              {partItems.length > 0 && (
                <div>
                  <div className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                    추가 파츠
                  </div>
                  <div className="grid gap-3 border-l-2 border-blue-200 pl-3 dark:border-blue-900 sm:grid-cols-2 xl:grid-cols-3">
                    {partItems.map((it) => (
                      <ItemBom
                        key={it.id}
                        item={it}
                        title={it.name}
                        sub={`×${it.qty}`}
                        edit={editBom}
                        onPatch={(pid, patch) => patchPart(it.id, pid, patch)}
                        onAdd={() => addPart(it.id)}
                        onRemove={(pid) => removePart(it.id, pid)}
                        inputCls={inputCls}
                        numCls={numCls}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ③ 자재별 BOM */}
          <section className="rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
            <div className="border-b border-black/10 px-4 py-3 dark:border-white/10">
              <div className="text-sm font-semibold">③ 자재별 BOM</div>
              <div className="mt-0.5 text-xs text-zinc-500">
                ERP 내 기타출고요청에 입력합니다. (위 품목·수량을 부품별로 전부 합산한 값이에요.)
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-zinc-500">
                  <tr className="border-b border-black/5 dark:border-white/10">
                    <th className="px-3 py-2 text-left font-medium">부품</th>
                    <th className="px-3 py-2 text-right font-medium">총 수량(개)</th>
                  </tr>
                </thead>
                <tbody>
                  {agg.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-3 py-4 text-center text-zinc-400">
                        집계할 부품이 없어요.
                      </td>
                    </tr>
                  )}
                  {agg.map((r) => (
                    <tr key={r.part} className="border-b border-black/5 last:border-0 dark:border-white/5">
                      <td className="px-3 py-2 font-medium">{r.part}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

// 품목 하나의 BOM(부품 목록) — 보기/편집
function ItemBom({
  item,
  title,
  sub,
  edit,
  onPatch,
  onAdd,
  onRemove,
  inputCls,
  numCls,
}: {
  item: LineItem;
  title: string;
  sub: string;
  edit: boolean;
  onPatch: (partId: string, patch: Partial<PartRow>) => void;
  onAdd: () => void;
  onRemove: (partId: string) => void;
  inputCls: string;
  numCls: string;
}) {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-b border-black/5 px-3 py-2 dark:border-white/10">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-zinc-500">{sub}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-zinc-400">
            <tr>
              <th className="px-3 py-1.5 text-left font-medium">부품</th>
              <th className="px-3 py-1.5 text-right font-medium">1개당</th>
              <th className="px-3 py-1.5 text-right font-medium">합계(×{item.qty})</th>
              {edit && <th className="px-3 py-1.5" />}
            </tr>
          </thead>
          <tbody>
            {(item.bom || []).length === 0 && (
              <tr>
                <td colSpan={edit ? 4 : 3} className="px-3 py-2 text-center text-zinc-400">
                  부품이 없어요.
                </td>
              </tr>
            )}
            {(item.bom || []).map((p) =>
              edit ? (
                <tr key={p.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-2 py-1">
                    <input
                      value={p.part}
                      onChange={(e) => onPatch(p.id, { part: e.target.value })}
                      placeholder="부품명"
                      className={inputCls}
                    />
                  </td>
                  <td className="px-2 py-1 w-20">
                    <input
                      type="number"
                      value={p.qty}
                      onChange={(e) => onPatch(p.id, { qty: parseInt(e.target.value, 10) || 0 })}
                      className={numCls}
                    />
                  </td>
                  <td className="px-3 py-1 text-right tabular-nums text-zinc-500">
                    {(Number(p.qty) || 0) * (Number(item.qty) || 0)}
                  </td>
                  <td className="px-2 py-1 text-right">
                    <button
                      onClick={() => onRemove(p.id)}
                      className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-800"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={p.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-3 py-1.5">{p.part || "-"}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{p.qty}</td>
                  <td className="px-3 py-1.5 text-right font-medium tabular-nums">
                    {(Number(p.qty) || 0) * (Number(item.qty) || 0)}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
      {edit && (
        <div className="border-t border-black/5 px-3 py-2 dark:border-white/10">
          <button
            onClick={onAdd}
            className="rounded border border-blue-500 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
          >
            ＋ 부품 추가
          </button>
        </div>
      )}
    </div>
  );
}
