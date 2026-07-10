// 회사명을 받아서 Google Gemini(웹 검색 연동)로 업체 정보를 조회하는 서버 코드입니다.
//  - 업체 유형(서술형)·홈페이지·판매 채널·대략적 매출액을 웹에서 찾아 돌려줍니다.
//  - ⚠️ AI 추측이라 100% 정확하지 않아요(특히 작은 해외 업체·매출 단위).
//    → 화면에서 "참고용"으로 보여주고 사용자가 확인/수정하도록 씁니다.

const GEMINI_MODEL = "gemini-2.5-flash";
// 화면의 판매 채널 체크박스와 똑같은 후보들 (AI가 이 중에서만 고르게 함)
const KNOWN_CHANNELS = ["EC몰", "오프라인 매장", "도매"];
// 화면의 업체 유형 버튼과 똑같은 후보들 (AI가 이 중에서만 고르게 함)
const KNOWN_TYPES = [
  "홈센터",
  "가구점",
  "생활용품점",
  "제조사",
  "건설·인테리어업체",
  "서비스업체",
  "일반고객",
  "기타",
];

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "NO_KEY", message: "아직 Gemini API 키가 등록되지 않았어요." },
      { status: 400 },
    );
  }

  let company = "";
  try {
    const body = await request.json();
    company = String(body.company ?? "").trim();
  } catch {
    return Response.json({ error: "BAD_REQUEST", message: "요청을 읽을 수 없어요." }, { status: 400 });
  }
  if (!company) {
    return Response.json(
      { error: "NO_COMPANY", message: "회사명을 먼저 입력(또는 명함 스캔)해 주세요." },
      { status: 400 },
    );
  }

  const prompt =
    `'${company}' 회사를 웹에서 조사해서 아래 JSON 객체 "하나만" 답하라. ` +
    `코드블록·설명 없이 순수 JSON만.\n` +
    `{"companyType":"${KNOWN_TYPES.join("/")} 중 가장 알맞은 하나(모르면 빈 문자열)",` +
    `"companyTypeDetail":"세부 업종·규모·특징을 30자 이내 한국어 서술(예: 선반제조, 대형 홈센터 체인)",` +
    `"homepage":"공식 홈페이지 URL(없거나 불확실하면 빈 문자열)",` +
    `"salesChannels":["EC몰","오프라인 매장","도매" 중 해당되는 것만 담은 배열(모르면 빈 배열)],` +
    `"revenue":"가장 최근 연매출을 짧게(예: 약 227조원(2025)). 신뢰할 자료가 없으면 미상"}\n` +
    `확실하지 않으면 미상/빈 값으로. 숫자를 지어내지 마라.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }], // 웹 검색 연동
        }),
      },
    );

    if (!res.ok) {
      const detail = await res.text();
      return Response.json(
        { error: "GEMINI_ERROR", message: `AI 조회가 실패했어요. (${res.status})`, detail },
        { status: 502 },
      );
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    let text: string = parts.map((p: { text?: string }) => p.text ?? "").join("");

    // 코드블록 표시를 걷어내고 첫 { ... } 덩어리만 JSON 해석
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      parsed = {};
    }

    // 업체 유형: 우리가 아는 후보일 때만 채택 (아니면 빈 값)
    const typeRaw = String(parsed.companyType ?? "").trim();
    const companyType = KNOWN_TYPES.includes(typeRaw) ? typeRaw : "";
    const companyTypeDetail = String(parsed.companyTypeDetail ?? "").trim();
    const homepage = String(parsed.homepage ?? "").trim();

    // 판매 채널: 우리가 아는 후보만 남깁니다.
    const channelsRaw = Array.isArray(parsed.salesChannels) ? parsed.salesChannels : [];
    const salesChannels = channelsRaw
      .map((c) => String(c).trim())
      .filter((c) => KNOWN_CHANNELS.includes(c));

    // 매출액이 객체로 오면 짧은 문자열로 합칩니다.
    let revenueRaw = parsed.revenue;
    if (revenueRaw && typeof revenueRaw === "object") {
      revenueRaw = Object.values(revenueRaw as Record<string, unknown>).join(", ");
    }
    const revenue = String(revenueRaw ?? "").trim();

    return Response.json({ data: { companyType, companyTypeDetail, homepage, salesChannels, revenue } });
  } catch (err) {
    return Response.json(
      { error: "NETWORK", message: "AI 서버에 연결하지 못했어요.", detail: String(err) },
      { status: 502 },
    );
  }
}
