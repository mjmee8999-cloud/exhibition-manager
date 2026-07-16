// 출장비 정산 — 전시회 출장에 쓴 비용을 항목(섹션)별로 기록/합산하는 데이터 로직입니다.
//  - 실제 정산서처럼 "판촉물 제작 / 쉽먼트 / 항공·숙박 / 현지 비용 / 기타"로 나눠 적어요.
//  - 각 비용에는 영수증 파일(사진·PDF)을 한 장 첨부할 수 있어요.
//  - 전시회별로 expenses:<전시회id> 키에 저장됩니다. (상담일지·사진과 같은 방식)
//  - 통화(원/달러/엔/유로)가 섞일 수 있어서 합계는 통화별로 따로 냅니다.

// 첨부한 영수증 (사진이면 이미지, 아니면 PDF 등)
export type Receipt = {
  name: string; // 원본 파일명
  dataUrl: string; // 파일 내용(데이터 URL)
  kind: "image" | "pdf" | "file"; // 미리보기 방식 구분
};

// 비용 한 건
export type Expense = {
  id: string;
  createdAt: string; // 입력 시각
  date: string; // 지출 날짜 (YYYY-MM-DD)
  category: ExpenseCategory; // 항목(섹션)
  title: string; // 내용 (예: 인천-도쿄 왕복 항공권)
  amount: number; // 금액
  currency: Currency; // 통화
  memo: string; // 비고
  receipts: Receipt[]; // 영수증 첨부 (여러 장 가능, 나중에 추가 가능)
};

// 저장된(예전 형식 포함) 데이터를 최신 형식으로 맞춰줍니다.
//  - 예전엔 영수증이 한 장(receipt)이었어서 배열(receipts)로 변환해요.
export function normalizeExpense(raw: unknown): Expense {
  const r = (raw ?? {}) as Record<string, unknown>;
  const legacy = r.receipt as Receipt | null | undefined;
  const receipts = Array.isArray(r.receipts)
    ? (r.receipts as Receipt[])
    : legacy
      ? [legacy]
      : [];
  return {
    id: String(r.id ?? ""),
    createdAt: String(r.createdAt ?? ""),
    date: String(r.date ?? ""),
    category: (r.category as ExpenseCategory) ?? "etc",
    title: String(r.title ?? ""),
    amount: Number(r.amount) || 0,
    currency: (r.currency as Currency) ?? "KRW",
    memo: String(r.memo ?? ""),
    receipts,
  };
}

// 지출 항목(섹션) 종류 — 정산서 순서대로
export type ExpenseCategory = "promo" | "shipment" | "travel" | "onsite" | "etc";

// 항목 표시용 정보 (아이콘 + 한글 이름 + 안내) — 배열 순서 = 화면에 보이는 섹션 순서
export const CATEGORIES: {
  key: ExpenseCategory;
  label: string;
  icon: string;
  hint: string;
}[] = [
  { key: "promo", label: "판촉물 제작 비용", icon: "📖", hint: "판촉물·소품 제작비" },
  { key: "shipment", label: "쉽먼트 비용", icon: "📦", hint: "전시회 물품 배송비" },
  { key: "travel", label: "항공 및 숙박", icon: "✈️", hint: "항공권·호텔 예약비" },
  { key: "onsite", label: "현지 비용 (소품 구매)", icon: "🛒", hint: "현지 소품 구매·대여" },
  { key: "etc", label: "기타 비용", icon: "📎", hint: "일비·공항 주차비 등" },
];

export function categoryInfo(key: ExpenseCategory) {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
}

// 통화
export type Currency = "KRW" | "USD" | "JPY" | "EUR" | "CNY";

// 통화 표시용 (기호 + 한글 이름 + 소수점 자리)
export const CURRENCIES: { key: Currency; symbol: string; label: string; decimals: number }[] = [
  { key: "KRW", symbol: "₩", label: "원 (KRW)", decimals: 0 },
  { key: "USD", symbol: "$", label: "달러 (USD)", decimals: 2 },
  { key: "JPY", symbol: "¥", label: "엔 (JPY)", decimals: 0 },
  { key: "EUR", symbol: "€", label: "유로 (EUR)", decimals: 2 },
  { key: "CNY", symbol: "元", label: "위안 (CNY)", decimals: 2 },
];

export function currencyInfo(key: Currency) {
  return CURRENCIES.find((c) => c.key === key) ?? CURRENCIES[0];
}

// 금액을 통화 기호와 함께 보기 좋게 (예: ₩1,200,000 / $350.00)
export function formatMoney(amount: number, currency: Currency): string {
  const info = currencyInfo(currency);
  const n = amount.toLocaleString("ko-KR", {
    minimumFractionDigits: info.decimals,
    maximumFractionDigits: info.decimals,
  });
  return `${info.symbol}${n}`;
}

// 여러 통화 합계를 "₩1,200,000 · $350" 한 줄로 (없으면 -)
export function formatTotals(totals: { currency: Currency; total: number }[]): string {
  if (totals.length === 0) return "-";
  return totals.map((t) => formatMoney(t.total, t.currency)).join("  ·  ");
}

// 전시회별 저장 키
export function expenseKey(exhibitionId: string): string {
  return `expenses:${exhibitionId}`;
}

// 통화별 합계 (섞여 있어도 통화별로 따로 더함)
export function totalsByCurrency(items: Expense[]): { currency: Currency; total: number }[] {
  const map = new Map<Currency, number>();
  for (const e of items) {
    map.set(e.currency, (map.get(e.currency) ?? 0) + (Number(e.amount) || 0));
  }
  // CURRENCIES 순서대로 정렬해서 반환
  return CURRENCIES.filter((c) => map.has(c.key)).map((c) => ({
    currency: c.key,
    total: map.get(c.key)!,
  }));
}

// 항목(섹션)별로 묶기 — 비용이 하나라도 있는 섹션만, CATEGORIES 순서대로
export function groupByCategory(items: Expense[]) {
  return CATEGORIES.map((c) => ({
    ...c,
    items: items.filter((e) => e.category === c.key),
  }));
}

// 빈 입력값 (새 비용 폼 초기값)
export function emptyDraft(): Omit<Expense, "id" | "createdAt"> {
  return {
    date: "",
    category: "promo",
    title: "",
    amount: 0,
    currency: "KRW",
    memo: "",
    receipts: [],
  };
}
