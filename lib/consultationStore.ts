// 상담일지(명함)를 Supabase(진짜 데이터베이스)에 저장/조회하는 곳입니다.
//  - 상담일지 "내용"은 통째로 JSON(data 열)에 담습니다.
//    → 필드가 아무리 많아도, 나중에 필드가 늘어도 코드를 안 바꿔도 됩니다.
//  - 명함 "사진"은 용량이 커서 JSON에 넣지 않고, 현장 사진처럼
//    Storage(사진 전용 창고, 버킷 이름 'cards')에 올립니다.
//    DB에는 사진의 "주소(cardPath)"만 담고, 화면에 보여줄 땐 그 주소로 공개 URL을 만듭니다.
//  - 어느 컴퓨터에서 열어도 같은 명함이 보입니다(모두 공유).
//
// 표 구조(consultations): id(text), exhibition_id(text), data(jsonb), created_at
//  - exhibition_id = 이 상담일지가 속한 전시회 id
// 버킷(cards): 공개(public) — 사진 주소만 알면 누구나 볼 수 있음

import { supabase } from "./supabase";
import type { Consultation } from "./consultation";

const TABLE = "consultations";
const BUCKET = "cards";

// Storage 경로(cardPath) → 공개 URL 로 바꿔줍니다.
function toPublicUrl(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// data URL(base64) → 실제 파일(Blob) 로 바꿉니다. (Storage 업로드용)
function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(",");
  const mime = /data:(.*?);/.exec(head)?.[1] || "image/jpeg";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// 특정 전시회의 상담일지 전체를 최신순으로 불러옵니다.
//  - 명함이 창고(cardPath)에 있으면 → cardImage 를 공개 URL로 채워서 화면에 바로 보이게 합니다.
//  - 예전 자료(cardPath 없음)는 cardImage 에 base64가 그대로 들어있어 그대로 보입니다.
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
  return (data ?? []).map((r) => {
    const c = (r as { data: Consultation }).data;
    if (c.cardPath) {
      return { ...c, cardImage: toPublicUrl(c.cardPath) };
    }
    return c;
  });
}

// 상담일지 한 건을 저장합니다(새로 추가 또는 수정 — 같은 id면 덮어씀).
//  - 명함이 새로 찍은 사진(data URL)이면 → 창고에 올리고, DB엔 경로만 담습니다.
//  - 명함을 지웠으면 → 창고 파일도 지웁니다.
//  - 반환값: 화면 갱신용으로 cardImage 가 공개 URL로 채워진 상담일지.
export async function saveConsultation(
  exhibitionId: string,
  c: Consultation,
): Promise<Consultation> {
  const path = `${exhibitionId}/${c.id}.jpg`;
  const img = c.cardImage ?? "";
  let cardPath = "";

  if (img.startsWith("data:")) {
    // 새로 찍은/교체한 명함 → 창고에 업로드
    const up = await supabase.storage
      .from(BUCKET)
      .upload(path, dataUrlToBlob(img), { contentType: "image/jpeg", upsert: true });
    if (up.error) {
      // 창고 업로드가 실패하면 데이터를 잃지 않도록 예전 방식(base64 그대로)으로 저장합니다.
      console.error("명함 업로드 실패 — 사진을 그대로 저장합니다:", up.error.message);
      const { error } = await supabase
        .from(TABLE)
        .upsert(
          { id: c.id, exhibition_id: exhibitionId, data: { ...c, cardPath: "" } },
          { onConflict: "id" },
        );
      if (error) console.error("상담일지 저장 실패:", error.message);
      return c;
    }
    cardPath = path;
  } else if (img) {
    // 이미 창고에 올라간 명함(공개 URL) — 경로는 그대로 유지
    cardPath = path;
  } else {
    // 명함 없음 / 제거됨 → 혹시 남아있는 창고 파일 정리
    await supabase.storage.from(BUCKET).remove([path]);
    cardPath = "";
  }

  // DB에는 사진 없이(경로만) 저장 — data 열이 가벼워집니다.
  const toStore: Consultation = { ...c, cardImage: "", cardPath };
  const { error } = await supabase
    .from(TABLE)
    .upsert({ id: c.id, exhibition_id: exhibitionId, data: toStore }, { onConflict: "id" });
  if (error) console.error("상담일지 저장 실패:", error.message);

  return { ...c, cardPath, cardImage: cardPath ? toPublicUrl(cardPath) : "" };
}

// 상담일지 여러 건을 한 번에 저장합니다. (엑셀 대량 추가용)
//  - 이 경우 명함 사진이 없으므로(QR 리드 명단) Storage 업로드 과정 없이 바로 DB에 넣습니다.
//  - 너무 많으면 한 번에 못 보낼 수 있어 500건씩 끊어서 저장합니다.
//  - 반환값: 실제로 저장된 건수.
export async function saveConsultationsBulk(
  exhibitionId: string,
  list: Consultation[],
): Promise<number> {
  const rows = list.map((c) => ({
    id: c.id,
    exhibition_id: exhibitionId,
    data: { ...c, cardImage: "", cardPath: "" } as Consultation,
  }));

  let saved = 0;
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from(TABLE).upsert(slice, { onConflict: "id" });
    if (error) {
      console.error("상담일지 대량 저장 실패:", error.message);
      break; // 실패하면 지금까지 저장된 만큼만 알리고 멈춥니다.
    }
    saved += slice.length;
  }
  return saved;
}

// 상담일지 한 건을 삭제합니다 — DB 정보 + 창고의 명함 파일 둘 다.
export async function deleteConsultation(id: string, cardPath?: string): Promise<void> {
  if (cardPath) {
    const { error: se } = await supabase.storage.from(BUCKET).remove([cardPath]);
    if (se) console.error("명함 파일 삭제 실패:", se.message);
  }
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) console.error("상담일지 삭제 실패:", error.message);
}

// 예전 자료(명함이 DB 안에 base64로 든 것)를 창고로 옮깁니다.
//  - listConsultations 로 불러온 목록을 넘기면, base64 명함이 있는 것만 골라 업로드+경로저장.
//  - 옮긴 게 하나라도 있으면 true 를 돌려줍니다(화면에서 목록을 새로고침하도록).
export async function migrateConsultationCards(
  exhibitionId: string,
  list: Consultation[],
): Promise<boolean> {
  let migrated = false;
  for (const c of list) {
    if ((c.cardImage ?? "").startsWith("data:")) {
      await saveConsultation(exhibitionId, c);
      migrated = true;
    }
  }
  return migrated;
}
