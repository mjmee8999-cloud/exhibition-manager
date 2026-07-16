import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ExhibitionProvider } from "@/components/ExhibitionProvider";
import AppFrame from "@/components/AppFrame";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "스피드랙 해외 전시회 통합 관리 시스템",
  description: "전시회 준비부터 사후 관리까지 한 곳에서",
};

// 휴대폰에서 화면 폭에 맞게 표시되도록 (모바일 대응)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* 전시회 정보를 앱 전체에서 공유하도록 감싸줍니다. */}
        <ExhibitionProvider>
          {/* 상단 바 + 사이드바 + 본문 (휴대폰에선 사이드바가 서랍으로 바뀜) */}
          <AppFrame>{children}</AppFrame>
        </ExhibitionProvider>
      </body>
    </html>
  );
}
