// Sentry 서버 사이드 설정
// API Routes, Server Components에서 발생하는 에러를 추적합니다.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 프로덕션에서만 활성화
  enabled: process.env.NODE_ENV === "production",

  // 성능 모니터링
  tracesSampleRate: 0.1, // 10% 샘플링

  // 디버그 모드
  debug: false,

  // 환경 구분
  environment: process.env.NODE_ENV,

  // 민감한 정보 필터링
  beforeSend(event) {
    // 요청 헤더에서 민감한 정보 제거
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
      delete event.request.headers["x-supabase-auth"];
    }

    // 요청 바디에서 민감한 정보 제거
    if (event.request?.data) {
      const data = event.request.data;
      if (typeof data === "string") {
        try {
          const parsed = JSON.parse(data);
          if (parsed.password) parsed.password = "[REDACTED]";
          if (parsed.token) parsed.token = "[REDACTED]";
          if (parsed.apiKey) parsed.apiKey = "[REDACTED]";
          event.request.data = JSON.stringify(parsed);
        } catch {
          // JSON 파싱 실패 시 무시
        }
      }
    }

    return event;
  },

  // 무시할 에러
  ignoreErrors: [
    // Supabase 인증 관련 일반적인 에러
    "Invalid login credentials",
    "Email not confirmed",
    // Rate limiting
    "Too Many Requests",
  ],
});
