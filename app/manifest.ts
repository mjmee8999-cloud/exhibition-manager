// 웹 앱 매니페스트(PWA) — 이 파일이 있으면 Next.js가 자동으로
//   <link rel="manifest" href="/manifest.webmanifest"> 를 넣어줍니다.
// 이 덕분에 휴대폰 브라우저에서 "홈 화면에 추가"를 하면
//   주소창 없는 전체화면 앱처럼 열립니다(아이콘 = public/icon-*.png).

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "해외 전시회 통합 관리 시스템",
    short_name: "전시회 관리",
    description: "전시회 준비부터 사후 관리까지 한 곳에서",
    start_url: "/",
    display: "standalone", // 주소창 없이 앱처럼
    background_color: "#ffffff",
    theme_color: "#2563eb",
    lang: "ko",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
