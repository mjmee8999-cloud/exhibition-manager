// 현장 사진을 Supabase에 저장/조회하는 곳입니다.
//  - 사진은 용량이 커서, 다른 데이터처럼 DB 칸에 통째로 넣지 않습니다.
//    대신 사진 "파일"은 Storage(사진 전용 창고, 버킷 이름 'photos')에 올리고,
//    DB(photos 표)에는 그 사진의 "주소(path)·설명·전시회id"만 저장합니다.
//  - 이렇게 하면 DB가 가볍고 빨라요. 어느 PC에서 열어도 같은 사진이 보입니다(모두 공유).
//
// 표 구조(photos): id(text) · exhibition_id(text) · path(text) · caption(text) · created_at
// 버킷(photos): 공개(public) — 사진 주소만 알면 누구나 볼 수 있음

import { supabase } from "./supabase";

const BUCKET = "photos";
const TABLE = "photos";

// 화면에 보여줄 사진 한 장의 정보
export type PhotoRecord = {
  id: string;
  createdAt: string;
  caption: string; // 사진 설명
  path: string; // Storage 안의 파일 경로 (예: ex123/abc.jpg) — 삭제할 때 필요
  image: string; // 화면 표시·다운로드용 공개 URL
};

// Storage 경로(path) → 공개 URL 로 바꿔줍니다.
function toPublicUrl(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// 특정 전시회의 사진 목록을 최신순으로 불러옵니다.
export async function listPhotos(exhibitionId: string): Promise<PhotoRecord[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, caption, path, created_at")
    .eq("exhibition_id", exhibitionId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("현장 사진 불러오기 실패:", error.message);
    return [];
  }
  return (data ?? []).map((r) => {
    const row = r as { id: string; caption: string | null; path: string; created_at: string };
    return {
      id: row.id,
      createdAt: row.created_at,
      caption: row.caption ?? "",
      path: row.path,
      image: toPublicUrl(row.path),
    };
  });
}

// 사진 1장을 올립니다 — Storage에 파일 업로드 + DB에 정보 저장.
export async function uploadPhoto(
  exhibitionId: string,
  photo: { id: string; blob: Blob; caption: string; createdAt: string },
): Promise<PhotoRecord> {
  const path = `${exhibitionId}/${photo.id}.jpg`;
  const up = await supabase.storage
    .from(BUCKET)
    .upload(path, photo.blob, { contentType: "image/jpeg", upsert: true });
  if (up.error) throw new Error("사진 업로드 실패: " + up.error.message);

  const { error } = await supabase
    .from(TABLE)
    .upsert(
      {
        id: photo.id,
        exhibition_id: exhibitionId,
        path,
        caption: photo.caption,
        created_at: photo.createdAt,
      },
      { onConflict: "id" },
    );
  if (error) throw new Error("사진 정보 저장 실패: " + error.message);

  return {
    id: photo.id,
    createdAt: photo.createdAt,
    caption: photo.caption,
    path,
    image: toPublicUrl(path),
  };
}

// 사진 설명(캡션)만 고칩니다.
export async function updatePhotoCaption(id: string, caption: string): Promise<void> {
  const { error } = await supabase.from(TABLE).update({ caption }).eq("id", id);
  if (error) console.error("사진 설명 저장 실패:", error.message);
}

// 사진 1장을 지웁니다 — Storage 파일 + DB 정보 둘 다.
export async function deletePhoto(id: string, path: string): Promise<void> {
  const { error: se } = await supabase.storage.from(BUCKET).remove([path]);
  if (se) console.error("사진 파일 삭제 실패:", se.message);
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) console.error("사진 정보 삭제 실패:", error.message);
}
