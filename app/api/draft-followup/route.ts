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

  // 브라우저가 보낸 전시회·고객·언어 정보 꺼내기
  let exhibition: Record<string, string> = {};
  let customer: Record<string, string> = {};
  let lang = "en";
  try {
    const body = await request.json();
    exhibition = (body.exhibition ?? {}) as Record<string, string>;
    customer = (body.customer ?? {}) as Record<string, string>;
    lang = String(body.lang ?? "en");
  } catch {
    return Response.json({ error: "BAD_REQUEST", message: "요청을 읽을 수 없어요." }, { status: 400 });
  }

  const langName = LANG_NAME[lang] ?? LANG_NAME.en;

  const prompt =
    `너는 스피드랙(SPEEDRACK, 한국의 조립식 선반 제조사)의 해외영업 담당자다. ` +
    `아래 전시회에서 우리 부스를 방문한 고객에게 보낼 "팔로업(감사·후속 안내) 메일"을 ${langName}로 작성하라.\n\n` +
    `[작성 규칙]\n` +
    `- 메일 맨 위에 고객의 회사명, 부서/직책, 담당자 이름을 적는다(있는 것만).\n` +
    `- 첫 문장은 '${exhibition.name || "전시회"}(${exhibition.startDate || ""}~${exhibition.endDate || ""})에서 저희 부스를 방문해 주셔서 감사합니다'라는 취지로 시작한다.\n` +
    `- 고객의 관심 품목과 문의 내용을 자연스럽게 언급하며, 이어서 후속 논의(상세 자료·견적 제안 등)를 정중하게 제안한다.\n` +
    `- 업체 특성을 살려 자연스럽고 전문적인 비즈니스 문체로 쓴다. 과장하거나 없는 사실(가격·수치 등)을 지어내지 마라.\n` +
    `- 서명은 'SPEEDRACK Overseas Sales Team'(언어에 맞게) 정도로 간결히.\n\n` +
    `[고객 정보]\n` +
    `회사명: ${customer.company || "-"}\n` +
    `부서/직책: ${customer.title || "-"}\n` +
    `담당자: ${customer.name || "-"}\n` +
    `관심 품목: ${customer.interests || "-"}\n` +
    `문의 내용: ${customer.inquiries || "-"}\n` +
    `업체 특성: ${customer.companyTypeDetail || "-"}\n` +
    `상담 메모: ${customer.memo || "-"}\n\n` +
    `[전시회 정보]\n` +
    `이름: ${exhibition.name || "-"}\n` +
    `기간: ${exhibition.startDate || "-"} ~ ${exhibition.endDate || "-"}\n` +
    `장소: ${exhibition.country || ""} ${exhibition.city || ""}\n\n` +
    `제목(subject)과 본문(body)을 JSON으로만 답하라. 본문은 줄바꿈(\\n)을 포함한 완성된 메일 텍스트로.`;

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
