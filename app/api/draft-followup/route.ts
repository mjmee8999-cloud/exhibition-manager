// 상담 고객 정보 + 전시회 정보를 받아서 Google Gemini AI에게
// "팔로업(감사·후속) 메일 초안"을 만들어 달라고 요청하는 서버 코드입니다.
//
// - 회사명/부서/담당자를 앞에 두고 → "[전시회명] 부스 방문 감사"로 시작 →
//   고객의 문의 내용에 맞춰 자연스럽게 이어지는 메일을 원하는 언어(영어/일본어/한국어)로 생성합니다.
// - AI 키(GEMINI_API_KEY)는 서버 안에만 두고 브라우저에 노출하지 않습니다. (.env.local)
// - 키가 없거나 실패하면 화면은 "고정 양식"(lib/followup.ts)으로 대신 씁니다.

const GEMINI_MODEL = "gemini-2.5-flash";

// 언어 코드 → AI에게 시킬 언어 이름
const LANG_NAME: Record<string, string> = {
  en: "영어(English)",
  ja: "일본어(日本語)",
  ko: "한국어",
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error: "NO_KEY",
        message: "아직 Gemini API 키가 등록되지 않았어요. AI 초안 대신 아래 고정 양식을 그대로 쓰세요.",
      },
      { status: 400 },
    );
  }

  // 브라우저가 보낸 전시회·고객·언어·목적·서명 정보 꺼내기
  let exhibition: Record<string, string> = {};
  let customer: Record<string, string> = {};
  let lang = "en";
  let purpose = "thanks";
  let signature = "";
  let attach = true;
  let companyIntro = "";
  try {
    const body = await request.json();
    exhibition = (body.exhibition ?? {}) as Record<string, string>;
    customer = (body.customer ?? {}) as Record<string, string>;
    lang = String(body.lang ?? "en");
    purpose = String(body.purpose ?? "thanks");
    signature = String(body.signature ?? "");
    attach = body.attach !== false;
    companyIntro = String(body.companyIntro ?? "");
  } catch {
    return Response.json({ error: "BAD_REQUEST", message: "요청을 읽을 수 없어요." }, { status: 400 });
  }

  const langName = LANG_NAME[lang] ?? LANG_NAME.en;

  // 목적별 "마지막에 제안할 다음 행동"
  const PURPOSE_GOAL: Record<string, string> = {
    thanks:
      "방문 감사와 관계 형성이 목적. 부담 없이 회신을 유도하고, 앞으로의 협업 기대를 담아 마무리한다.",
    quote:
      "맞춤 견적 제안이 목적. 고객의 관심 품목/문의를 근거로 견적을 준비하겠다고 제안하고, 원하는 품목·수량·사양을 알려달라고 정중히 요청한다.",
    sample:
      "샘플·카탈로그 발송이 목적. 제품 샘플과 최신 카탈로그를 보내주겠다고 제안하고, 받을 주소를 알려달라고 요청한다.",
    meeting:
      "온라인 미팅 성사가 목적. 짧은 온라인 미팅(화상 통화)을 정중히 제안하고, 편한 일정을 알려달라고 요청한다.",
  };
  const goal = PURPOSE_GOAL[purpose] ?? PURPOSE_GOAL.thanks;

  // 중요도 A(핵심 고객)면 조금 더 정성스럽고 적극적인 톤으로
  const importance = customer.importance || "";
  const warmth =
    importance === "A"
      ? "이 고객은 핵심(중요도 A) 고객이다. 특별히 정성스럽고 적극적인 톤으로, 우선순위를 두고 대응한다는 인상을 준다."
      : "정중하고 프로페셔널하되 과하지 않은 톤을 유지한다.";

  const prompt =
    `너는 홈던트(HOMEDANT)의 해외영업 담당자다. HOMEDANT는 한국의 조립식(무볼트) ` +
    `선반·수납 전문 브랜드로, 스탠다드 선반, 이동식(바퀴) 선반, 행거 선반, 하단오픈형, ` +
    `연결형, 서랍형, 코너형, 캐비닛형, 타공 선반, MAX 시리즈 등을 만든다. 강점은 손쉬운 무볼트 ` +
    `조립, 다양한 사이즈·색상 선택, 견고한 내하중, 가정·상업·물류 등 폭넓은 활용, OEM/ODM 대응이다.\n\n` +
    `아래 전시회에서 우리 부스를 방문한 고객에게 보낼 "팔로업 메일"을 ${langName}로 작성하라.\n\n` +
    `[이 메일의 목적]\n${goal}\n\n` +
    `[문체·품질 기준]\n` +
    `- ${warmth}\n` +
    `- 템플릿처럼 뻔하지 않게, 이 고객에게 실제로 쓰는 것처럼 자연스럽고 정중하게 쓴다.\n` +
    `- **구체적인 관심 품목·문의 항목을 나열하거나 언급하지 마라.** (특정 제품명·문의 목록을 되뇌지 말 것.) ` +
    `대신 "부스에서 나눈 이야기 감사드린다"는 정도로만 두루뭉술하게 언급하고, ` +
    `"궁금하신 점이 있으면 무엇이든 편하게 문의해 달라"는 열린 마무리로 이어간다.\n` +
    `- 없는 사실(가격·수치·납기·재고 등)은 절대 지어내지 않는다. 모르는 건 "안내드리겠다"로 표현한다.\n` +
    `- ${langName} 외의 언어(특히 한국어)를 본문에 섞지 않는다. 전부 ${langName}로만 쓴다.\n\n` +
    `[아주 중요 — 서식(줄바꿈) 규칙]\n` +
    `- 문단과 문단 사이에는 반드시 "빈 줄 하나"(\\n\\n)를 넣는다. 문장을 다닥다닥 붙이지 말 것.\n` +
    `- 한 문단은 1~3문장으로 짧게. 전체적으로 여백이 넉넉하고 읽기 편하게 배치한다.\n` +
    `- 아래 순서·구조를 그대로 따른다(각 항목 사이 빈 줄):\n` +
    `   1) 고객 회사명\n` +
    `   2) 담당자 호칭 (예: Dear Mr. Kim, / 細川 啓太 様 / 홍길동님, 안녕하세요.)\n` +
    `   3) 첫인사 (예: 平素より大変お世話になっております。 / Thank you for your continued support.)\n` +
    `   4) 보내는 사람 자기소개 (아래 [서명]의 회사·직책·이름을 활용)\n` +
    `   5) '${exhibition.name || "전시회"}에서 저희 HOMEDANT(홈던트) 부스를 방문해 주셔서 감사합니다' 취지의 감사 + 제품(조립식 스틸랙) 언급\n` +
    `      ※ 전시회 이름은 아래 [전시회 정보]의 "이름"을 그대로 사용한다(이미 현지 표기로 넣어줬다). 임의로 바꾸지 말 것.\n` +
    `   6) 부스에서 나눈 이야기에 대한 간단한 감사 (구체 품목·문의 나열 금지)\n` +
    (companyIntro
      ? `   6-1) 아래 [회사 소개]를 ${langName}로 자연스럽게 옮겨 한 문장으로 넣는다.\n`
      : "") +
    `   7) "궁금하신 점이 있으면 무엇이든 편하게 문의해 달라"는 열린 마무리\n` +
    (attach ? `   8) 안내 자료(회사·제품 소개) 첨부 안내 한 줄\n` : "   8) (첨부 안내문은 넣지 않는다)\n") +
    `   9) 마무리 인사 (다시 한번 감사 + 향후 관계 기대)\n` +
    `   10) 맨 마지막에 아래 [서명] 블록을 "그대로" 붙인다(구분선 포함, 내용 바꾸지 말 것).\n\n` +
    (companyIntro ? `[회사 소개]\n${companyIntro}\n\n` : "") +
    `[고객 정보]\n` +
    `회사명: ${customer.company || "-"}\n` +
    `부서/직책: ${customer.title || "-"}\n` +
    `담당자: ${customer.name || "-"}\n` +
    `업체 특성: ${customer.companyTypeDetail || "-"}\n` +
    `[전시회 정보]\n` +
    `이름: ${exhibition.name || "-"}\n` +
    `기간: ${exhibition.startDate || "-"} ~ ${exhibition.endDate || "-"}\n` +
    `장소: ${exhibition.country || ""} ${exhibition.city || ""}\n\n` +
    `[서명]\n${signature || "(비어 있음)"}\n\n` +
    `제목(subject)과 본문(body)을 JSON으로만 답하라. 본문은 줄바꿈(\\n)을 포함한 완성된 메일 텍스트로, ${langName}로만 작성한다.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                subject: { type: "string" },
                body: { type: "string" },
              },
            },
          },
        }),
      },
    );

    if (!res.ok) {
      const detail = await res.text();
      return Response.json(
        { error: "GEMINI_ERROR", message: `AI 초안 생성이 실패했어요. (${res.status})`, detail },
        { status: 502 },
      );
    }

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    let parsed: Record<string, string> = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {};
    }

    return Response.json({
      data: {
        subject: String(parsed.subject ?? ""),
        body: String(parsed.body ?? ""),
      },
    });
  } catch (err) {
    return Response.json(
      { error: "NETWORK", message: "AI 서버에 연결하지 못했어요.", detail: String(err) },
      { status: 502 },
    );
  }
}
