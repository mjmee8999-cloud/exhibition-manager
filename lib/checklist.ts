// 전시회 준비 체크리스트의 "기본 항목 목록(템플릿)"입니다.
//  - 사용자가 평소 쓰던 엑셀 체크리스트를 전/중/후 → 섹션(대분류) → 항목으로 정리했어요.
//  - 이 값은 "처음 기본값"이에요. 화면의 수정 모드에서 섹션·항목을 바꾸면
//    바뀐 구성은 localStorage(checklist:structure)에 따로 저장되고, 이 파일은 건드리지 않아요.
//  - id는 체크/비고를 저장하는 열쇠라 한번 정하면 바꾸지 마세요(바꾸면 기존 기록이 풀림).

export type ChecklistItem = {
  id: string;
  label: string;
  note?: string; // 부가 설명(선택)
};

export type ChecklistGroup = {
  id: string; // 섹션 id
  title: string; // 섹션 이름(대분류)
  items: ChecklistItem[];
};

export type ChecklistPhase = {
  key: "before" | "during" | "after";
  label: string;
  emoji: string;
  groups: ChecklistGroup[];
};

export const DEFAULT_CHECKLIST: ChecklistPhase[] = [
  {
    key: "before",
    label: "전시회 전",
    emoji: "📦",
    groups: [
      {
        id: "g-venue-booth",
        title: "부스 신청 · 설치",
        items: [
          { id: "b-booth-apply", label: "부스 신청" },
          { id: "b-booth-invoice", label: "부스 인보이스 결제" },
          { id: "b-booth-rental", label: "부스 소품 렌탈", note: "가구 · 전기 · 조명 · 카펫 · 테이블 · 의자" },
        ],
      },
      {
        id: "g-venue-reg",
        title: "등록 · 홍보",
        items: [
          { id: "b-badge", label: "출입 배지 등록 및 출력" },
          { id: "b-promo", label: "전시회 개최 홍보", note: "초청 URL 메일 발송 · SNS 홍보" },
          { id: "b-site", label: "전시회 사이트 꾸미기", note: "사이트 내 회사 · 부스 정보 입력" },
        ],
      },
      {
        id: "g-venue-prep",
        title: "현장 준비",
        items: [
          { id: "b-script", label: "상담 멘트 준비", note: "세부 멘트 작성" },
          { id: "b-disposal", label: "폐기 절차 알아보기" },
        ],
      },
      {
        id: "g-shipment",
        title: "쉽먼트(운송)",
        items: [
          { id: "b-ship-schedule", label: "포워더에 쉽먼트 일정 문의" },
          { id: "b-ship-list", label: "물품 · 판촉물 리스트 작성", note: "쉽먼트 리스트" },
          { id: "b-ship-receive", label: "현지 수령 방법 · 일정 확인" },
          { id: "b-ship-vehicle", label: "차량 출입 확인" },
        ],
      },
      {
        id: "g-hotel",
        title: "호텔 · 비행기",
        items: [
          { id: "b-hotel", label: "호텔 예약" },
          { id: "b-flight", label: "비행기 예약" },
          { id: "b-insurance", label: "여행자보험 가입", note: "삼성화재 다이렉트 - 표준플랜" },
        ],
      },
      {
        id: "g-promo",
        title: "판촉물 · 소품",
        items: [
          { id: "b-promo-print", label: "판촉물 제작 (팜플렛 · 회사소개서 · 카탈로그)", note: "기획 → 디자인 제작 → 발주 요청" },
          { id: "b-booth-decor", label: "부스 부착물 · 현수막 제작", note: "기획 → 디자인 제작 → 발주 요청" },
          { id: "b-props", label: "전시 소품 준비" },
        ],
      },
      {
        id: "g-reserve",
        title: "그 외 예약",
        items: [
          { id: "b-transport", label: "현장 교통편 예약", note: "공항 리무진 등" },
          { id: "b-restaurant", label: "식당 예약" },
          { id: "b-exchange", label: "환전" },
        ],
      },
      {
        id: "g-approval",
        title: "결재",
        items: [
          { id: "b-approval-trip", label: "업무출장신청 작성" },
          { id: "b-approval-expense", label: "출장 일비 지급 지출 요청 작성" },
        ],
      },
      {
        id: "g-supplies",
        title: "준비물",
        items: [
          {
            id: "b-supplies",
            label: "사내 준비물 챙기기",
            note: "노트북 · 충전기 · 모니터 · 종이 상담일지 · 출입 배지",
          },
        ],
      },
    ],
  },
  {
    key: "during",
    label: "전시회 중",
    emoji: "📝",
    groups: [
      {
        id: "g-during-setup",
        title: "현장 세팅",
        items: [
          { id: "d-shipment", label: "전시회 Shipment 수령" },
          { id: "d-decor", label: "부스 꾸미기" },
          { id: "d-buy-props", label: "소품 구매" },
        ],
      },
      {
        id: "g-during-record",
        title: "상담 · 기록",
        items: [
          { id: "d-consult", label: "상담일지 정리" },
          { id: "d-photo", label: "부스 사진 촬영" },
          { id: "d-competitor", label: "경쟁 업체 조사" },
        ],
      },
      {
        id: "g-during-etc",
        title: "기타 업무",
        items: [{ id: "d-routine", label: "개인 루틴 업무 수행" }],
      },
    ],
  },
  {
    key: "after",
    label: "전시회 후",
    emoji: "📊",
    groups: [
      {
        id: "g-after",
        title: "마무리",
        items: [
          { id: "a-consult", label: "상담일지 정리" },
          { id: "a-followup", label: "팔로우업 메일 송부" },
          { id: "a-expense", label: "출장경비보고서 작성" },
        ],
      },
    ],
  },
];
