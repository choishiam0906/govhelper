import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Turbopack 설정 (빈 객체로 설정하여 Turbopack 사용)
  turbopack: {},

  // 패키지 외부화 (서버에서만 사용하는 패키지를 클라이언트 번들에서 제외)
  serverExternalPackages: ['@google/generative-ai', 'jszip', 'cheerio'],

  // 이미지 최적화
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  // 프로덕션 빌드 최적화
  compiler: {
    // 프로덕션에서 console.log 제거
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

// Sentry 설정 옵션
const sentryWebpackPluginOptions = {
  // 소스맵 업로드 (에러 스택트레이스에 원본 코드 표시)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // 빌드 시에만 소스맵 업로드
  silent: !process.env.CI,

  // 프로덕션 빌드에서만 소스맵 생성
  widenClientFileUpload: true,

  // 소스맵 숨기기 (프로덕션에서 소스맵 노출 방지)
  hideSourceMaps: true,

  // 터널링 (광고 차단기 우회)
  tunnelRoute: "/monitoring",
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
