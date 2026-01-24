import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { JsonLd } from "@/components/seo/json-ld";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://govhelpers.com'),
  title: {
    default: "GovHelper - AI 기반 정부지원사업 매칭 플랫폼",
    template: "%s | GovHelper",
  },
  description: "AI가 분석하는 맞춤형 정부지원사업 매칭 서비스. 중소벤처24, 기업마당, K-Startup, 나라장터 공고를 통합 검색하고, 우리 기업에 딱 맞는 지원사업을 찾아드려요.",
  keywords: ["정부지원사업", "중소기업 지원", "스타트업 지원금", "AI 매칭", "사업계획서", "R&D 지원", "창업 지원", "중소벤처24", "기업마당"],
  authors: [{ name: "GovHelper" }],
  creator: "GovHelper",
  publisher: "GovHelper",
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://govhelpers.com",
    siteName: "GovHelper",
    title: "GovHelper - AI 기반 정부지원사업 매칭 플랫폼",
    description: "AI가 분석하는 맞춤형 정부지원사업 매칭 서비스. 우리 기업에 딱 맞는 지원사업을 찾아드려요.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "GovHelper - AI 정부지원사업 매칭",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GovHelper - AI 기반 정부지원사업 매칭 플랫폼",
    description: "AI가 분석하는 맞춤형 정부지원사업 매칭 서비스",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      "naver-site-verification": process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || "",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <JsonLd />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
