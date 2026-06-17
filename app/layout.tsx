import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ai2work.xyz";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "DevDetective - Search GitHub before you build from scratch",
  description:
    "Investigate similar GitHub projects before building from scratch, compare maintenance and license signals, and generate follow-up prompts for AI coding tools.",
  openGraph: {
    title: "DevDetective",
    description:
      "Investigate similar GitHub projects before building from scratch, compare maintenance and license signals, and generate follow-up prompts for AI coding tools.",
    images: [{ url: basePath ? `${basePath}/devdetective-logo.png` : "/devdetective-logo.png" }],
  },
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
