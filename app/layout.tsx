import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ExhibitionProvider } from "@/components/ExhibitionProvider";
import Sidebar from "@/components/Sidebar";

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
          {/* 상단 제목 바 */}
          <header className="border-b border-black/10 dark:border-white/10">
            <div className="px-6 py-3">
              <Link href="/" className="flex items-center gap-4">
                {/* 회사 로고 (public/speedrack-logo.jpg) */}
                <img
                  src="/speedrack-logo.jpg"
                  alt="스피드랙 로고"
                  className="h-16 w-auto rounded bg-white p-0.5"
                />
                <span className="text-xl font-bold">
                  해외 전시회 통합 관리 시스템
                </span>
              </Link>
            </div>
          </header>

          {/* 왼쪽 사이드바 + 오른쪽 본문 */}
          <div className="flex flex-1">
            <Sidebar />
            <div className="flex-1">{children}</div>
          </div>
        </ExhibitionProvider>
      </body>
    </html>
  );
}
