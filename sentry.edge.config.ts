// Sentry Edge 런타임 설정
// Middleware, Edge API Routes에서 발생하는 에러를 추적합니다.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 프로덕션에서만 활성화
  enabled: process.env.NODE_ENV === "production",

  // 성능 모니터링
  tracesSampleRate: 0.1,

  // 디버그 모드
  debug: false,

  // 환경 구분
  environment: process.env.NODE_ENV,
});
