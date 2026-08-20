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

  // 브라우저가 보낸 고객·언어·양식·상담내용 정보 꺼내기
  //  (서명·회사소개는 이미 [양식] 본문 안에 치환되어 들어오므로 따로 받지 않습니다.)
  let customer: Record<string, string> = {};
  let lang = "en";
  let template: { subject: string; body: string } = { subject: "", body: "" };
  let consultation: { interests: string; inquiries: string; memo: string } = {
    interests: "",
    inquiries: "",
    memo: "",
  };
  try {
    const body = await request.json();
    customer = (body.customer ?? {}) as Record<string, string>;
    lang = String(body.lang ?? "en");
    if (body.template) {
      template = {
        subject: String(body.template.subject ?? ""),
        body: String(body.template.body ?? ""),
      };
    }
    if (body.consultation) {
      consultation = {
        interests: String(body.consultation.interests ?? ""),
        inquiries: String(body.consultation.inquiries ?? ""),
        memo: String(body.consultation.memo ?? ""),
      };
    }
  } catch {
    return Response.json({ error: "BAD_REQUEST", message: "요청을 읽을 수 없어요." }, { status: 400 });
  }

  const langName = LANG_NAME[lang] ?? LANG_NAME.en;

  // 중요도 A(핵심 고객)면 조금 더 정성스럽고 적극적인 톤으로
  const importance = customer.importance || "";
  const warmth =
    importance === "A"
      ? "이 고객은 핵심(중요도 A) 고객이니, 기본 양식의 틀 안에서 조금 더 정성스럽고 따뜻한 어감으로 다듬는다."
      : "";

  // 상담 내용이 실제로 있는지 (없으면 양식을 거의 그대로 둠)
  const hasConsult = [consultation.interests, consultation.inquiries, consultation.memo].some(
    (v) => v && v.trim(),
  );

  const prompt =
    `너는 홈던트(HOMEDANT)의 해외영업 담당자다. HOMEDANT는 한국의 조립식(무볼트) ` +
    `선반·수납 전문 브랜드로, 조립식 스틸랙을 만든다.\n\n` +
    `아래 [기본 양식]은 담당자가 직접 만들어 둔 팔로업 메일이다. ` +
    `이 양식을 뼈대로 삼아, [상담 내용]에서 이 고객과 실제로 나눈 이야기를 자연스럽게 녹여 ` +
    `조금 더 개인화한 메일을 ${langName}로 완성하라.\n\n` +
    `[반드시 지킬 규칙]\n` +
    `- 기본 양식의 구조·문장·어투·인사말을 최대한 그대로 유지한다. 통째로 새로 쓰지 마라.\n` +
    `- 상담 내용에 실제로 있는 관심 품목·문의만, 부스에서 나눈 대화를 떠올리는 정도로 ` +
    `1~2문장 자연스럽게 반영한다. 기계적으로 목록을 나열하지 마라.\n` +
    (hasConsult
      ? `- 반영할 위치는 "부스에서 나눈 이야기에 감사드린다"는 문단 근처가 가장 자연스럽다.\n`
      : `- 이 고객은 상담 내용이 비어 있으니, 억지로 만들지 말고 기본 양식을 거의 그대로 둔다.\n`) +
    `- 없는 사실(가격·수치·납기·재고 등)은 절대 지어내지 않는다.\n` +
    `- 서명 블록(맨 아래 구분선 "----" 포함)은 한 글자도 바꾸지 말고 그대로 둔다.\n` +
    `- 문단과 문단 사이에는 빈 줄 하나(\\n\\n)를 유지해 읽기 좋게 둔다.\n` +
    `- 전부 ${langName}로만 쓴다. 다른 언어(특히 한국어)를 본문에 섞지 않는다.\n` +
    (warmth ? `- ${warmth}\n` : "") +
    `\n[기본 양식 - 제목]\n${template.subject || "(비어 있음)"}\n\n` +
    `[기본 양식 - 본문]\n${template.body || "(비어 있음)"}\n\n` +
    `[상담 내용]\n` +
    `관심 품목: ${consultation.interests || "-"}\n` +
    `문의 내용: ${consultation.inquiries || "-"}\n` +
    `상담 메모: ${consultation.memo || "-"}\n` +
    `업체 특성: ${customer.companyTypeDetail || "-"}\n\n` +
    `제목(subject)과 본문(body)을 JSON으로만 답하라. ` +
    `제목은 기본 양식의 제목을 거의 그대로 쓰고, 본문은 줄바꿈(\\n)을 포함한 완성된 메일 텍스트로 ${langName}로만 작성한다.`;

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
