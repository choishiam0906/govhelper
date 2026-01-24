// Next.js Instrumentation 파일
// 서버 시작 시 Sentry를 초기화합니다.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Node.js 런타임 (API Routes, Server Components)
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Edge 런타임 (Middleware, Edge API Routes)
    await import("./sentry.edge.config");
  }
}

// 에러 핸들링 훅
export const onRequestError = async (
  error: Error,
  request: Request,
  context: { routerKind: string; routePath: string; routeType: string }
) => {
  const Sentry = await import("@sentry/nextjs");

  Sentry.captureException(error, {
    tags: {
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
    },
    extra: {
      url: request.url,
      method: request.method,
    },
  });
};
