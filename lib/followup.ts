// 전시회 후 "팔로업 메일"을 만드는 공통 헬퍼입니다.
// - AI 없이도 쓸 수 있는 "고정 양식"(buildTemplate)을 언어별(영어/일본어/한국어)로 제공합니다.
// - AI 맞춤 초안은 /api/draft-followup 에서 따로 생성하고, 실패하면 이 양식으로 대신 씁니다.

import type { Consultation } from "./consultation";
import { joinList } from "./consultation";

// 전시회 정보 중 메일에 필요한 부분만 (components/ExhibitionProvider.tsx 의 Exhibition 과 호환)
export type FollowupExhibition = {
  name: string;
  startDate: string;
  endDate: string;
  country: string;
  city: string;
};

// 메일 언어
export type Lang = "en" | "ja" | "ko";

// 화면 선택용 언어 목록
export const LANGS: { value: Lang; label: string }[] = [
  { value: "en", label: "영어" },
  { value: "ja", label: "일본어" },
  { value: "ko", label: "한국어" },
];

// 국가명으로 기본 언어를 추천합니다. (일본이면 일본어, 그 외엔 영어 기본)
export function pickLang(country: string): Lang {
  const c = (country || "").toLowerCase();
  if (c.includes("일본") || c.includes("japan") || c.includes("jp")) return "ja";
  return "en";
}

// "YYYY-MM-DD ~ YYYY-MM-DD" 를 언어에 맞게 보기 좋게 만듭니다.
function formatRange(start: string, end: string, lang: Lang): string {
  const parse = (s: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    if (!m) return null;
    return { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]) };
  };
  const a = parse(start);
  const b = parse(end);
  if (!a) return "";
  const EN_MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  if (lang === "en") {
    if (b && (a.y !== b.y || a.mo !== b.mo || a.d !== b.d)) {
      if (a.y === b.y && a.mo === b.mo) return `${EN_MONTHS[a.mo - 1]} ${a.d}–${b.d}, ${a.y}`;
      return `${EN_MONTHS[a.mo - 1]} ${a.d}, ${a.y} – ${EN_MONTHS[b.mo - 1]} ${b.d}, ${b.y}`;
    }
    return `${EN_MONTHS[a.mo - 1]} ${a.d}, ${a.y}`;
  }
  if (lang === "ja") {
    if (b && (a.y !== b.y || a.mo !== b.mo || a.d !== b.d)) {
      if (a.y === b.y && a.mo === b.mo) return `${a.y}年${a.mo}月${a.d}〜${b.d}日`;
      return `${a.y}年${a.mo}月${a.d}日〜${b.y}年${b.mo}月${b.d}日`;
    }
    return `${a.y}年${a.mo}月${a.d}日`;
  }
  // ko
  if (b && (a.y !== b.y || a.mo !== b.mo || a.d !== b.d)) {
    if (a.y === b.y && a.mo === b.mo) return `${a.y}년 ${a.mo}월 ${a.d}~${b.d}일`;
    return `${a.y}년 ${a.mo}월 ${a.d}일 ~ ${b.y}년 ${b.mo}월 ${b.d}일`;
  }
  return `${a.y}년 ${a.mo}월 ${a.d}일`;
}

// 여러 줄을 합칠 때 빈 줄(빈 문자열)은 걸러 줍니다.
function lines(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join("\n");
}

// AI 없이 채우는 "고정 양식" 팔로업 메일을 만듭니다. (제목 + 본문)
export function buildTemplate(
  ex: FollowupExhibition,
  c: Consultation,
  lang: Lang,
): { subject: string; body: string } {
  const exName = ex.name || "";
  const dateRange = formatRange(ex.startDate, ex.endDate, lang);
  const dateSuffix = dateRange ? ` (${dateRange})` : "";
  const interests = joinList(c.interests, c.interestEtc); // 관심 품목
  const inquiries = joinList(c.inquiries, c.inquiryEtc); // 문의 내용

  if (lang === "en") {
    const subject = exName
      ? `Thank you for visiting SPEEDRACK at ${exName}`
      : "Thank you for visiting the SPEEDRACK booth";
    const body = lines(
      c.company,
      lines(c.title, c.name).replace("\n", " / "),
      "",
      `Dear ${c.name || "Sir/Madam"},`,
      "",
      `Thank you for visiting the SPEEDRACK booth at ${exName || "the exhibition"}${dateSuffix}. It was a great pleasure to meet you.`,
      interests && `We noted your interest in our ${interests}.`,
      inquiries && `Regarding your inquiry about ${inquiries}, we would be happy to provide further details and a tailored proposal.`,
      "",
      "If you have any questions, please feel free to reply to this email. We look forward to working with you.",
      "",
      "Best regards,",
      "SPEEDRACK Overseas Sales Team",
    );
    return { subject, body };
  }

  if (lang === "ja") {
    const subject = exName
      ? `【SPEEDRACK】${exName} ご来場の御礼`
      : "【SPEEDRACK】ブースご来場の御礼";
    const body = lines(
      c.company,
      lines(c.title, c.name).replace("\n", " "),
      "",
      `${c.name || "ご担当者"}様`,
      "",
      `この度は${exName || "展示会"}${dateSuffix}にて、SPEEDRACKのブースにご来場いただき誠にありがとうございました。`,
      interests && `${interests}にご関心をお寄せいただき、重ねて御礼申し上げます。`,
      inquiries && `お問い合わせいただきました${inquiries}につきまして、詳細なご案内とお見積りをご用意いたします。`,
      "",
      "ご不明な点がございましたら、本メールにご返信ください。今後ともよろしくお願い申し上げます。",
      "",
      "SPEEDRACK 海外営業チーム",
    );
    return { subject, body };
  }

  // ko
  const subject = exName ? `[스피드랙] ${exName} 부스 방문 감사드립니다` : "[스피드랙] 부스 방문 감사드립니다";
  const body = lines(
    c.company,
    lines(c.title, c.name).replace("\n", " "),
    "",
    `${c.name || "담당자"}님, 안녕하세요.`,
    "",
    `이번 ${exName || "전시회"}${dateSuffix}에서 스피드랙 부스에 방문해 주셔서 진심으로 감사드립니다.`,
    interests && `${interests}에 관심 가져 주셔서 감사합니다.`,
    inquiries && `문의해 주신 ${inquiries}에 대해 상세 자료와 맞춤 제안을 준비해 드리겠습니다.`,
    "",
    "궁금하신 점이 있으시면 본 메일로 회신 부탁드립니다. 앞으로 좋은 인연 이어가길 바랍니다.",
    "",
    "감사합니다.",
    "스피드랙 해외영업팀 드림",
  );
  return { subject, body };
}
