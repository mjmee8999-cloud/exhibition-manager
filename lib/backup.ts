// 내 자료(전시회 + 상담일지)를 파일로 백업하고, 다시 불러오는 기능입니다.
//  - 자료는 지금 쓰는 브라우저(localStorage)에만 있어서, 다른 컴퓨터에서는 비어 있어요.
//  - "백업"으로 파일 하나를 내려받아 두면, 다른 컴퓨터에서 "불러오기"로 그대로 복원할 수 있어요.
//    (보고·시연에 유용하고, 자료를 안전하게 보관하는 용도로도 좋아요.)

import type { Exhibition } from "@/components/ExhibitionProvider";
import type { Consultation } from "@/lib/consultation";

// 백업 파일 하나에 담기는 내용
type Backup = {
  version: 1;
  exportedAt: string;
  selectedId: string | null;
  exhibitions: Exhibition[];
  consultations: Record<string, Consultation[]>; // 키: 전시회 id
};

// 지금 브라우저에 저장된 자료를 한데 모읍니다.
function collectBackup(): Backup {
  const exhibitions: Exhibition[] = JSON.parse(localStorage.getItem("exhibitions") || "[]");
  const consultations: Record<string, Consultation[]> = {};
  for (const ex of exhibitions) {
    const raw = localStorage.getItem(`consultations:${ex.id}`);
    if (raw) consultations[ex.id] = JSON.parse(raw);
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    selectedId: localStorage.getItem("selectedExhibitionId"),
    exhibitions,
    consultations,
  };
}

// 내 자료를 JSON 파일로 내려받습니다.
export function exportBackup() {
  const data = collectBackup();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const today = data.exportedAt.slice(0, 10);
  a.href = url;
  a.download = `전시회자료_백업_${today}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// 백업 파일을 읽어 브라우저에 복원합니다. (기존 자료에 합치고, 같은 전시회는 파일 내용으로 갱신)
export function importBackup(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read-fail"));
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as Backup;
        if (!Array.isArray(data.exhibitions)) throw new Error("bad-format");

        // 전시회: 기존 목록에 합치되, 같은 id는 백업 내용으로 덮어씁니다.
        const current: Exhibition[] = JSON.parse(localStorage.getItem("exhibitions") || "[]");
        const map = new Map(current.map((e) => [e.id, e]));
        for (const ex of data.exhibitions) map.set(ex.id, ex);
        localStorage.setItem("exhibitions", JSON.stringify([...map.values()]));

        // 상담일지: 전시회별로 통째로 복원합니다.
        for (const [id, list] of Object.entries(data.consultations || {})) {
          localStorage.setItem(`consultations:${id}`, JSON.stringify(list));
        }

        if (data.selectedId) localStorage.setItem("selectedExhibitionId", data.selectedId);
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
}
