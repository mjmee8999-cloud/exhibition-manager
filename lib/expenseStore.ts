// 출장비(지출)를 Supabase(진짜 데이터베이스)에 저장/조회하는 곳입니다.
//  - 지출 한 건을 통째로 JSON(data 열)에 담습니다(영수증 첨부까지 함께).
//    → 필드가 늘어도 코드를 안 바꿔도 됩니다. 상담일지와 같은 방식.
//  - 어느 컴퓨터에서 열어도 같은 정산 내역이 보입니다(모두 공유).
//
// 표 구조(expenses): id(text), exhibition_id(text), data(jsonb), created_at
//  - exhibition_id = 이 지출이 속한 전시회 id

import { supabase } from "./supabase";
import { normalizeExpense, type Expense } from "./expense";

const TABLE = "expenses";

// 특정 전시회의 지출 전체를 지출일 순으로 불러옵니다.
export async function listExpenses(exhibitionId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("data")
    .eq("exhibition_id", exhibitionId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("출장비 불러오기 실패:", error.message);
    return [];
  }
  // 예전 형식(영수증 1장 등)도 normalizeExpense 로 최신 형식에 맞춰 돌려줍니다.
  return (data ?? []).map((r) => normalizeExpense((r as { data: unknown }).data));
}

// 지출 한 건을 저장합니다(새로 추가 또는 수정 — 같은 id면 덮어씀).
export async function saveExpense(exhibitionId: string, e: Expense): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ id: e.id, exhibition_id: exhibitionId, data: e }, { onConflict: "id" });
  if (error) console.error("출장비 저장 실패:", error.message);
}

// 지출 한 건을 삭제합니다.
export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) console.error("출장비 삭제 실패:", error.message);
}
