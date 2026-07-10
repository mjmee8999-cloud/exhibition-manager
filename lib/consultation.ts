// 상담일지 관련 공통 데이터·타입·헬퍼입니다.
// "상담일지 작성"(during/consultation)과 "정리"(after/organize) 두 화면이 함께 씁니다.
// 항목(품목·문의내용 등)을 바꾸려면 여기만 고치면 두 화면에 동시에 반영돼요.

// A/B/C 등급 (중요도·관심도)
export type Grade = "" | "A" | "B" | "C";

// 상담일지 한 건의 정보 형태
export type Consultation = {
  id: string;
  createdAt: string;
  cardImage: string;
  // 고객 정보 (명함에서 AI 자동 인식)
  company: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  // 업체 정보 (직접 입력 또는 AI 자동 조회)
  companyType: string; // 업체 유형 (아래 COMPANY_TYPES 중 하나)
  companyTypeDetail: string; // 업체 유형 상세 (예: 제조사 → "선반제조")
  salesChannels: string[];
  salesChannelEtc: string;
  homepage: string;
  revenue: string;
  // 관심 품목
  interests: string[];
  interestEtc: string;
  // 문의 내용
  inquiries: string[];
  inquiryEtc: string;
  // 중요도 / 관심도 (각각 A/B/C)
  importance: Grade;
  interestLevel: Grade;
  // 상담 메모
  memo: string;
};

// 화면 입력값 형태 (id·저장시각·명함이미지는 별도 관리)
export type FormState = Omit<Consultation, "id" | "createdAt" | "cardImage">;

// 여러 항목을 고르는 체크박스 필드 이름들
export type ListField = "salesChannels" | "interests" | "inquiries";

// 업체 유형 후보 (하나만 선택)
export const COMPANY_TYPES = [
  "홈센터",
  "가구점",
  "생활용품점",
  "제조사",
  "건설·인테리어업체",
  "서비스업체",
  "일반고객",
  "기타",
];

// 판매 채널 후보
export const SALES_CHANNELS = ["EC몰", "오프라인 매장", "도매"];

// 관심 품목 목록
export const PRODUCTS = [
  "스탠다드 선반",
  "바퀴 선반",
  "행거",
  "트롤리",
  "하단오픈형",
  "연결형",
  "서랍형",
  "코너형",
  "캐비닛형",
  "타공선반",
  "Max200",
  "Max300",
];

// 문의 내용 — 분류별로 묶음
export const INQUIRY_GROUPS = [
  {
    label: "제품 스펙",
    items: ["사이즈", "색상", "내하중", "소재", "인증/안전", "조립 방법", "커스터마이즈 방법", "파츠 구성"],
  },
  { label: "회사 정보", items: ["생산국", "실적", "회사 위치"] },
  { label: "거래조건", items: ["가격", "MOQ", "OEM 가능 여부"] },
];

// 빈 입력값
export const EMPTY_FORM: FormState = {
  company: "",
  name: "",
  title: "",
  email: "",
  phone: "",
  companyType: "",
  companyTypeDetail: "",
  salesChannels: [],
  salesChannelEtc: "",
  homepage: "",
  revenue: "",
  interests: [],
  interestEtc: "",
  inquiries: [],
  inquiryEtc: "",
  importance: "",
  interestLevel: "",
  memo: "",
};

// 하나의 상담일지에서 입력값(FormState) 부분만 뽑아냅니다.
export function toFormState(c: Consultation): FormState {
  const { id: _id, createdAt: _createdAt, cardImage: _cardImage, ...rest } = c;
  void _id;
  void _createdAt;
  void _cardImage;
  return rest;
}

// 여러 항목 + 기타를 한 줄 텍스트로 합칩니다. (예: "EC몰, 도매, 기타: 백화점")
export function joinList(items: string[] | undefined, etc: string | undefined): string {
  const list = [...(items ?? [])];
  if (etc && etc.trim()) list.push(`기타: ${etc.trim()}`);
  return list.join(", ");
}

// 저장 시각을 보기 좋게 (예: 2026-07-09 14:30)
export function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 사진을 지정한 최대 크기로 줄여서 데이터 URL(JPEG)로 만듭니다. (브라우저에서만 동작)
export function resizeImage(file: File, maxDim: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read-fail"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("image-fail"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("no-canvas"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
