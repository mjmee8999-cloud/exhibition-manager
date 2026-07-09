// 전시회 관리 프로그램의 전체 메뉴 구조를 이 파일 하나에서 관리합니다.
// 메뉴를 추가/수정/순서변경하려면 여기만 고치면 왼쪽 사이드바에 자동으로 반영됩니다.

export type Feature = {
  title: string; // 기능 이름
  desc: string; // 한 줄 설명
  href: string; // 이동할 주소 (app 폴더 구조와 일치해야 함)
};

export type Phase = {
  key: string; // 단계 구분용 값
  label: string; // 화면에 보이는 단계 이름
  emoji: string; // 단계 아이콘
  features: Feature[]; // 이 단계에 속한 기능들
};

export const phases: Phase[] = [
  {
    key: "before",
    label: "전시회 전",
    emoji: "📦",
    features: [
      { title: "체크리스트", desc: "전시회 준비 할 일 체크", href: "/before/checklist" },
      { title: "부스 시뮬레이션", desc: "부스 배치 시뮬레이션", href: "/before/booth" },
      { title: "전시품목Shipment", desc: "품목 · BOM · 선적서류", href: "/before/shipment" },
    ],
  },
  {
    key: "during",
    label: "전시회 중",
    emoji: "📝",
    features: [
      { title: "상담일지 작성", desc: "현장 상담 기록 · 명함 저장", href: "/during/consultation" },
    ],
  },
  {
    key: "after",
    label: "전시회 후",
    emoji: "📊",
    features: [
      { title: "명함 및 상담일지 정리", desc: "명함 · 상담 내용 정리", href: "/after/organize" },
      { title: "실적 대시보드", desc: "전시회 성과 한눈에 보기", href: "/after/dashboard" },
      { title: "후속 대응 자료", desc: "사후 팔로업 자료 준비", href: "/after/followup" },
    ],
  },
];
