// 엑셀(.xlsx) 표를 "깔끔한 표 디자인"으로 꾸미는 공용 함수입니다.
//  - 제목행(맨 윗줄): 굵게 + 파란 배경 + 흰 글씨 + 가운데정렬
//  - 나머지 줄: 얇은 테두리 + 짝수 줄 옅은 회색(지브라)
//  xlsx-js-style 로 만든 워크시트(ws)에 셀별 스타일(.s)을 입혀 줍니다.

// json_to_sheet 로 만든 워크시트를 그대로 받습니다(셀은 { v, t, s? } 형태).
type Cell = { s?: Record<string, unknown> };
type Worksheet = Record<string, unknown> & { "!ref"?: string; "!rows"?: unknown[] };

// XLSX.utils 중 우리가 쓰는 함수만 최소로 명시
type Utils = {
  decode_range(ref: string): { s: { r: number; c: number }; e: { r: number; c: number } };
  encode_cell(addr: { r: number; c: number }): string;
};

export function styleTableSheet(
  utils: Utils,
  ws: Worksheet,
  opts?: { headerColor?: string },
): void {
  const ref = ws["!ref"];
  if (!ref) return;
  const headerColor = opts?.headerColor ?? "2D6CDF"; // 파란색
  const range = utils.decode_range(ref);
  const thin = { style: "thin", color: { rgb: "D0D5DD" } };
  const border = { top: thin, bottom: thin, left: thin, right: thin };

  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = utils.encode_cell({ r: R, c: C });
      const cell = ws[addr] as Cell | undefined;
      if (!cell) continue;
      if (R === 0) {
        cell.s = {
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
          fill: { fgColor: { rgb: headerColor } },
          alignment: { horizontal: "center", vertical: "center" },
          border,
        };
      } else {
        cell.s = {
          border,
          alignment: { horizontal: "center", vertical: "center" },
          ...(R % 2 === 1 ? {} : { fill: { fgColor: { rgb: "F5F7FA" } } }),
        };
      }
    }
  }

  // 제목행 높이 살짝 키우기
  const rows = (ws["!rows"] as { hpt?: number }[] | undefined) ?? [];
  rows[0] = { hpt: 20 };
  ws["!rows"] = rows;
}
