// Sentry 클라이언트 사이드 설정
// 브라우저에서 발생하는 에러를 추적합니다.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 프로덕션에서만 활성화
  enabled: process.env.NODE_ENV === "production",

  // 성능 모니터링 (트랜잭션 샘플링)
  tracesSampleRate: 0.1, // 10% 샘플링 (비용 절감)

  // 세션 리플레이 (에러 발생 시 사용자 행동 재현)
  replaysSessionSampleRate: 0.01, // 1% 일반 세션
  replaysOnErrorSampleRate: 1.0, // 에러 발생 시 100% 캡처

  // 디버그 모드 (개발 시에만)
  debug: false,

  // 환경 구분
  environment: process.env.NODE_ENV,

  // 민감한 정보 필터링
  beforeSend(event) {
    // 비밀번호, 토큰 등 민감한 데이터 제거
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
    }
    return event;
  },

  // 무시할 에러 패턴
  ignoreErrors: [
    // 네트워크 관련 일반적인 에러
    "Network Error",
    "Failed to fetch",
    "Load failed",
    "NetworkError",
    // 브라우저 확장 프로그램 관련
    "chrome-extension://",
    "moz-extension://",
    // 취소된 요청
    "AbortError",
    "The operation was aborted",
    // ResizeObserver 관련 (일반적으로 무해)
    "ResizeObserver loop",
  ],

  // 통합 기능
  integrations: [
    Sentry.replayIntegration({
      // 세션 리플레이에서 민감한 정보 마스킹
      maskAllText: false,
      maskAllInputs: true,
      blockAllMedia: false,
    }),
  ],
});
