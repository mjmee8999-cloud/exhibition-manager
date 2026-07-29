// 조민기님 ERP(Supabase, smarthub 스키마)에 접속해 실제 BOM/품목을 읽는 공용 함수들입니다.
//  - 이 데이터는 "로그인이 필요"하므로, ID/비밀번호는 서버 전용 .env.local 에만 두고 여기서만 씁니다.
//  - 서버(Next.js route)에서만 import 해서 쓰세요. 브라우저에는 이 파일이 실려 나가면 안 됩니다.

const ERP_URL = process.env.ERP_SUPABASE_URL || "";
const ERP_KEY = process.env.ERP_SUPABASE_KEY || "";
const ERP_EMAIL = process.env.ERP_LOGIN_EMAIL || "";
const ERP_PW = process.env.ERP_LOGIN_PW || "";

export function erpConfigured(): boolean {
  return Boolean(ERP_URL && ERP_KEY && ERP_EMAIL && ERP_PW);
}

// ── 로그인 토큰을 서버 메모리에 잠깐 캐시(만료 전까지 재사용) ──
let cachedToken: string | null = null;
let tokenExpireAt = 0;

async function getToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpireAt) return cachedToken;
  const res = await fetch(`${ERP_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ERP_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: ERP_EMAIL, password: ERP_PW }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("ERP 로그인 실패");
  cachedToken = data.access_token as string;
  tokenExpireAt = now + ((data.expires_in || 3600) - 60) * 1000;
  return cachedToken;
}

// smarthub 스키마의 표를 REST로 조회
export async function erpGet(pathAndQuery: string): Promise<Record<string, unknown>[]> {
  const token = await getToken();
  const res = await fetch(`${ERP_URL}/rest/v1/${pathAndQuery}`, {
    headers: {
      apikey: ERP_KEY,
      Authorization: `Bearer ${token}`,
      "Accept-Profile": "smarthub", // ← 실제 데이터가 있는 스키마
    },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const j = await res.json();
  return Array.isArray(j) ? j : [];
}

// ParentSpec 은 "가로*세로*높이*단수S" 형태예요. 예: "1200*400*1800*5S" → 끝의 5S = 5단.
//  맨 뒤 조각에서 (숫자)S 를 읽어 단수를 돌려줍니다. 2.5S 같은 소수도 처리하고,
//  형태가 아니면(단수 정보 없음) null 을 돌려줍니다.
export function parseSpecTier(spec: string): number | null {
  if (!spec) return null;
  const segs = String(spec).split("*");
  const last = (segs[segs.length - 1] ?? "").trim();
  const m = last.match(/^(\d+(?:\.\d+)?)\s*[Ss]$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isNaN(n) ? null : n;
}

export type ErpBomPart = { itemNo: string; name: string; spec: string; qty: number };

// 한 완제품(ParentItemNo)의 BOM(부품 목록)을 가져온다. 같은 부품은 수량 합산.
export async function fetchBom(parentItemNo: string): Promise<ErpBomPart[]> {
  const rows = await erpGet(
    `v_bom?select=SubItemNo,SubItemName,SubSpec,NeedQtyNumerator,NeedQtyDenominator&ParentItemNo=eq.${encodeURIComponent(parentItemNo)}`,
  );
  const map = new Map<string, ErpBomPart>();
  for (const r of rows) {
    const itemNo = String(r.SubItemNo ?? "");
    const spec = String(r.SubSpec ?? "");
    const num = Number(r.NeedQtyNumerator ?? 0);
    const den = Number(r.NeedQtyDenominator ?? 1) || 1;
    const qty = num / den;
    const k = `${itemNo}|${spec}`;
    const cur = map.get(k);
    if (cur) cur.qty += qty;
    else map.set(k, { itemNo, name: String(r.SubItemName ?? ""), spec, qty });
  }
  return [...map.values()];
}
