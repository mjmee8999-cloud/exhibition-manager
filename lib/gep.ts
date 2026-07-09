// GEP(글로벌 전시 플랫폼) 해외전시회 데이터 관련 공통 타입·상수입니다.
// 데이터 출처: 공공데이터포털 "대한무역투자진흥공사_해외전시회 개최 정보"(무료, 연 1회 갱신).

// GEP 전시회 한 건의 형태 (API가 돌려주는 컬럼)
export type GepExhibition = {
  해외전시회명: string;
  개최국가명: string;
  개최도시명: string;
  전시장명: string;
  개최시작예정일자: string;
  개최종료예정일자: string;
  개최예정연도: number;
  개최주기: string;
  산업분야: string;
  산업분야수: number;
  참가기업수: number;
  참가업체수: number;
  참관인수: number;
  참가국가수: number;
  개별참가업체수: number;
  협약수행기관수: number;
  담당무역관: string;
};

// 국가 선택 목록 (데이터에 많이 나오는 순서). 값은 데이터의 국가명과 정확히 일치해야 함.
export const GEP_COUNTRIES = [
  "미국", "중국", "일본", "독일", "이탈리아", "캐나다", "러시아", "프랑스", "영국",
  "베트남", "홍콩", "인도", "브라질", "아랍에미리트", "말레이시아", "폴란드", "호주",
  "스페인", "멕시코", "싱가포르", "스위스", "인도네시아", "체코", "태국", "오스트리아",
  "대만 (타이완)", "카자흐스탄", "네덜란드", "덴마크", "우즈베키스탄", "아르헨티나",
  "그리스", "튀르키예", "사우디아라비아", "이집트", "핀란드", "필리핀", "스웨덴",
  "벨기에", "뉴질랜드", "남아공",
];

// 산업분야 선택 목록. label=화면표시, q=검색어(부분일치용 안전한 키워드)
export const GEP_INDUSTRIES: Array<{ label: string; q: string }> = [
  { label: "기계 · 장비", q: "기계" },
  { label: "식품 · 음료", q: "식품" },
  { label: "건축 · 기자재", q: "건축" },
  { label: "생활용품 · 가구", q: "생활용품" },
  { label: "뷰티 · 미용용품", q: "뷰티" },
  { label: "패션 · 섬유", q: "패션" },
  { label: "정보통신기술(IT) · S/W", q: "정보통신" },
  { label: "레저 · 관광", q: "레저" },
  { label: "건강 · 스포츠", q: "건강" },
  { label: "의료 · 제약", q: "의료" },
  { label: "문구 · 선물", q: "문구" },
  { label: "자동차", q: "자동차" },
  { label: "전력 · 에너지", q: "전력" },
  { label: "문화콘텐츠 · 미디어", q: "문화콘텐츠" },
  { label: "전기전자 · 반도체", q: "전기전자" },
  { label: "농수산 · 임업", q: "농수산" },
  { label: "금융 · 비즈니스서비스", q: "금융" },
  { label: "쥬얼리", q: "쥬얼리" },
  { label: "유아 · 아동 · 교육", q: "유아" },
  { label: "환경 · 폐기물", q: "환경" },
  { label: "바이오", q: "바이오" },
  { label: "화학 · 나노", q: "화학" },
  { label: "물류 · 운송", q: "물류" },
  { label: "금속 · 광물", q: "금속" },
  { label: "유리 · 광학", q: "유리" },
  { label: "방위산업", q: "방위" },
  { label: "조선 · 플랜트", q: "조선" },
  { label: "동물 · 애완용품", q: "동물" },
  { label: "항공 · 우주", q: "항공" },
];

// 연도 선택 목록 (다가오는 전시회 중심)
export const GEP_YEARS = [2026, 2027, 2028, 2025, 2024];

// ── HOMEDANT 중요도 산정 ────────────────────────────────
// 홈던트(수납·선반·행거·정리용품) 사업과의 "적합도 + 규모"로 각 전시회에 점수를 매깁니다.
// 규칙 기반이라 AI 없이 즉시·무료로 계산되고, 근거(reasons)를 함께 돌려줘 투명해요.

// 산업분야 적합도 가중치 (산업분야 문자열에 q가 포함되면 weight 만큼 가산)
export const HOMEDANT_INDUSTRY_WEIGHTS = [
  { q: "생활용품", label: "생활용품·가구", weight: 50 }, // 최상: 홈던트 핵심
  { q: "건축", label: "건축·기자재", weight: 30 }, // 상: 선반/철물 채널
  { q: "물류", label: "물류·운송", weight: 15 }, // 하: 창고 수납 연관
  { q: "기계", label: "기계·장비", weight: 15 }, // 하: 산업용 랙 일부
];

// 전시회명에 들어가면 강한 신호가 되는 키워드 (개당 +8, 최대 +24)
export const HOMEDANT_NAME_KEYWORDS = [
  "수납", "선반", "정리", "하드웨어", "홈", "가구", "인테리어", "리빙", "주방", "철물",
  "storage", "shelf", "shelving", "rack", "hardware", "home", "furniture", "kitchen",
];

export type ScoredExhibition = GepExhibition & {
  score: number;
  grade: "" | "A" | "B" | "C";
  reasons: string[]; // 점수 근거(사람이 읽는 문장)
};

// 전시회 한 건의 홈던트 중요도 점수를 계산합니다.
export function scoreExhibition(ex: GepExhibition): ScoredExhibition {
  let score = 0;
  const reasons: string[] = [];

  // 1) 산업분야 적합도
  const industryText = ex.산업분야 ?? "";
  for (const w of HOMEDANT_INDUSTRY_WEIGHTS) {
    if (industryText.includes(w.q)) {
      score += w.weight;
      reasons.push(`${w.label} +${w.weight}`);
    }
  }

  // 2) 전시회명 키워드 가점 (최대 +24)
  const name = ex.해외전시회명 ?? "";
  const lower = name.toLowerCase();
  const hits: string[] = [];
  for (const kw of HOMEDANT_NAME_KEYWORDS) {
    const isEng = /[a-z]/.test(kw);
    if (isEng ? lower.includes(kw) : name.includes(kw)) hits.push(kw);
  }
  const kwBonus = Math.min(hits.length * 8, 24);
  if (kwBonus > 0) {
    score += kwBonus;
    reasons.push(`이름 키워드(${hits.slice(0, 3).join(", ")}) +${kwBonus}`);
  }

  // 3) 규모 가점 (데이터가 있을 때만 — 값이 0이면 미반영)
  if (ex.참가업체수 >= 500) {
    score += 15;
    reasons.push("대형(참가업체 500+) +15");
  } else if (ex.참가업체수 >= 200) {
    score += 10;
    reasons.push("참가업체 200+ +10");
  } else if (ex.참가업체수 >= 50) {
    score += 5;
    reasons.push("참가업체 50+ +5");
  }
  if (ex.참관인수 >= 50000) {
    score += 15;
    reasons.push("참관객 5만+ +15");
  } else if (ex.참관인수 >= 10000) {
    score += 10;
    reasons.push("참관객 1만+ +10");
  } else if (ex.참관인수 >= 1000) {
    score += 5;
    reasons.push("참관객 1천+ +5");
  }
  if (ex.참가국가수 >= 20) {
    score += 5;
    reasons.push("20개국+ 참가 +5");
  } else if (ex.참가국가수 >= 10) {
    score += 3;
    reasons.push("10개국+ 참가 +3");
  }

  let grade: "" | "A" | "B" | "C" = "";
  if (score >= 45) grade = "A";
  else if (score >= 20) grade = "B";
  else if (score >= 1) grade = "C";

  return { ...ex, score, grade, reasons };
}
