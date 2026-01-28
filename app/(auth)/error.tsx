"use client";

/**
 * 인증 에러 바운더리 (Auth Error Boundary)
 *
 * 인증 영역(로그인, 회원가입, 비밀번호 재설정 등)의 에러를 캐치하여 처리합니다.
 *
 * 주요 기능:
 * - 인증 관련 에러 처리 (세션 만료, 로그인 실패 등)
 * - Sentry 에러 리포팅
 * - 로그인 페이지로 안내
 */

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, LogIn, Home, RefreshCw } from "lucide-react";

interface AuthErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AuthError({ error, reset }: AuthErrorProps) {
  useEffect(() => {
    // Sentry에 에러 전송
    Sentry.captureException(error, {
      tags: {
        errorType: "auth",
        digest: error.digest,
      },
      level: "warning",
    });

    // 개발 환경에서 콘솔에 에러 출력
    if (process.env.NODE_ENV === "development") {
      console.error("Auth Error:", error);
    }
  }, [error]);

  // 에러 메시지에 따라 분류
  const isSessionExpired = error.message.toLowerCase().includes("session") ||
    error.message.toLowerCase().includes("token") ||
    error.message.toLowerCase().includes("expired");

  const isAuthFailed = error.message.toLowerCase().includes("auth") ||
    error.message.toLowerCase().includes("login") ||
    error.message.toLowerCase().includes("credential");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {/* 에러 아이콘 */}
          <div className="flex justify-center mb-6">
            <div
              className="flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30"
              aria-hidden="true"
            >
              <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
            </div>
          </div>

          {/* 에러 메시지 (해요체) */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
            {isSessionExpired && "세션이 만료됐어요"}
            {isAuthFailed && !isSessionExpired && "로그인 정보를 확인해 주세요"}
            {!isSessionExpired && !isAuthFailed && "인증에 문제가 발생했어요"}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
            {isSessionExpired && (
              <>
                로그인 세션이 만료되었습니다.
                <br />
                다시 로그인해 주세요.
              </>
            )}
            {isAuthFailed && !isSessionExpired && (
              <>
                로그인 정보가 올바르지 않습니다.
                <br />
                다시 시도해 주세요.
              </>
            )}
            {!isSessionExpired && !isAuthFailed && (
              <>
                인증 처리 중 오류가 발생했습니다.
                <br />
                잠시 후 다시 시도해 주세요.
              </>
            )}
          </p>

          {/* 액션 버튼 */}
          <div className="space-y-3">
            {!isSessionExpired && (
              <button
                onClick={reset}
                className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
                aria-label="페이지 다시 시도"
              >
                <RefreshCw className="w-5 h-5 mr-2" aria-hidden="true" />
                다시 시도
              </button>
            )}

            <Link
              href="/login"
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
              aria-label="로그인 페이지로 이동"
            >
              <LogIn className="w-5 h-5 mr-2" aria-hidden="true" />
              로그인 페이지로 이동
            </Link>

            <Link
              href="/"
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
              aria-label="홈으로 이동"
            >
              <Home className="w-5 h-5 mr-2" aria-hidden="true" />
              홈으로 돌아가기
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
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            계정이 없으신가요?{" "}
            <Link
              href="/register"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              회원가입
            </Link>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            비밀번호를 잊으셨나요?{" "}
            <Link
              href="/forgot-password"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              비밀번호 재설정
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
