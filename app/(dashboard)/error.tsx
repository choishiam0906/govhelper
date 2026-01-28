"use client";

/**
 * 대시보드 에러 바운더리 (Dashboard Error Boundary)
 *
 * 대시보드 영역의 에러를 캐치하여 처리합니다.
 * 사이드바는 유지하면서 에러 메시지를 표시합니다.
 *
 * 주요 기능:
 * - 대시보드 영역 에러 처리
 * - Sentry 에러 리포팅
 * - 사이드바 네비게이션 유지
 * - 피드백 제출 링크 제공
 */

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Home, RefreshCw, MessageSquare } from "lucide-react";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    // Sentry에 에러 전송
    Sentry.captureException(error, {
      tags: {
        errorType: "dashboard",
        digest: error.digest,
      },
      level: "error",
    });

    // 개발 환경에서 콘솔에 에러 출력
    if (process.env.NODE_ENV === "development") {
      console.error("Dashboard Error:", error);
    }
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {/* 에러 아이콘 */}
          <div className="flex justify-center mb-6">
            <div
              className="flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30"
              aria-hidden="true"
            >
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
          </div>

          {/* 에러 메시지 (해요체) */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
            문제가 발생했어요
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
            페이지를 불러오는 중 오류가 발생했습니다.
            <br />
            잠시 후 다시 시도해 주세요.
          </p>

          {/* 액션 버튼 */}
          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
              aria-label="페이지 다시 시도"
            >
              <RefreshCw className="w-5 h-5 mr-2" aria-hidden="true" />
              다시 시도
            </button>

            <Link
              href="/dashboard"
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
              aria-label="대시보드 홈으로 이동"
            >
              <Home className="w-5 h-5 mr-2" aria-hidden="true" />
              대시보드로 돌아가기
            </Link>

            <Link
              href="/dashboard/settings"
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
              aria-label="피드백 제출하기"
            >
              <MessageSquare className="w-5 h-5 mr-2" aria-hidden="true" />
              오류 신고하기
            </Link>
          </div>

          {/* 에러 상세 정보 (개발 환경) */}
          {process.env.NODE_ENV === "development" && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-2">
                에러 상세 정보 (개발 환경)
              </summary>
              <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-auto max-h-48">
                  <code>{error.stack || error.message}</code>
                </pre>
                {error.digest && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Error Digest: {error.digest}
                  </p>
                )}
              </div>
            </details>
          )}

          {/* 에러 코드 (프로덕션) */}
          {process.env.NODE_ENV !== "development" && error.digest && (
            <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500" role="status">
              오류 코드: {error.digest}
            </p>
          )}
        </div>

        {/* 도움말 텍스트 */}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          문제가 계속되면{" "}
          <a
            href="mailto:support@govhelpers.com"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            고객센터
          </a>
          로 문의해 주세요.
        </p>
      </div>
    </div>
  );
}
