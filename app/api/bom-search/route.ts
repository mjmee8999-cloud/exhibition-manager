// BOM 조회 화면(누구나 링크로 사용)이 쓰는 서버 코드입니다.
//  - GET /api/bom-search            → 완제품 목록 전체 [{no,name,spec}] (서버 메모리에 캐시)
//  - GET /api/bom-search?no=<품번>  → 그 완제품의 BOM(부품 목록)
//  ERP 로그인은 서버(lib/erp)에서만 하므로 비밀번호가 브라우저에 노출되지 않습니다.

import { erpGet, fetchBom, erpConfigured } from "@/lib/erp";

export const dynamic = "force-dynamic";

type Parent = { no: string; name: string; spec: string };

// 완제품 목록은 무거우니(수만 종) 서버 메모리에 캐시하고 일정 시간마다 새로 읽습니다.
let cachedParents: Parent[] | null = null;
let parentsAt = 0;
const PARENTS_TTL = 30 * 60 * 1000; // 30분

async function getAllParents(): Promise<Parent[]> {
  const now = Date.now();
  if (cachedParents && now - parentsAt < PARENTS_TTL) return cachedParents;

  // v_bom 의 부모(완제품) 3컬럼을 1000행씩 나눠 받아 유일화. 잘림 방지를 위해 끝까지 읽음.
  const seen = new Map<string, Parent>();
  const PAGE = 1000;
  // 총 개수를 알아내기 위해 첫 페이지부터 순차로 읽되, 병렬 배치로 속도를 낸다.
  // 안전하게 200페이지(20만행)까지 시도하고, 빈 페이지가 나오면 멈춘다.
  let stop = false;
  for (let base = 0; base < 200000 && !stop; base += PAGE * 8) {
    const offsets = [];
    for (let k = 0; k < 8; k++) offsets.push(base + k * PAGE);
    const pages = await Promise.all(
      offsets.map((off) =>
        erpGet(`v_bom?select=ParentItemNo,ParentItemName,ParentSpec&limit=${PAGE}&offset=${off}`),
      ),
    );
    let maxLen = 0;
    for (const rows of pages) {
      maxLen = Math.max(maxLen, rows.length);
      for (const r of rows) {
        const no = String(r.ParentItemNo ?? "");
        if (no && !seen.has(no))
          seen.set(no, { no, name: String(r.ParentItemName ?? ""), spec: String(r.ParentSpec ?? "") });
      }
    }
    if (maxLen < PAGE) stop = true; // 마지막 배치
  }

  cachedParents = [...seen.values()].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  parentsAt = now;
  return cachedParents;
}

export async function GET(request: Request) {
  if (!erpConfigured()) {
    return Response.json(
      { error: "NO_ERP", message: "ERP 접속 정보가 서버에 설정되지 않았어요." },
      { status: 400 },
    );
  }
  try {
    const url = new URL(request.url);
    const no = url.searchParams.get("no");
    if (no) {
      const bom = await fetchBom(no);
      return Response.json({ bom });
    }
    const products = await getAllParents();
    return Response.json({ products, count: products.length });
  } catch (e) {
    return Response.json(
      { error: "ERP_FAIL", message: e instanceof Error ? e.message : "ERP 조회 오류" },
      { status: 500 },
    );
  }
}
