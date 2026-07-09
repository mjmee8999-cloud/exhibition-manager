// 명함 사진을 받아서 Google Gemini AI에게 보내고,
// 고객 정보(회사명·담당자·이메일·연락처·부서/직책)를 뽑아 돌려주는 "서버 쪽" 코드입니다.
//
// 왜 서버에서 하냐면: AI 키(GEMINI_API_KEY)를 브라우저에 노출하지 않고
// 서버 안에만 숨겨두기 위해서예요. (프로젝트 루트의 .env.local 파일에 넣습니다.)

// 사용할 Gemini 모델. 무료 사용량이 넉넉한 Flash 모델을 씁니다.
// (나중에 더 좋은 모델로 이 줄만 바꾸면 됩니다.)
const GEMINI_MODEL = "gemini-2.5-flash";

export async function POST(request: Request) {
  // 1) 서버에 AI 키가 등록돼 있는지 확인
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error: "NO_KEY",
        message:
          "아직 Gemini API 키가 등록되지 않았어요. 사진은 그대로 저장되니, 정보는 직접 입력해 주세요.",
      },
      { status: 400 },
    );
  }

  // 2) 브라우저가 보낸 명함 사진(데이터 URL) 꺼내기
  //    형식 예: "data:image/jpeg;base64,/9j/4AAQ..."
  let image = "";
  try {
    const body = await request.json();
    image = String(body.image ?? "");
  } catch {
    return Response.json({ error: "BAD_REQUEST", message: "요청을 읽을 수 없어요." }, { status: 400 });
  }

  const match = /^data:(image\/[\w.+-]+);base64,(.+)$/.exec(image);
  if (!match) {
    return Response.json({ error: "BAD_IMAGE", message: "이미지 형식이 올바르지 않아요." }, { status: 400 });
  }
  const mimeType = match[1];
  const base64 = match[2];

  // 3) Gemini에게 "명함에서 이런 정보를 JSON으로 뽑아줘" 하고 요청
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
                { inline_data: { mime_type: mimeType, data: base64 } },
                {
                  text:
                    "이 명함 사진에서 정보를 추출해줘. 영어·일본어·한국어 등 어떤 언어든 인식해줘. " +
                    "회사명(company), 담당자 이름(name), 부서/직책(title), 이메일(email), 연락처(phone)를 뽑되, " +
                    "명함에 없는 항목은 빈 문자열로 둬. 추측하거나 지어내지 마.",
                },
              ],
            },
          ],
          // 결과를 정해진 JSON 모양으로만 받도록 강제합니다.
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                company: { type: "string" },
                name: { type: "string" },
                title: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
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

    let parsed: Record<string, string> = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {};
    }

    // 4) 뽑아낸 정보를 브라우저로 돌려줍니다.
    return Response.json({
      data: {
        company: String(parsed.company ?? ""),
        name: String(parsed.name ?? ""),
        title: String(parsed.title ?? ""),
        email: String(parsed.email ?? ""),
        phone: String(parsed.phone ?? ""),
      },
    });
  } catch (err) {
    return Response.json(
      { error: "NETWORK", message: "AI 서버에 연결하지 못했어요.", detail: String(err) },
      { status: 502 },
    );
  }
}
