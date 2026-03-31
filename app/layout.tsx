import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IPO 뉴스 대시보드",
  description: "더벨 · 딜사이트 주요 딜 뉴스 모니터링",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
