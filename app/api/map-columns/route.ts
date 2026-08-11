// 엑셀(리드 명단)의 "헤더(열 제목)"만 Google Gemini AI에게 보내서,
// 우리 상담일지 항목(회사명·담당자·부서/직책·이메일·연락처·홈페이지·매출)이
// 각각 엑셀의 어느 열에 해당하는지 "열 제목"으로 짝지어 돌려주는 서버 코드입니다.
//
// 핵심: 데이터 전체(수십~수백 명)를 보내지 않고 "헤더 + 샘플 몇 줄"만 보냅니다.
//   → 빠르고 저렴하며, 영어·일본어·한국어 등 어떤 언어 헤더든 AI가 이해합니다.
//   → 실제 대량 변환은 이 짝(매칭)을 받아 브라우저에서 처리합니다.
//
// AI 키(GEMINI_API_KEY)는 명함 스캔과 동일하게 서버(.env.local)에만 둡니다.

const GEMINI_MODEL = "gemini-2.5-flash";

export async function POST(request: Request) {
  // 1) 서버에 AI 키가 등록돼 있는지 확인
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error: "NO_KEY",
        message:
          "아직 Gemini API 키가 등록되지 않았어요. 아래 미리보기에서 열을 직접 골라 저장할 수 있어요.",
      },
      { status: 400 },
    );
  }

  // 2) 브라우저가 보낸 헤더 목록과 샘플 데이터 꺼내기
  let headers: string[] = [];
  let sampleRows: string[][] = [];
  try {
    const body = await request.json();
    headers = Array.isArray(body.headers) ? body.headers.map(String) : [];
    sampleRows = Array.isArray(body.sampleRows)
      ? body.sampleRows.map((r: unknown[]) => (Array.isArray(r) ? r.map(String) : []))
      : [];
  } catch {
    return Response.json({ error: "BAD_REQUEST", message: "요청을 읽을 수 없어요." }, { status: 400 });
  }

  if (headers.length === 0) {
    return Response.json({ error: "NO_HEADERS", message: "엑셀 헤더(열 제목)를 찾을 수 없어요." }, { status: 400 });
  }

  // 3) Gemini에게 "각 항목에 맞는 열 제목을 골라줘" 하고 요청
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    "다음은 전시회 리드(고객) 명단 엑셀의 '헤더(열 제목)'와 '샘플 데이터'야.\n" +
                    "영어·일본어·한국어 등 어떤 언어든 이해해서, 우리 항목에 해당하는 '열 제목'을 아래 헤더 목록에서 그대로(똑같은 문자열로) 골라줘.\n" +
                    "- company: 회사/업체명\n" +
                    "- name: 담당자 이름 (성/이름이 두 열로 나뉘어 있으면 두 열 제목을 배열로. 한 열이면 그 한 열만)\n" +
                    "- title: 부서 또는 직책 (Job Title 등)\n" +
                    "- email: 이메일\n" +
                    "- phone: 전화번호/연락처\n" +
                    "- homepage: 웹사이트/홈페이지\n" +
                    "- revenue: 연매출\n" +
                    "- consultDate: 상담 일자/상담 날짜/미팅 날짜 (사람이 상담한 날. 리드가 만들어진 날짜(Date Created)만 있으면 그걸 써도 됨. 날짜 열이 없으면 빈 문자열)\n" +
                    "- memoColumns: 위에 안 쓴 열들 중 '영업에 참고될 유용한 정보' 열 제목들 (예: 국가, 도시, 판매채널, 관심 품목, 구매 권한/역할, 참가 목적, 등급/점수). ID·상세주소·우편번호·빈 열처럼 참고 가치가 낮은 건 넣지 마.\n" +
                    "해당하는 열이 없으면 빈 문자열(memoColumns/name은 빈 배열)로 둬. 반드시 아래 '헤더 목록'에 실제로 있는 문자열만 사용해. 지어내지 마.\n\n" +
                    "헤더 목록:\n" +
                    JSON.stringify(headers) +
                    "\n\n샘플 데이터(각 행은 위 헤더 순서와 같음):\n" +
                    JSON.stringify(sampleRows.slice(0, 3)),
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                company: { type: "string" },
                name: { type: "array", items: { type: "string" } },
                title: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
                homepage: { type: "string" },
                revenue: { type: "string" },
                consultDate: { type: "string" },
                memoColumns: { type: "array", items: { type: "string" } },
              },
            },
          },
        }),
      },
    );

    if (!res.ok) {
      const detail = await res.text();
      return Response.json(
        { error: "GEMINI_ERROR", message: `AI 요청이 실패했어요. (${res.status})`, detail },
        { status: 502 },
      );
    }

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {};
    }

    // AI가 실수로 없는 헤더를 말할 수 있으니, 실제 헤더 목록에 있는 것만 남깁니다.
    const has = (h: unknown) => typeof h === "string" && headers.includes(h);
    const one = (v: unknown) => (has(v) ? (v as string) : "");
    const many = (v: unknown) => (Array.isArray(v) ? v.filter(has) : []);

    return Response.json({
      data: {
        company: one(parsed.company),
        name: many(parsed.name),
        title: one(parsed.title),
        email: one(parsed.email),
        phone: one(parsed.phone),
        homepage: one(parsed.homepage),
        revenue: one(parsed.revenue),
        consultDate: one(parsed.consultDate),
        memoColumns: many(parsed.memoColumns),
      },
    });
  } catch (err) {
    return Response.json(
      { error: "NETWORK", message: "AI 서버에 연결하지 못했어요.", detail: String(err) },
      { status: 502 },
    );
  }
}
