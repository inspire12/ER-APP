import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "응급실 스마트 퇴원 안내",
  description: "의료진이 확인하고 승인하는 모바일 퇴원 안내",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
