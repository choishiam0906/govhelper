import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

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
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // 실험적 기능
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'recharts',
      'framer-motion',
      'zod',
      'react-hook-form',
      '@hookform/resolvers',
    ],
  },

  // 프로덕션 빌드 최적화
  compiler: {
    // 프로덕션에서 console.log 제거
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // HTTP 헤더 설정 (캐싱 및 보안)
  async headers() {
    return [
      {
        source: '/icons/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/(manifest.json|sw.js)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
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

// Bundle Analyzer와 Sentry를 함께 적용
export default withSentryConfig(withBundleAnalyzer(nextConfig), sentryWebpackPluginOptions);
