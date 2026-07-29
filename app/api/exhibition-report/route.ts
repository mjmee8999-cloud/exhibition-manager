// 전시회 실적 데이터(집계 + 상담 목록)를 받아서 Google Gemini AI에게
// "상사 보고용 종합 리포트"를 만들어 달라고 요청하는 서버 코드입니다.
//
// - 대시보드의 숫자·순위와 상담 내용을 근거로, 핵심 리드/시장 트렌드/다음 제안을 뽑아줍니다.
// - AI 키(GEMINI_API_KEY)는 서버 안에만 두고 브라우저에 노출하지 않습니다. (.env.local)
// - 키가 없거나 실패하면, 화면은 숫자만으로 만든 "간단 요약"으로 대신합니다.
//
// ※ 지금은 무료 Gemini(gemini-2.5-flash)를 씁니다. 더 깊이 있는 분석이 필요하면
//   이 파일의 호출부만 Claude 등으로 바꾸면 됩니다(호출을 한 곳에 모아둔 이유).

const GEMINI_MODEL = "gemini-2.5-flash";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error: "NO_KEY",
        message: "아직 Gemini API 키가 등록되지 않았어요. AI 분석 없이 숫자 요약만 넣을게요.",
      },
      { status: 400 },
    );
  }

  let exhibition: Record<string, string> = {};
  let stats: Record<string, unknown> = {};
  let consultations: unknown[] = [];
  try {
    const body = await request.json();
    exhibition = (body.exhibition ?? {}) as Record<string, string>;
    stats = (body.stats ?? {}) as Record<string, unknown>;
    consultations = Array.isArray(body.consultations) ? body.consultations : [];
  } catch {
    return Response.json({ error: "BAD_REQUEST", message: "요청을 읽을 수 없어요." }, { status: 400 });
  }

  const prompt =
    `너는 홈던트(HOMEDANT)의 해외영업 데이터 분석가다. HOMEDANT는 한국의 조립식(무볼트) ` +
    `선반·수납 전문 브랜드다(스탠다드/바퀴/행거/하단오픈/연결형/서랍형/코너형/캐비닛형/타공/MAX 등).\n\n` +
    `아래는 방금 끝난 해외 전시회의 상담 실적 데이터다. 이걸 근거로 **상사에게 보고할 종합 리포트**를 ` +
    `한국어로 작성하라. 반드시 아래 [데이터]에 있는 사실만 사용하고, 없는 수치·납기·매출 등은 지어내지 마라.\n\n` +
    `[작성 지침]\n` +
    `- headline: 이번 전시회를 한두 문장으로 요약(총 상담 수와 가장 두드러진 특징).\n` +
    `- topLeads: 지금 바로 후속 연락해야 할 핵심 리드를 우선순위 순으로 최대 5곳. company에는 회사명, ` +
    `reason에는 "왜 중요한지 + 어떤 후속을 해야 하는지"를 그 업체의 관심품목·문의·중요도/관심도를 근거로 구체적으로.\n` +
    `- marketTrends: 문의·관심품목 데이터에서 읽히는 시장 신호를 2~4개(예: "타공선반 문의 다수 → 수납 수요 확인").\n` +
    `- nextActions: 다음 전시회나 후속 영업을 위한 실행 제안 2~4개.\n` +
    `- 각 문장은 간결한 보고체(개조식)로. 데이터가 적으면 있는 만큼만 쓰되 억지로 부풀리지 마라.\n\n` +
    `[전시회 정보]\n` +
    `이름: ${exhibition.name || "-"}\n` +
    `기간: ${exhibition.startDate || "-"} ~ ${exhibition.endDate || "-"}\n` +
    `장소: ${exhibition.country || ""} ${exhibition.city || ""}\n\n` +
    `[집계 데이터]\n${JSON.stringify(stats, null, 2)}\n\n` +
    `[상담 목록(요약)]\n${JSON.stringify(consultations, null, 2)}\n\n` +
    `결과는 JSON으로만 답하라.`;

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
                headline: { type: "string" },
                topLeads: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      company: { type: "string" },
                      reason: { type: "string" },
                    },
                  },
                },
                marketTrends: { type: "array", items: { type: "string" } },
                nextActions: { type: "array", items: { type: "string" } },
              },
            },
          },
        }),
      },
    );

    if (!res.ok) {
      const detail = await res.text();
      return Response.json(
        { error: "GEMINI_ERROR", message: `AI 리포트 생성이 실패했어요. (${res.status})`, detail },
        { status: 502 },
      );
    }

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    let parsed: {
      headline?: string;
      topLeads?: { company?: string; reason?: string }[];
      marketTrends?: string[];
      nextActions?: string[];
    } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {};
    }

    return Response.json({
      data: {
        headline: String(parsed.headline ?? ""),
        topLeads: Array.isArray(parsed.topLeads)
          ? parsed.topLeads.map((l) => ({
              company: String(l.company ?? ""),
              reason: String(l.reason ?? ""),
            }))
          : [],
        marketTrends: Array.isArray(parsed.marketTrends) ? parsed.marketTrends.map(String) : [],
        nextActions: Array.isArray(parsed.nextActions) ? parsed.nextActions.map(String) : [],
      },
    });
  } catch (err) {
    return Response.json(
      { error: "NETWORK", message: "AI 서버에 연결하지 못했어요.", detail: String(err) },
      { status: 502 },
    );
  }
}
