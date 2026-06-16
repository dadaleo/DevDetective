import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevDetective - Search GitHub before you build from scratch",
  description:
    "Investigate similar GitHub projects before building from scratch, compare maintenance and license signals, and generate follow-up prompts for AI coding tools.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
