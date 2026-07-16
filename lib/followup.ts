// 전시회 후 "팔로업 메일"을 만드는 공통 헬퍼입니다.
// - AI 없이도 쓸 수 있는 "고정 양식"(buildTemplate)을 언어별(영어/일본어/한국어)로 제공합니다.
// - AI 맞춤 초안은 /api/draft-followup 에서 따로 생성하고, 실패하면 이 양식으로 대신 씁니다.

import type { Consultation } from "./consultation";

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

// ── 메일 목적 (마지막에 제안할 다음 행동이 달라져요) ──
export type Purpose = "thanks" | "quote" | "sample" | "meeting";

export const PURPOSES: { value: Purpose; label: string }[] = [
  { value: "thanks", label: "감사 인사" },
  { value: "quote", label: "견적 제안" },
  { value: "sample", label: "샘플·카탈로그" },
  { value: "meeting", label: "미팅 요청" },
];

// 목적별 "다음 행동 제안" 문장 (언어별)
const PURPOSE_CTA: Record<Purpose, Record<Lang, string>> = {
  thanks: {
    en: "If you have any questions, please feel free to reply to this email. We look forward to building a great relationship with you.",
    ja: "ご不明な点がございましたら、本メールにご返信ください。今後ともよろしくお願い申し上げます。",
    ko: "궁금하신 점이 있으시면 언제든 본 메일로 회신 부탁드립니다. 앞으로 좋은 인연 이어가길 바랍니다.",
  },
  quote: {
    en: "We would be glad to prepare a tailored quotation to match your needs. Please let us know the items and quantities you are considering, and we will get back to you promptly.",
    ja: "ご要望に合わせたお見積りをご用意いたします。ご検討中の品目・数量をお知らせいただければ、早急にご返信いたします。",
    ko: "요청하신 사양에 맞춰 맞춤 견적을 준비해 드리겠습니다. 검토 중이신 품목과 수량을 알려 주시면 빠르게 회신드리겠습니다.",
  },
  sample: {
    en: "If it would be helpful, we can arrange product samples and our latest catalog for your review. Please share your shipping address and we will take care of the rest.",
    ja: "ご希望でしたら、製品サンプルと最新カタログをお送りいたします。送付先のご住所をお知らせいただければ、こちらで手配いたします。",
    ko: "필요하시면 제품 샘플과 최신 카탈로그를 보내드리겠습니다. 받으실 주소를 알려 주시면 저희가 준비해 발송해 드리겠습니다.",
  },
  meeting: {
    en: "We would love to schedule a short online meeting to explore how we can support your business. Please let us know a time that works for you.",
    ja: "貴社のお役に立てる点について、オンラインでの短いお打ち合わせをさせていただけますと幸いです。ご都合のよい日時をお知らせください。",
    ko: "귀사에 어떤 도움을 드릴 수 있을지 짧은 온라인 미팅을 갖고 싶습니다. 편하신 일정을 알려 주세요.",
  },
};

// ── 메일 서명(맺음말) ── 이름·이메일·전화만 입력하면 돼요.
//  직책(해외영업부)과 홈페이지(www.homedant.com)는 언어별로 자동으로 채워집니다.
export type Signature = {
  name: string; // 담당자 이름
  email: string;
  phone: string;
};

export const EMPTY_SIGNATURE: Signature = {
  name: "",
  email: "",
  phone: "",
};

// ── 메일 양식 옵션 (앱 공용) ──
export type FollowupOptions = {
  attach: boolean; // "자료 첨부" 안내문 넣기
  companyIntro: string; // 회사 한 줄 소개
  cc: string; // 참조(CC) 이메일 — 그룹웨어에 붙여넣기용
};

export const DEFAULT_OPTIONS: FollowupOptions = {
  attach: true,
  companyIntro: "",
  cc: "",
};

// 자동으로 들어가는 값 (직책·홈페이지)
const DEPT: Record<Lang, string> = {
  en: "Overseas Sales Department",
  ja: "海外営業部",
  ko: "해외영업부",
};
const HOMEDANT_WEBSITE = "www.homedant.com";

// 서명(맺음말) 블록을 "구분선 + 회사·직책·이름 + 연락처" 형태로 깔끔하게 만듭니다.
//  예)
//    -------------------------------
//    株式会社HOMEDANT
//    海外営業部 マネージャー
//    明 在民
//
//    Email: ...
//    URL: ...
//    -------------------------------
const SIG_DIVIDER = "-------------------------------";

export function formatSignature(sig: Signature | undefined, lang: Lang): string {
  const company =
    lang === "ja" ? "株式会社HOMEDANT" : lang === "ko" ? "홈던트(HOMEDANT)" : "HOMEDANT";
  const dept = DEPT[lang];
  const hasName = !!sig && !!sig.name.trim();

  if (!hasName) {
    return [SIG_DIVIDER, company, dept, SIG_DIVIDER].join("\n");
  }

  const s = sig as Signature;
  const contact = lines(
    s.email && `Email: ${s.email}`,
    s.phone && `Tel: ${s.phone}`,
    `URL: ${HOMEDANT_WEBSITE}`,
  );

  return [SIG_DIVIDER, company, dept, s.name.trim(), "", contact, SIG_DIVIDER].join("\n");
}

// 문단들을 "빈 줄 하나"로 띄워 이어 붙입니다. (다닥다닥 붙지 않고 시원하게)
function paras(...items: (string | false | null | undefined)[]): string {
  return items.filter((x) => x && String(x).trim()).join("\n\n");
}

// 자료 첨부 안내문 (감사·샘플 목적에서 사용)
const ATTACH_NOTE: Record<Lang, string> = {
  en: "We have attached a brief introduction to our company and products for your reference.",
  ja: "併せて、弊社および製品に関する簡単なご案内資料を添付しておりますので、ご確認いただけましたら幸いです。",
  ko: "아울러 회사 및 제품에 대한 간단한 안내 자료를 첨부하오니, 확인해 주시면 감사하겠습니다.",
};

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
//  opts.purpose     : 목적(감사/견적/샘플/미팅) — 마지막 제안 문장이 달라져요.
//  opts.signature   : 화면에서 입력한 서명 — 없으면 무난한 기본 서명이 들어가요.
//  opts.attach      : false 면 "자료 첨부" 안내문을 넣지 않아요. (기본 true)
//  opts.companyIntro: 회사 한 줄 소개 — 있으면 자기소개 뒤에 넣어요.
export function buildTemplate(
  ex: FollowupExhibition,
  c: Consultation,
  lang: Lang,
  opts: {
    purpose?: Purpose;
    signature?: Signature;
    attach?: boolean;
    companyIntro?: string;
  } = {},
): { subject: string; body: string } {
  const purpose = opts.purpose ?? "thanks";
  const exName = ex.name || "";
  const dateRange = formatRange(ex.startDate, ex.endDate, lang);
  const dateSuffix = dateRange ? ` (${dateRange})` : "";
  const cta = PURPOSE_CTA[purpose][lang];
  const sign = formatSignature(opts.signature, lang);
  const attach =
    (opts.attach ?? true) && (purpose === "thanks" || purpose === "sample")
      ? ATTACH_NOTE[lang]
      : "";
  const companyIntro = opts.companyIntro?.trim() || "";

  // 보내는 사람(서명 기준) — 자기소개 문장에 씁니다. (직책은 해외영업부로 자동)
  const senderName = opts.signature?.name.trim() || "";

  if (lang === "en") {
    const subject = exName
      ? `Thank you for visiting HOMEDANT at ${exName}`
      : "Thank you for visiting the HOMEDANT booth";
    const intro = senderName
      ? `My name is ${senderName} from HOMEDANT's Overseas Sales Department.`
      : "";
    const body = paras(
      c.company,
      c.name ? `Dear ${c.name}${c.title ? ` (${c.title})` : ""},` : "Dear Sir/Madam,",
      "Thank you very much for your continued support.",
      intro,
      companyIntro,
      `Thank you for taking the time to visit the HOMEDANT booth at ${exName || "the exhibition"}${dateSuffix}. It was a great pleasure to meet you and to introduce our assembly-type steel racks.`,
      cta,
      attach,
      "Once again, thank you for visiting our booth. We look forward to building a lasting relationship with you.",
      sign,
    );
    return { subject, body };
  }

  if (lang === "ja") {
    const subject = exName
      ? `【HOMEDANT】${exName} ご来場の御礼`
      : "【HOMEDANT】ブースご来場の御礼";
    const intro = senderName
      ? `株式会社HOMEDANT 海外営業部の${senderName}でございます。`
      : "株式会社HOMEDANTでございます。";
    const body = paras(
      c.company,
      `${c.name || "ご担当者"}様`,
      "平素より大変お世話になっております。",
      intro,
      companyIntro,
      `このたびはご多忙の中、${exName || "展示会"}${dateSuffix}にて、弊社HOMEDANT（ホームダント）のブースへお立ち寄りいただき、誠にありがとうございました。`,
      `当日は、貴社の事業についてお話を伺うとともに、弊社の組立式スチールラックについてもご紹介させていただき、大変有意義な機会となりました。`,
      cta,
      attach,
      "改めまして、このたびの弊社ブースへのご来場に心より御礼申し上げます。今後とも何卒よろしくお願い申し上げます。",
      sign,
    );
    return { subject, body };
  }

  // ko
  const subject = exName ? `[홈던트] ${exName} 부스 방문 감사드립니다` : "[홈던트] 부스 방문 감사드립니다";
  const intro = senderName
    ? `저는 홈던트(HOMEDANT) 해외영업부 ${senderName}입니다.`
    : "";
  const body = paras(
    c.company,
    `${c.name || "담당자"}님, 안녕하세요.`,
    "평소 저희 홈던트에 관심 가져 주셔서 진심으로 감사드립니다.",
    intro,
    companyIntro,
    `이번 ${exName || "전시회"}${dateSuffix}에서 바쁘신 와중에도 저희 홈던트(HOMEDANT) 부스에 방문해 주셔서 진심으로 감사드립니다.`,
    `당일 귀사의 사업에 대한 말씀을 나누고, 저희 조립식 스틸랙도 직접 소개해 드릴 수 있어 매우 뜻깊은 자리였습니다.`,
    cta,
    attach,
    "다시 한번 저희 부스에 방문해 주셔서 진심으로 감사드리며, 앞으로 좋은 인연 이어가길 바랍니다.",
    sign,
  );
  return { subject, body };
}
