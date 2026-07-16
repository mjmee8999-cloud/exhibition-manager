// 상담일지(명함)를 Supabase(진짜 데이터베이스)에 저장/조회하는 곳입니다.
//  - 상담일지 한 건을 통째로 JSON(data 열)에 담습니다.
//    → 필드가 아무리 많아도, 나중에 필드가 늘어도 코드를 안 바꿔도 됩니다.
//  - 어느 컴퓨터에서 열어도 같은 명함이 보입니다(모두 공유).
//
// 표 구조(consultations): id(text), exhibition_id(text), data(jsonb), created_at
//  - exhibition_id = 이 상담일지가 속한 전시회 id

import { supabase } from "./supabase";
import type { Consultation } from "./consultation";

const TABLE = "consultations";

// 특정 전시회의 상담일지 전체를 최신순으로 불러옵니다.
export async function listConsultations(exhibitionId: string): Promise<Consultation[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("data")
    .eq("exhibition_id", exhibitionId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("상담일지 불러오기 실패:", error.message);
    return [];
  }
  return (data ?? []).map((r) => (r as { data: Consultation }).data);
}

// 상담일지 한 건을 저장합니다(새로 추가 또는 수정 — 같은 id면 덮어씀).
export async function saveConsultation(
  exhibitionId: string,
  c: Consultation,
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ id: c.id, exhibition_id: exhibitionId, data: c }, { onConflict: "id" });
  if (error) console.error("상담일지 저장 실패:", error.message);
}

// 상담일지 한 건을 삭제합니다.
export async function deleteConsultation(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) console.error("상담일지 삭제 실패:", error.message);
}
