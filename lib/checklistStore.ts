// 체크리스트를 Supabase(진짜 데이터베이스)에 저장/조회하는 곳입니다.
//  - 두 종류를 저장해요:
//    (1) 구성(structure): 섹션·항목 목록. 이제 **전시회별로 따로** 저장합니다.
//        표 checklist_structure(id=전시회id, data jsonb) — 전시회당 1줄
//        아직 편집한 적 없는 전시회는 저장분이 없고, 기본값(DEFAULT_CHECKLIST)을 보여줘요.
//    (2) 진행상태(progress): 전시회별 체크·비고.
//        표 checklists(exhibition_id, data jsonb) — 전시회당 1줄

import { supabase } from "./supabase";
import {
  DEFAULT_CHECKLIST,
  type ChecklistPhase,
  type ChecklistProgress,
} from "./checklist";

const STRUCTURE_TABLE = "checklist_structure";
const PROGRESS_TABLE = "checklists";

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

// ── 구성(structure) ──

// 특정 전시회의 구성을 불러옵니다. 저장된 게 없으면 기본값(DEFAULT_CHECKLIST).
export async function loadStructure(exhibitionId: string): Promise<ChecklistPhase[]> {
  const { data, error } = await supabase
    .from(STRUCTURE_TABLE)
    .select("data")
    .eq("id", exhibitionId)
    .maybeSingle();
  if (error) {
    console.error("체크리스트 구성 불러오기 실패:", error.message);
    return clone(DEFAULT_CHECKLIST);
  }
  const s = data?.data as ChecklistPhase[] | undefined;
  if (Array.isArray(s) && s.length) return s;
  return clone(DEFAULT_CHECKLIST); // 이 전시회는 아직 편집 전 → 기본 구성
}

// 특정 전시회의 구성을 저장합니다(그 전시회 한 줄만 덮어씀).
export async function saveStructure(
  exhibitionId: string,
  structure: ChecklistPhase[],
): Promise<void> {
  const { error } = await supabase
    .from(STRUCTURE_TABLE)
    .upsert({ id: exhibitionId, data: structure }, { onConflict: "id" });
  if (error) console.error("체크리스트 구성 저장 실패:", error.message);
}

// 모든 전시회의 구성을 한 번에 불러옵니다(홈 카드 진행률용).
//  - 반환: { 전시회id: 구성 }. 저장분이 없는 전시회는 여기 없고, 홈에서 기본값으로 처리.
export async function loadAllStructures(): Promise<Record<string, ChecklistPhase[]>> {
  const { data, error } = await supabase.from(STRUCTURE_TABLE).select("id, data");
  if (error) {
    console.error("체크리스트 전체 구성 불러오기 실패:", error.message);
    return {};
  }
  const out: Record<string, ChecklistPhase[]> = {};
  for (const row of (data ?? []) as { id: string; data: ChecklistPhase[] }[]) {
    if (Array.isArray(row.data) && row.data.length) out[row.id] = row.data;
  }
  return out;
}

// ── 진행상태(progress) ──

// 특정 전시회의 진행상태를 불러옵니다. 없으면 빈 값.
export async function loadProgress(exhibitionId: string): Promise<ChecklistProgress> {
  const { data, error } = await supabase
    .from(PROGRESS_TABLE)
    .select("data")
    .eq("exhibition_id", exhibitionId)
    .maybeSingle();
  if (error) {
    console.error("체크리스트 진행상태 불러오기 실패:", error.message);
    return {};
  }
  return (data?.data as ChecklistProgress) ?? {};
}

// 특정 전시회의 진행상태를 저장합니다(전시회당 1줄 덮어씀).
export async function saveProgress(
  exhibitionId: string,
  progress: ChecklistProgress,
): Promise<void> {
  const { error } = await supabase
    .from(PROGRESS_TABLE)
    .upsert({ exhibition_id: exhibitionId, data: progress }, { onConflict: "exhibition_id" });
  if (error) console.error("체크리스트 진행상태 저장 실패:", error.message);
}

// 모든 전시회의 진행상태를 한 번에 불러옵니다(홈 화면 카드 진행률용).
export async function loadAllProgress(): Promise<Record<string, ChecklistProgress>> {
  const { data, error } = await supabase
    .from(PROGRESS_TABLE)
    .select("exhibition_id, data");
  if (error) {
    console.error("체크리스트 전체 진행상태 불러오기 실패:", error.message);
    return {};
  }
  const out: Record<string, ChecklistProgress> = {};
  for (const row of (data ?? []) as { exhibition_id: string; data: ChecklistProgress }[]) {
    out[row.exhibition_id] = row.data ?? {};
  }
  return out;
}
