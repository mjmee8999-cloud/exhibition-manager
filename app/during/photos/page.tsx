"use client";

// 전시회 현장 사진 기록 화면입니다.
//  - 부스 · 전시장 · 경쟁사 등 현장 사진을 전시회별로 모아둡니다.
//  - 사진 파일은 Supabase Storage(사진 창고)에 올리고, 정보는 DB에 저장됩니다.
//    → 어느 PC에서 열어도 같은 사진이 보여요(모두 공유).
//  - 사진마다 간단한 설명(메모)을 달 수 있고, 눌러서 크게 볼 수 있어요.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useExhibitions } from "@/components/ExhibitionProvider";
import { formatDate, resizeImage } from "@/lib/consultation";
import {
  listPhotos,
  uploadPhoto,
  updatePhotoCaption,
  deletePhoto,
  type PhotoRecord,
} from "@/lib/photoStore";

// 데이터 URL(사진을 글자로 바꾼 것) → 진짜 파일(Blob)로 변환합니다. 업로드할 때 필요해요.
function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(",");
  const mime = head.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bin = atob(body);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export default function PhotosPage() {
  const { selected } = useExhibitions();
  const exId = selected?.id ?? null;

  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [busy, setBusy] = useState(false); // 업로드/이관 처리 중 표시
  const [viewer, setViewer] = useState<PhotoRecord | null>(null); // 크게 보기 대상
  const fileRef = useRef<HTMLInputElement>(null);

  // 사진 목록 불러오기 (전시회 바뀌면 다시) — DB에서, 예전 localStorage 사진은 자동 이관
  useEffect(() => {
    if (!exId) {
      setPhotos([]);
      return;
    }
    let cancelled = false;
    (async () => {
      let list = await listPhotos(exId);
      // DB가 비었는데 예전 브라우저(localStorage) 사진이 있으면 이번에 한 번 Storage로 옮김
      if (list.length === 0) {
        const legacy = localStorage.getItem(`photos:${exId}`);
        if (legacy) {
          try {
            const old = JSON.parse(legacy) as {
              id: string;
              createdAt: string;
              image: string;
              caption?: string;
            }[];
            if (old.length) {
              setBusy(true);
              const migrated: PhotoRecord[] = [];
              for (const o of old) {
                try {
                  const rec = await uploadPhoto(exId, {
                    id: o.id,
                    blob: dataUrlToBlob(o.image),
                    caption: o.caption ?? "",
                    createdAt: o.createdAt,
                  });
                  migrated.push(rec);
                } catch (e) {
                  console.warn("사진 이관 실패:", e);
                }
              }
              migrated.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
              list = migrated;
              if (!cancelled) setBusy(false);
            }
          } catch {
            /* 못 읽는 옛 자료는 건너뜀 */
          }
        }
      }
      if (!cancelled) setPhotos(list);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exId]);

  // 사진 여러 장 업로드 (각각 리사이즈해서 Storage에 올림)
  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0 || !exId) return;
    setBusy(true);
    const added: PhotoRecord[] = [];
    for (const file of Array.from(files)) {
      try {
        const dataUrl = await resizeImage(file, 1400);
        const rec = await uploadPhoto(exId, {
          id: crypto.randomUUID(),
          blob: dataUrlToBlob(dataUrl),
          caption: "",
          createdAt: new Date().toISOString(),
        });
        added.push(rec);
      } catch (e) {
        console.warn("사진 업로드 실패:", e);
      }
    }
    if (added.length) setPhotos((prev) => [...added, ...prev]); // 최신 사진이 앞에 오도록
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleDelete(id: string) {
    if (!confirm("이 사진을 삭제할까요? 되돌릴 수 없어요.")) return;
    const target = photos.find((p) => p.id === id);
    setPhotos((prev) => prev.filter((p) => p.id !== id)); // 화면 먼저
    if (target) deletePhoto(id, target.path); // 뒤에서 Storage+DB 삭제
    if (viewer?.id === id) setViewer(null);
  }

  function handleCaption(id: string, caption: string) {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, caption } : p))); // 화면 먼저
    updatePhotoCaption(id, caption); // 뒤에서 DB 저장
    setViewer((v) => (v && v.id === id ? { ...v, caption } : v));
  }

  // 사진 한 장을 내 컴퓨터로 다운로드 (파일명 = 전시회명_설명 또는 날짜)
  async function handleDownload(p: PhotoRecord) {
    const base = (p.caption || formatDate(p.createdAt) || "현장사진")
      .replace(/[\\/:*?"<>|]+/g, "_") // 파일명에 못 쓰는 문자 제거
      .slice(0, 40);
    const filename = `${selected?.name ?? "전시회"}_${base}.jpg`;
    try {
      // 공개 URL 사진을 파일로 받아서 원하는 이름으로 저장
      const res = await fetch(p.image);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(p.image, "_blank"); // 폴백: 새 탭으로 열기
    }
  }

  // 올린 사진 전부 다운로드 (한 장씩 순서대로 저장)
  function handleDownloadAll() {
    photos.forEach((p, i) => {
      setTimeout(() => handleDownload(p), i * 400); // 브라우저가 막지 않도록 약간 간격
    });
  }

  // 전시회 미선택 안내
  if (!selected) {
    return (
      <main className="w-full px-8 py-8">
        <h1 className="text-3xl font-bold">현장 사진</h1>
        <div className="mt-8 max-w-2xl rounded-3xl border border-dashed border-black/15 bg-black/[0.02] p-12 text-center dark:border-white/15 dark:bg-white/[0.03]">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            먼저 왼쪽에서 <b>전시회를 선택</b>해 주세요.
          </p>
          <Link
            href="/exhibitions"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
          >
            ＋ 전시회 등록 / 선택
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full px-8 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">현장 사진</h1>
        <div className="flex flex-wrap gap-2">
          {photos.length > 0 && (
            <button
              type="button"
              onClick={handleDownloadAll}
              className="rounded-xl border border-blue-300 px-5 py-2.5 text-base font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/30"
            >
              ⬇ 전체 저장
            </button>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "올리는 중..." : "＋ 사진 추가"}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {/* 전시회 배너 + 장수 */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-blue-50 px-5 py-3.5 text-base dark:bg-blue-950/40">
        <span className="font-semibold">{selected.name}</span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {selected.country}
          {selected.city ? ` · ${selected.city}` : ""}
        </span>
        <span className="ml-auto font-medium text-blue-700 dark:text-blue-300">총 {photos.length}장</span>
      </div>

      <p className="mt-3 text-sm text-zinc-500">
        💡 여러 장을 한 번에 올릴 수 있어요. 사진을 누르면 크게 보이고, 설명을 달 수 있어요.
      </p>

      {photos.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-black/15 bg-black/[0.02] p-12 text-center dark:border-white/15 dark:bg-white/[0.03]">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">아직 올린 현장 사진이 없어요.</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
          >
            ＋ 첫 사진 올리기
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <div
              key={p.id}
              className="group overflow-hidden rounded-2xl border border-black/10 dark:border-white/10"
            >
              <button
                type="button"
                onClick={() => setViewer(p)}
                className="block w-full"
                aria-label="사진 크게 보기"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image}
                  alt={p.caption || "현장 사진"}
                  className="aspect-square w-full object-cover transition group-hover:opacity-90"
                />
              </button>
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="truncate text-xs text-zinc-500">
                  {p.caption || formatDate(p.createdAt)}
                </span>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => handleDownload(p)}
                    className="rounded-lg border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/30"
                  >
                    ⬇ 저장
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="rounded-lg border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 크게 보기 창 ── */}
      {viewer && (
        <div
          onClick={() => setViewer(null)}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="my-4 w-full max-w-3xl rounded-3xl bg-white p-4 shadow-2xl dark:bg-zinc-950 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">{formatDate(viewer.createdAt)}</span>
              <button
                type="button"
                onClick={() => setViewer(null)}
                className="rounded-full px-3 py-1 text-2xl text-zinc-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewer.image}
                alt={viewer.caption || "현장 사진"}
                className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain"
              />
            </div>
            <input
              type="text"
              value={viewer.caption}
              onChange={(e) => handleCaption(viewer.id, e.target.value)}
              placeholder="사진 설명을 입력하세요 (예: 우리 부스 정면, 경쟁사 A 신제품)"
              className="mt-4 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base dark:border-white/15 dark:bg-zinc-900"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleDownload(viewer)}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                ⬇ 다운로드
              </button>
              <button
                type="button"
                onClick={() => handleDelete(viewer.id)}
                className="rounded-xl border border-red-300 px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
              >
                🗑 이 사진 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
