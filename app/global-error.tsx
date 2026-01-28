"use client";

/**
 * 전역 에러 바운더리 (Global Error Boundary)
 *
 * 앱의 최상위 에러를 캐치하여 처리합니다.
 * app/error.tsx가 에러를 캐치하지 못했을 때 마지막 방어선 역할을 합니다.
 *
 * 주요 기능:
 * - 복구 불가능한 전역 에러 처리
 * - Sentry 에러 리포팅
 * - 사용자에게 친화적인 에러 메시지 표시 (해요체)
 * - 개발 환경에서 에러 상세 정보 표시
 */

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Sentry에 에러 전송
    Sentry.captureException(error, {
      tags: {
        errorType: "global",
        digest: error.digest,
      },
      level: "fatal",
    });

    // 개발 환경에서 콘솔에 에러 출력
    if (process.env.NODE_ENV === "development") {
      console.error("Global Error:", error);
    }
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              {/* 에러 아이콘 */}
              <div className="mb-6">
                <div
                  className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100"
                  aria-hidden="true"
                >
                  <svg
                    className="h-8 w-8 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>

              {/* 에러 메시지 (해요체) */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                문제가 발생했어요
              </h1>
              <p className="text-gray-600 mb-6">
                예상치 못한 오류가 발생했습니다.
                <br />
                잠시 후 다시 시도해 주세요.
              </p>

              {/* 액션 버튼 */}
              <div className="space-y-3">
                <button
                  onClick={reset}
                  className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  aria-label="페이지 다시 시도"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  다시 시도
                </button>

                <a
                  href="/"
                  className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  aria-label="홈으로 이동"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  홈으로 돌아가기
                </a>
              </div>

              {/* 에러 상세 정보 (개발 환경에서만 표시) */}
              {process.env.NODE_ENV === "development" && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                    에러 상세 정보 (개발 환경)
                  </summary>
                  <div className="mt-2 p-4 bg-gray-50 rounded-md">
                    <pre className="text-xs text-gray-800 overflow-auto max-h-40">
                      <code>{error.stack || error.message}</code>
                    </pre>
                    {error.digest && (
                      <p className="mt-2 text-xs text-gray-500">
                        Error Digest: {error.digest}
                      </p>
                    )}
                  </div>
                </details>
              )}

              {/* 에러 코드 (프로덕션) */}
              {process.env.NODE_ENV !== "development" && error.digest && (
                <p className="mt-6 text-xs text-gray-400" role="status">
                  오류 코드: {error.digest}
                </p>
              )}

              {/* 고객 지원 안내 */}
              <p className="mt-6 text-sm text-gray-500">
                문제가 계속되면{" "}
                <a
                  href="mailto:support@govhelpers.com"
                  className="text-blue-600 hover:text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  고객센터
                </a>
                로 문의해 주세요.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
