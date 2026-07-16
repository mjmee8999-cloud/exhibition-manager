// 부스 디자인을 Supabase(우리 앱의 진짜 데이터베이스)에 저장/조회합니다.
//
// booth-sim 은 우리 Next 앱과는 별개인 작은 앱(iframe 안에서 돌아감)이라,
// 여기서는 Supabase SDK 대신 REST API를 fetch 로 직접 부릅니다.
// (SDK 를 새로 설치하지 않아 부스 앱이 가벼워요.)
//
// 아래 publishable 키는 "공개용 열쇠"라서 코드에 그대로 넣어도 안전합니다.
// (진짜 비밀 열쇠인 secret/service_role 키는 절대 넣지 않습니다.)
// 데이터 접근은 Supabase 정책(RLS)으로 통제 — 지금은 "누구나 읽고 쓰기(모두 공유)".
//
// 표 구조:  booth_designs(id text PK, exhibition_id text, data jsonb, created_at)
//   - id            : 디자인 고유번호 (예: d_1720000000000)
//   - exhibition_id : 어느 전시회의 디자인인지
//   - data          : 디자인 전체({id,name,savedAt,booth,products})를 통째로 JSON 저장

const SB_URL = 'https://ddkvudsbelvuzqykizkm.supabase.co';
const SB_KEY = 'sb_publishable_TLQZbmMR9LoXYhbN1H8xbQ_uHajUO_Y';
const TABLE = 'booth_designs';

const headers = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
};

// 특정 전시회의 저장된 디자인 목록을 불러옵니다(오래된 → 최신 순).
export async function listDesigns(exId) {
  const res = await fetch(
    `${SB_URL}/rest/v1/${TABLE}?exhibition_id=eq.${encodeURIComponent(exId)}` +
      `&select=data&order=created_at.asc`,
    { headers },
  );
  if (!res.ok) throw new Error(`디자인 목록 불러오기 실패 (${res.status})`);
  const rows = await res.json();
  // 각 줄의 data(=디자인 전체)만 뽑아 배열로 돌려줍니다.
  return rows.map((r) => r.data).filter(Boolean);
}

// 디자인 1건을 저장합니다. 같은 id 가 이미 있으면 덮어씁니다(upsert).
export async function saveDesign(exId, design) {
  const res = await fetch(`${SB_URL}/rest/v1/${TABLE}`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ id: design.id, exhibition_id: exId, data: design }),
  });
  if (!res.ok) throw new Error(`디자인 저장 실패 (${res.status})`);
}

// 디자인 1건을 삭제합니다.
export async function deleteDesign(id) {
  const res = await fetch(
    `${SB_URL}/rest/v1/${TABLE}?id=eq.${encodeURIComponent(id)}`,
    { method: 'DELETE', headers },
  );
  if (!res.ok) throw new Error(`디자인 삭제 실패 (${res.status})`);
}
