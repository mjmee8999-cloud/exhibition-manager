// GEP(글로벌 전시 플랫폼) 해외전시회 정보를 조회하는 서버 코드입니다.
//  - 공공데이터포털 오픈API(api.odcloud.kr)를 호출합니다.
//  - 인증키(GEP_API_KEY)는 서버 안에만 두고 브라우저엔 노출하지 않아요.
//  - data.go.kr이 매년 새 파일로 갱신하면 주소(uddi)가 바뀌는데,
//    명세를 읽어 "가장 최신 버전"을 자동으로 골라 쓰므로 손댈 필요가 없어요.

export const dynamic = "force-dynamic";

const NAMESPACE = "15135584/v1"; // 해외전시회 개최 정보 데이터셋
const FALLBACK_UDDI = "uddi:095813f4-2c67-4e75-b9c3-c15c670fe4fd"; // 명세 조회 실패 시 기본값

// 최신 데이터 주소(uddi)를 명세에서 찾아 캐시합니다.
let cachedUddi: string | null = null;

async function getLatestUddi(): Promise<string> {
  if (cachedUddi) return cachedUddi;
  try {
    const res = await fetch(`https://infuser.odcloud.kr/oas/docs?namespace=${NAMESPACE}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const spec = await res.json();
      const paths: Record<string, { get?: { summary?: string } }> = spec?.paths ?? {};
      let best = "";
      let bestDate = "";
      for (const path of Object.keys(paths)) {
        const seg = path.split("/").pop() ?? "";
        if (!seg.startsWith("uddi:")) continue;
        const summary = paths[path]?.get?.summary ?? "";
        const date = summary.match(/(\d{8})/)?.[1] ?? "";
        if (!best || date > bestDate) {
          best = seg;
          bestDate = date;
        }
      }
      if (best) {
        cachedUddi = best;
        return best;
      }
    }
  } catch {
    // 명세 조회 실패 시 아래 기본값 사용
  }
  cachedUddi = FALLBACK_UDDI;
  return FALLBACK_UDDI;
}

export async function GET(request: Request) {
  const key = process.env.GEP_API_KEY;
  if (!key) {
    return Response.json(
      { error: "NO_KEY", message: "아직 GEP 인증키가 등록되지 않았어요." },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(request.url);
  const country = (searchParams.get("country") ?? "").trim();
  const year = (searchParams.get("year") ?? "").trim();
  const industry = (searchParams.get("industry") ?? "").trim();
  const keyword = (searchParams.get("keyword") ?? "").trim();
  const page = searchParams.get("page") ?? "1";
  const perPage = searchParams.get("perPage") ?? "30";

  try {
    const uddi = await getLatestUddi();
    const url = new URL(`https://api.odcloud.kr/api/${NAMESPACE}/${uddi}`);
    url.searchParams.set("serviceKey", key);
    url.searchParams.set("page", page);
    url.searchParams.set("perPage", perPage);
    url.searchParams.set("returnType", "JSON");
    // 조건들은 AND로 합쳐집니다. (국가·연도는 정확히 일치, 산업분야·이름은 부분일치)
    if (country) url.searchParams.set("cond[개최국가명::EQ]", country);
    if (year) url.searchParams.set("cond[개최예정연도::EQ]", year);
    if (industry) url.searchParams.set("cond[산업분야::LIKE]", industry);
    if (keyword) url.searchParams.set("cond[해외전시회명::LIKE]", keyword);

    const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) {
      const detail = await res.text();
      return Response.json(
        { error: "GEP_ERROR", message: `조회에 실패했어요. (${res.status})`, detail },
        { status: 502 },
      );
    }

    const json = await res.json();
    return Response.json({
      data: json.data ?? [],
      matchCount: json.matchCount ?? 0,
      page: json.page ?? Number(page),
      perPage: json.perPage ?? Number(perPage),
    });
  } catch (err) {
    return Response.json(
      { error: "NETWORK", message: "전시 정보 서버에 연결하지 못했어요.", detail: String(err) },
      { status: 502 },
    );
  }
}
