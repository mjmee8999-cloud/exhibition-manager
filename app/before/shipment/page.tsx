"use client";

// 전시품목(Shipment) 페이지
//  - 부스 시뮬레이터의 「전시품목 Shipment로 저장」으로 넘어온 배치를 여기서 봅니다.
//  - 저장은 localStorage 키 `booth_shipments` 에 들어있어요(시뮬레이터와 같은 도메인이라 공유).
//  - 품목 목록은 완성, BOM(자재 명세서)은 "뼈대"만 — 실제 부품표는 나중에 정밀화합니다.

import { useEffect, useState } from "react";

// ---- 타입 ----
type ShipmentItem = {
  productId: string;
  name: string;
  brand: "SPEEDRACK" | "HOMEDANT HOUSE";
  width: number;
  depth: number;
  height: number;
  tier: number;
  frameColor?: string;
  boardColor?: string;
};

type Shipment = {
  id: string;
  name: string;
  designId?: string;
  savedAt: string;
  booth?: { width?: number; depth?: number } | null;
  items: ShipmentItem[];
};

const KEY = "booth_shipments";

const brandKo = (b: string) => (b === "HOMEDANT HOUSE" ? "홈던트하우스" : "스피드랙");
const colorKo = (c?: string) =>
  c === "white" ? "화이트" : c === "black" ? "블랙" : c === "wood" ? "우드" : c ?? "-";

// 같은 사양의 품목을 묶어 수량으로 집계
function aggregateItems(items: ShipmentItem[]) {
  const map = new Map<string, { item: ShipmentItem; qty: number }>();
  for (const it of items) {
    const k = `${it.productId}|${it.brand}|${it.width}x${it.depth}x${it.height}|${it.tier}|${it.frameColor}|${it.boardColor}`;
    const cur = map.get(k);
    if (cur) cur.qty += 1;
    else map.set(k, { item: it, qty: 1 });
  }
  return Array.from(map.values());
}

// ── BOM 뼈대(초안) ─────────────────────────────────────────────
// 지금은 선반 1개당 대략적인 주요 부품만 계산합니다.
// TODO(추후): 사이즈·단수별 정확한 부품 규격/수량, 볼트/앵글 등 상세 자재까지 확장.
type BomRow = { part: string; qty: number; note: string };

function deriveBOM(items: ShipmentItem[]): BomRow[] {
  const acc = new Map<string, BomRow>();
  const add = (part: string, qty: number, note: string) => {
    const cur = acc.get(part);
    if (cur) cur.qty += qty;
    else acc.set(part, { part, qty, note });
  };
  for (const it of items) {
    const tier = it.tier || 1;
    const isSpeedrack = it.brand === "SPEEDRACK";
    add("프레임 기둥", 4, isSpeedrack ? "스피드랙: 타공 앵글" : "홈던트하우스: 일반 기둥");
    add("선반 판", tier, "단수만큼");
    add("연결 빔", tier * 4, "단당 4개");
    if (it.productId.includes("rolling")) add("바퀴(캐스터)", 4, "바퀴 선반");
    else add("받침 발", 4, "고정 발");
    if (it.productId.includes("pegboard")) add("타공판", 1, "타공 선반");
    if (it.productId.includes("garment")) add("행거 봉", 1, "행거 선반");
  }
  return Array.from(acc.values());
}

export default function ShipmentPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // localStorage 에서 읽기
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      const list: Shipment[] = raw ? JSON.parse(raw) : [];
      setShipments(Array.isArray(list) ? list : []);
      if (list.length > 0) setSelectedId(list[0].id);
    } catch {
      setShipments([]);
    }
    setLoaded(true);
  }, []);

  const persist = (list: Shipment[]) => {
    setShipments(list);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  };

  const deleteShipment = (id: string) => {
    const next = shipments.filter((s) => s.id !== id);
    persist(next);
    if (selectedId === id) setSelectedId(next[0]?.id ?? null);
  };

  const selected = shipments.find((s) => s.id === selectedId) ?? null;
  const aggregated = selected ? aggregateItems(selected.items) : [];
  const bom = selected ? deriveBOM(selected.items) : [];

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">전시품목 Shipment</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          부스 시뮬레이터에서 저장한 배치의 품목과 BOM(자재 명세서)을 정리합니다.
          품목 목록 → BOM 조립 → 선적서류로 이어질 예정이에요.
        </p>
      </div>

      {!loaded ? null : shipments.length === 0 ? (
        <div className="rounded-2xl border border-black/10 bg-white p-8 text-center dark:border-white/10 dark:bg-zinc-900">
          <div className="text-4xl">📦</div>
          <div className="mt-3 text-base font-semibold">아직 저장된 전시품목이 없어요</div>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
            <a href="/before/booth" className="text-blue-600 hover:underline dark:text-blue-400">
              부스 시뮬레이션
            </a>
            에서 디자인을 저장한 뒤, 「디자인 보관함」의{" "}
            <span className="font-medium text-red-600">전시품목 Shipment로 저장</span> 버튼을
            누르면 여기로 넘어옵니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[16rem_1fr]">
          {/* 좌: 전시품목 목록 */}
          <aside className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              저장된 전시품목 ({shipments.length})
            </div>
            {shipments.map((s) => {
              const active = s.id === selectedId;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={
                    "block w-full rounded-xl border px-3 py-2.5 text-left transition " +
                    (active
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                      : "border-black/10 hover:bg-black/[0.03] dark:border-white/10 dark:hover:bg-white/[0.05]")
                  }
                >
                  <div className="truncate text-sm font-medium">{s.name}</div>
                  <div className="mt-0.5 text-xs text-zinc-400">
                    선반 {s.items.length}개 · {new Date(s.savedAt).toLocaleDateString()}
                  </div>
                </button>
              );
            })}
          </aside>

          {/* 우: 상세 (품목 + BOM) */}
          {selected && (
            <section className="space-y-5">
              {/* 헤더 */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
                <div>
                  <div className="text-lg font-semibold">{selected.name}</div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    저장 {new Date(selected.savedAt).toLocaleString()} · 선반 총{" "}
                    {selected.items.length}개
                    {selected.booth?.width && selected.booth?.depth
                      ? ` · 부스 ${(selected.booth.width / 1000).toFixed(1)}×${(
                          selected.booth.depth / 1000
                        ).toFixed(1)}m`
                      : ""}
                  </div>
                </div>
                <button
                  onClick={() => deleteShipment(selected.id)}
                  className="rounded-lg border border-black/10 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-white/10"
                >
                  삭제
                </button>
              </div>

              {/* 품목 목록 */}
              <div className="rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
                <div className="border-b border-black/10 px-4 py-3 text-sm font-semibold dark:border-white/10">
                  품목 목록
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-zinc-500">
                      <tr className="border-b border-black/5 dark:border-white/10">
                        <th className="px-4 py-2 text-left font-medium">선반</th>
                        <th className="px-4 py-2 text-left font-medium">브랜드</th>
                        <th className="px-4 py-2 text-left font-medium">규격(W×D×H)</th>
                        <th className="px-4 py-2 text-center font-medium">단</th>
                        <th className="px-4 py-2 text-left font-medium">프레임/보드</th>
                        <th className="px-4 py-2 text-right font-medium">수량</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggregated.map(({ item, qty }, i) => (
                        <tr
                          key={i}
                          className="border-b border-black/5 last:border-0 dark:border-white/5"
                        >
                          <td className="px-4 py-2 font-medium">{item.name}</td>
                          <td className="px-4 py-2">{brandKo(item.brand)}</td>
                          <td className="px-4 py-2 tabular-nums">
                            {item.width}×{item.depth}×{item.height}
                          </td>
                          <td className="px-4 py-2 text-center tabular-nums">{item.tier}단</td>
                          <td className="px-4 py-2 text-zinc-500">
                            {colorKo(item.frameColor)} / {colorKo(item.boardColor)}
                          </td>
                          <td className="px-4 py-2 text-right font-semibold tabular-nums">
                            ×{qty}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BOM (뼈대) */}
              <div className="rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
                <div className="flex items-center justify-between gap-2 border-b border-black/10 px-4 py-3 dark:border-white/10">
                  <div className="text-sm font-semibold">BOM · 자재 명세서</div>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    초안(뼈대)
                  </span>
                </div>
                <div className="px-4 py-3">
                  <p className="mb-3 text-xs text-zinc-500">
                    ※ 지금은 선반 1개당 주요 부품만 대략 집계한 <b>초안</b>이에요. 사이즈·단수별
                    정확한 부품 규격과 볼트·앵글 등 상세 자재는 이후에 채워 넣을 예정입니다.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-zinc-500">
                        <tr className="border-b border-black/5 dark:border-white/10">
                          <th className="px-4 py-2 text-left font-medium">부품</th>
                          <th className="px-4 py-2 text-right font-medium">수량(개)</th>
                          <th className="px-4 py-2 text-left font-medium">비고</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bom.map((r) => (
                          <tr
                            key={r.part}
                            className="border-b border-black/5 last:border-0 dark:border-white/5"
                          >
                            <td className="px-4 py-2 font-medium">{r.part}</td>
                            <td className="px-4 py-2 text-right tabular-nums">{r.qty}</td>
                            <td className="px-4 py-2 text-zinc-500">{r.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      disabled
                      className="cursor-not-allowed rounded-lg border border-black/10 px-3 py-1.5 text-sm text-zinc-400 dark:border-white/10"
                      title="추후 구현 예정"
                    >
                      BOM 엑셀 내보내기 (준비 중)
                    </button>
                    <button
                      disabled
                      className="cursor-not-allowed rounded-lg border border-black/10 px-3 py-1.5 text-sm text-zinc-400 dark:border-white/10"
                      title="추후 구현 예정"
                    >
                      선적서류 만들기 (준비 중)
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
