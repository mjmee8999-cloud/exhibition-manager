// 전시 품목 리스트(Shipment)를 Supabase(진짜 데이터베이스)에 저장/조회하는 곳입니다.
//  - 전시회당 1건만 유지합니다(부스에서 새로 반영하면 덮어씀).
//    그래서 표의 기본키(PK)를 exhibition_id 로 두고, 같은 전시회면 upsert(덮어쓰기) 합니다.
//  - 상담일지처럼 전체를 통째로 jsonb(data)에 담아, 필드가 늘어도 코드를 안 바꿔도 됩니다.
//  - 어느 컴퓨터에서 열어도 같은 전시 품목이 보입니다(모두 공유).
//
// 표 구조(booth_shipments): exhibition_id(text PK), data(jsonb), updated_at

import { supabase } from "./supabase";

const TABLE = "booth_shipments";

// 특정 전시회의 전시 품목을 불러옵니다. (없으면 null)
export async function loadShipment<T = unknown>(exhibitionId: string): Promise<T | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("data")
    .eq("exhibition_id", exhibitionId)
    .maybeSingle();
  if (error) {
    console.error("전시 품목 불러오기 실패:", error.message);
    return null;
  }
  return (data?.data as T) ?? null;
}

// 전시 품목을 저장합니다(같은 전시회면 덮어씀). 성공하면 true.
export async function saveShipment(exhibitionId: string, shipment: unknown): Promise<boolean> {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ exhibition_id: exhibitionId, data: shipment }, { onConflict: "exhibition_id" });
  if (error) {
    console.error("전시 품목 저장 실패:", error.message);
    return false;
  }
  return true;
}

// 전시 품목을 비웁니다(삭제).
export async function deleteShipment(exhibitionId: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("exhibition_id", exhibitionId);
  if (error) console.error("전시 품목 삭제 실패:", error.message);
}
