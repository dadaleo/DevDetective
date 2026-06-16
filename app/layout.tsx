import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevDetective - 写代码前，先查 GitHub 有没有成熟轮子",
  description:
    "输入你的应用想法，自动寻找相似开源项目，判断是否值得 fork，并生成 Codex 开发提示词。",
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
