// 출장비(지출)를 Supabase(진짜 데이터베이스)에 저장/조회하는 곳입니다.
//  - 지출 한 건을 통째로 JSON(data 열)에 담습니다(영수증 첨부까지 함께).
//    → 필드가 늘어도 코드를 안 바꿔도 됩니다. 상담일지와 같은 방식.
//  - 어느 컴퓨터에서 열어도 같은 정산 내역이 보입니다(모두 공유).
//
// 표 구조(expenses): id(text), exhibition_id(text), data(jsonb), created_at
//  - exhibition_id = 이 지출이 속한 전시회 id

import { supabase } from "./supabase";
import { normalizeExpense, type Expense, type Receipt } from "./expense";
import { resizeImage } from "./consultation";

const TABLE = "expenses";
const RECEIPT_BUCKET = "receipts"; // 영수증 파일(사진·PDF) 창고

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

/* ===================== 영수증 파일(Storage) ===================== */

// 데이터 URL(파일을 글자로) → 진짜 파일(Blob)로 변환합니다. 업로드할 때 필요해요.
function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(",");
  const mime = head.match(/:(.*?);/)?.[1] ?? "application/octet-stream";
  const bin = atob(body);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// 창고 경로(path) → 화면 표시·다운로드용 공개 URL
export function receiptUrl(path: string): string {
  return supabase.storage.from(RECEIPT_BUCKET).getPublicUrl(path).data.publicUrl;
}

// 영수증 한 장의 "보여줄 주소"를 돌려줍니다.
//  - 새 방식(path 있음) → 공개 URL,  옛 방식(dataUrl) → 그대로 (이관 전 폴백)
export function receiptSrc(r: Receipt): string {
  if (r.path) return receiptUrl(r.path);
  return r.dataUrl ?? "";
}

// 파일 1개를 창고에 올리고, 영수증 정보(Receipt)를 돌려줍니다.
//  - 사진은 용량을 줄여서(리사이즈) 올리고, PDF·기타 파일은 그대로 올립니다.
export async function uploadReceipt(exhibitionId: string, file: File): Promise<Receipt> {
  const id = crypto.randomUUID();
  let blob: Blob;
  let kind: Receipt["kind"];
  let ext: string;
  let contentType: string;

  if (file.type.startsWith("image/")) {
    blob = dataUrlToBlob(await resizeImage(file, 1600));
    kind = "image";
    ext = "jpg";
    contentType = "image/jpeg";
  } else if (file.type === "application/pdf") {
    blob = file;
    kind = "pdf";
    ext = "pdf";
    contentType = "application/pdf";
  } else {
    blob = file;
    kind = "file";
    ext = (file.name.split(".").pop() || "bin").toLowerCase();
    contentType = file.type || "application/octet-stream";
  }

  const path = `${exhibitionId}/${id}.${ext}`;
  const up = await supabase.storage
    .from(RECEIPT_BUCKET)
    .upload(path, blob, { contentType, upsert: true });
  if (up.error) throw new Error("영수증 업로드 실패: " + up.error.message);
  return { name: file.name, kind, path };
}

// 창고에서 영수증 파일 여러 개를 지웁니다 (지출 삭제 시).
export async function deleteReceiptFiles(paths: string[]): Promise<void> {
  const valid = paths.filter(Boolean);
  if (!valid.length) return;
  const { error } = await supabase.storage.from(RECEIPT_BUCKET).remove(valid);
  if (error) console.error("영수증 파일 삭제 실패:", error.message);
}

// 옛 방식(dataUrl로 jsonb에 박혀 있던) 영수증을 창고로 옮깁니다.
//  - 지출 1건에 옛 영수증이 있으면 창고로 올리고, 가벼운(path만) 형태로 다시 저장.
//  - 옮길 게 없으면 그대로 돌려줍니다.
export async function migrateExpenseReceipts(
  exhibitionId: string,
  e: Expense,
): Promise<Expense> {
  const hasLegacy = e.receipts.some((r) => !r.path && r.dataUrl);
  if (!hasLegacy) return e;

  const moved: Receipt[] = [];
  for (const r of e.receipts) {
    if (r.path || !r.dataUrl) {
      moved.push(r);
      continue;
    }
    try {
      const blob = dataUrlToBlob(r.dataUrl);
      const id = crypto.randomUUID();
      const ext = r.kind === "image" ? "jpg" : r.kind === "pdf" ? "pdf" : "bin";
      const path = `${exhibitionId}/${id}.${ext}`;
      const up = await supabase.storage
        .from(RECEIPT_BUCKET)
        .upload(path, blob, { contentType: blob.type || "application/octet-stream", upsert: true });
      if (up.error) throw new Error(up.error.message);
      moved.push({ name: r.name, kind: r.kind, path });
    } catch (err) {
      console.warn("영수증 이관 실패, 원본 유지:", err);
      moved.push(r); // 실패하면 옛 형태 그대로 둠(다음 기회에 재시도)
    }
  }

  const updated = { ...e, receipts: moved };
  await saveExpense(exhibitionId, updated); // 가벼워진 형태로 DB 다시 저장
  return updated;
}
