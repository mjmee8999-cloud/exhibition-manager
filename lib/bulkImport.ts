// 엑셀(리드 명단)을 상담일지 여러 건으로 바꾸는 공통 로직입니다.
//  - AI(또는 사용자가 직접 고른) "열 짝(매칭)"을 받아, 각 행을 상담일지 입력값(FormState)으로 변환합니다.
//  - 화면(BulkImportCard)과 분리해 두어 로직을 알아보기 쉽게 했습니다.

import { EMPTY_FORM, type FormState } from "./consultation";

// 우리 항목 ↔ 엑셀 열 제목 짝. 값은 "엑셀 헤더(열 제목) 문자열"입니다.
//  - name 은 성/이름이 나뉜 경우를 위해 여러 열을 이어붙일 수 있어 배열입니다.
//  - memoColumns 는 상담 메모에 "제목: 값" 형태로 함께 남길 참고 열들입니다.
export type ColumnMapping = {
  company: string;
  name: string[];
  title: string;
  email: string;
  phone: string;
  homepage: string;
  revenue: string;
  consultDate: string; // 상담 일자 열 (있으면 그 날짜로, 없으면 저장 화면에서 오늘로 채움)
  memoColumns: string[];
};

export const EMPTY_MAPPING: ColumnMapping = {
  company: "",
  name: [],
  title: "",
  email: "",
  phone: "",
  homepage: "",
  revenue: "",
  consultDate: "",
  memoColumns: [],
};

const pad = (n: number) => String(n).padStart(2, "0");

// 엑셀에 적힌 여러 형태의 날짜를 상담일지 형식(YYYY-MM-DD)으로 바꿉니다.
//  - "2026-08-03", "2026.8.3", "2026/08/03"      → 그대로 (연-월-일)
//  - "08/03/2026", "8/3/2026 3:19pm"             → 미국식(월/일/연)으로 해석
//  - 엑셀 날짜 일련번호(예: 46235)               → 실제 날짜로 변환
//  - 그 외에는 최대한 해석, 안 되면 빈 문자열     → (저장 시 오늘 날짜로 채움)
export function toYmd(raw: string): string {
  const s = (raw ?? "").trim();
  if (!s) return "";

  // 연-월-일 (연도가 먼저)
  let m = /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/.exec(s);
  if (m) return `${m[1]}-${pad(Number(m[2]))}-${pad(Number(m[3]))}`;

  // 월/일/연 (미국식, 연도가 뒤)
  m = /^(\d{1,2})[-./](\d{1,2})[-./](\d{4})/.exec(s);
  if (m) return `${m[3]}-${pad(Number(m[1]))}-${pad(Number(m[2]))}`;

  // 엑셀 날짜 일련번호 (1899-12-30 기준 경과일수)
  if (/^\d+(\.\d+)?$/.test(s)) {
    const serial = parseFloat(s);
    if (serial > 20000 && serial < 90000) {
      const d = new Date(Date.UTC(1899, 11, 30) + Math.round(serial) * 86400000);
      if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
    return "";
  }

  // 마지막 시도: 브라우저 날짜 해석에 맡김
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  return "";
}

// 웹사이트 칸 값에서 실제 주소만 뽑습니다. (예: "Company Website: https://a.com" → "https://a.com")
function cleanHomepage(raw: string): string {
  const m = /(https?:\/\/\S+)/i.exec(raw);
  return m ? m[1] : raw;
}

// 한 행(row)에서 특정 열 제목(header)의 값을 꺼냅니다. (없으면 빈 문자열)
function cellValue(headers: string[], row: string[], header: string): string {
  if (!header) return "";
  const i = headers.indexOf(header);
  if (i < 0) return "";
  return String(row[i] ?? "").trim();
}

// 엑셀 데이터 행들을 상담일지 입력값(FormState) 목록으로 변환합니다.
//  - consultDate 는 여기서 비워 두고, 저장하는 화면에서 오늘 날짜로 채웁니다.
//  - 회사·담당자·이메일 셋 다 비어 있는 행은 (빈 줄로 보고) 건너뜁니다.
export function rowsToForms(
  headers: string[],
  rows: string[][],
  mapping: ColumnMapping,
): FormState[] {
  const forms: FormState[] = [];

  for (const row of rows) {
    const company = cellValue(headers, row, mapping.company);
    const name = mapping.name
      .map((h) => cellValue(headers, row, h))
      .filter(Boolean)
      .join(" ");
    const email = cellValue(headers, row, mapping.email);

    // 알맹이가 하나도 없는 행은 건너뜁니다.
    if (!company && !name && !email) continue;

    const homepage = cleanHomepage(cellValue(headers, row, mapping.homepage));

    // 참고 열들을 "제목: 값" 여러 줄로 묶어 상담 메모에 남깁니다.
    const memo = mapping.memoColumns
      .map((h) => {
        const v = cellValue(headers, row, h);
        return v ? `${h}: ${v}` : "";
      })
      .filter(Boolean)
      .join("\n");

    forms.push({
      ...EMPTY_FORM,
      // 상담 일자 열을 지정했으면 그 날짜를, 아니면 빈 값(저장 화면에서 오늘로 채움)
      consultDate: mapping.consultDate ? toYmd(cellValue(headers, row, mapping.consultDate)) : "",
      company,
      name,
      title: cellValue(headers, row, mapping.title),
      email,
      phone: cellValue(headers, row, mapping.phone),
      homepage,
      revenue: cellValue(headers, row, mapping.revenue),
      memo,
    });
  }

  return forms;
}

// 미리보기 표에서 실제로 몇 명이 들어갈지 세기 위한 함수입니다. (빈 행 제외)
export function countImportable(
  headers: string[],
  rows: string[][],
  mapping: ColumnMapping,
): number {
  return rowsToForms(headers, rows, mapping).length;
}
