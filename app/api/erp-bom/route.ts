// 전시 품목 리스트의 각 품목을, 조민기님 ERP(smarthub.v_bom)의 "진짜 BOM"과 연결해 주는 서버 코드입니다.
//
//  왜 서버에서 하냐면: ERP는 로그인이 필요한데, 그 ID/비밀번호를 브라우저에 노출하면 안 되기 때문이에요.
//  로그인 정보(ERP_LOGIN_EMAIL/PW 등)는 .env.local(서버 전용)에만 두고, 여기서만 사용합니다.
//
//  동작:
//   1) 브라우저가 품목 목록을 보냄  { items: [{ brand, name, width, depth, height, frameColor }] }
//   2) 서버가 ERP에 로그인 → 각 품목을 규격/브랜드/종류/색으로 실제 SKU와 매칭
//   3) 매칭되면 그 SKU의 BOM(부품 품번·이름·규격·수량)을 돌려줌. 못 찾으면 "수동확인" 표시.

import { erpGet, fetchBom, erpConfigured, type ErpBomPart } from "@/lib/erp";

export const dynamic = "force-dynamic";

// ── 번역표: 앱 용어 → ERP 이름 키워드 ──
const BRAND_KW: Record<string, string> = {
  홈던트하우스: "H하우스",
  스피드랙: "스피드랙",
};
// 기본(일반) 선반으로 볼 때, 이름에 이 단어가 있으면 "기본"이 아님 → 제외
const NON_BASIC = ["트롤리", "타공판", "하단오픈형", "행거", "연결형", "세탁기", "틈새", "단추가", "MAX"];
// 채널 우선순위(앞일수록 우선)
const CHANNELS = ["온라인", "쿠팡(동명)", "쿠팡", "홈쇼핑", "리퍼"];

function typeKeyword(name: string): string | null {
  // 트롤리(손잡이+바퀴)와 바퀴 선반은 다른 제품이다.
  // 트롤리는 ERP에 정식 SKU('선반/트롤리')가 있음.
  if (name.includes("트롤리")) return "트롤리";
  if (name.includes("타공")) return "타공판";
  if (name.includes("하단오픈")) return "하단오픈형";
  if (name.includes("행거")) return "행거";
  if (name.includes("연결")) return "연결형";
  if (name.includes("MAX")) return "MAX";
  // '바퀴 선반'은 국내 ERP에 별도 SKU가 거의 없어, 기본 선반으로 매칭됩니다(바퀴는 별도).
  return null;
}

type InItem = {
  key: string;
  brand?: string;
  name: string;
  width: number;
  depth: number;
  height: number;
  frameColor?: string;
};

type MatchResult = {
  key: string;
  matched: boolean;
  sku?: string;
  parentName?: string;
  parentSpec?: string;
  bom: ErpBomPart[];
  note?: string;
};

// 규격 W*D*H 로 후보 SKU를 모두 가져온다(잘림 방지 위해 페이지네이션)
async function fetchCandidatesBySpec(w: number, d: number, h: number) {
  const like = encodeURIComponent(`${w}*${d}*${h}*`); // like 의 * 가 리터럴 * 를 덮음
  const seen = new Map<string, { name: string; spec: string }>();
  for (let off = 0; off < 4000; off += 1000) {
    const rows = await erpGet(
      `v_bom?select=ParentItemNo,ParentItemName,ParentSpec&limit=1000&offset=${off}&ParentSpec=like.${like}`,
    );
    for (const r of rows) {
      const no = String(r.ParentItemNo);
      if (!seen.has(no)) seen.set(no, { name: String(r.ParentItemName ?? ""), spec: String(r.ParentSpec ?? "") });
    }
    if (rows.length < 1000) break;
  }
  return [...seen.entries()].map(([no, v]) => ({ no, name: v.name, spec: v.spec }));
}

// 후보 중 브랜드/종류/색이 맞는 SKU 하나를 고른다
function pickSku(
  cands: { no: string; name: string; spec: string }[],
  item: InItem,
): { no: string; name: string; spec: string } | null {
  const brandKw = item.brand ? BRAND_KW[item.brand] ?? item.brand : "";
  const tkw = typeKeyword(item.name);
  const color = item.frameColor === "white" ? "W" : item.frameColor === "black" ? "B" : "";

  const ok = (c: { name: string }) => {
    const nm = c.name;
    if (brandKw && !nm.includes(brandKw)) return false;
    if (tkw === null) {
      if (NON_BASIC.some((x) => nm.includes(x))) return false;
    } else if (!nm.includes(tkw)) return false;
    if (color) {
      const code = nm.split("/").pop() ?? "";
      if (code.charAt(0).toUpperCase() !== color && !nm.includes(`/${color}`)) return false;
    }
    return true;
  };

  const hits = cands.filter(ok);
  if (!hits.length) return null;
  // 채널 우선순위로 정렬
  const chanRank = (nm: string) => {
    const i = CHANNELS.findIndex((c) => nm.includes(c));
    return i < 0 ? 99 : i;
  };
  hits.sort((a, b) => chanRank(a.name) - chanRank(b.name));
  return hits[0];
}

export async function POST(request: Request) {
  if (!erpConfigured()) {
    return Response.json(
      { error: "NO_ERP", message: "ERP 접속 정보가 서버에 설정되지 않았어요(.env.local 확인)." },
      { status: 400 },
    );
  }

  let items: InItem[] = [];
  try {
    const body = await request.json();
    items = Array.isArray(body?.items) ? body.items : [];
  } catch {
    return Response.json({ error: "BAD_BODY" }, { status: 400 });
  }

  try {
    // 같은 사양은 한 번만 조회(캐시)해서 낭비를 줄임
    const cache = new Map<string, MatchResult>();
    const results: MatchResult[] = [];

    for (const it of items) {
      const sig = `${it.brand ?? ""}|${it.name}|${it.width}x${it.depth}x${it.height}|${it.frameColor ?? ""}`;
      const cached = cache.get(sig);
      if (cached) {
        results.push({ ...cached, key: it.key });
        continue;
      }

      let out: MatchResult;
      if (!it.width || !it.depth || !it.height) {
        out = { key: it.key, matched: false, bom: [], note: "규격 정보가 부족해요" };
      } else {
        const cands = await fetchCandidatesBySpec(it.width, it.depth, it.height);
        const sku = pickSku(cands, it);
        if (!sku) {
          out = {
            key: it.key,
            matched: false,
            bom: [],
            note: cands.length
              ? "규격은 있으나 브랜드/종류/색이 맞는 제품이 없어요"
              : "이 규격의 제품이 ERP에 없어요",
          };
        } else {
          const bom = await fetchBom(sku.no);
          out = { key: it.key, matched: true, sku: sku.no, parentName: sku.name, parentSpec: sku.spec, bom };
        }
      }
      cache.set(sig, out);
      results.push(out);
    }

    return Response.json({ results });
  } catch (e) {
    return Response.json(
      { error: "ERP_FAIL", message: e instanceof Error ? e.message : "ERP 조회 중 오류" },
      { status: 500 },
    );
  }
}
