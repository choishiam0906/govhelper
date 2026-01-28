/**
 * 대시보드 404 페이지 (Dashboard Not Found Page)
 *
 * 대시보드 영역 내에서 존재하지 않는 경로에 접근했을 때 표시되는 페이지입니다.
 * 사이드바 네비게이션은 유지됩니다.
 *
 * 주요 기능:
 * - 대시보드 컨텍스트에 맞는 404 메시지
 * - 주요 대시보드 페이지로 이동 링크
 * - 사이드바 유지
 */

import Link from "next/link";
import { Home, Search, FileText, TrendingUp, Settings } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없어요",
  description: "요청하신 대시보드 페이지를 찾을 수 없습니다.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardNotFound() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 텍스트 */}
        <div className="mb-8">
          <h1
            className="text-8xl font-bold text-gray-200 dark:text-gray-700"
            aria-hidden="true"
          >
            404
          </h1>
          <div className="-mt-12">
            <div className="text-5xl mb-4" aria-hidden="true">
              📄
            </div>
          </div>
        </div>

        {/* 에러 메시지 (해요체) */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          페이지를 찾을 수 없어요
        </h2>
        <p className="text-base text-gray-600 dark:text-gray-300 mb-8">
          요청하신 대시보드 페이지가 존재하지 않거나 이동했습니다.
          <br />
          URL을 다시 확인해 주세요.
        </p>

        {/* 링크 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-3 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
            aria-label="대시보드 홈으로 이동"
          >
            <Home className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium">대시보드 홈</span>
          </Link>

          <Link
            href="/dashboard/announcements"
            className="flex items-center justify-center gap-3 px-5 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
            aria-label="공고 검색으로 이동"
          >
            <Search className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium">공고 검색</span>
          </Link>

          <Link
            href="/dashboard/matching"
            className="flex items-center justify-center gap-3 px-5 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
            aria-label="AI 매칭으로 이동"
          >
            <TrendingUp className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium">AI 매칭</span>
          </Link>

          <Link
            href="/dashboard/applications"
            className="flex items-center justify-center gap-3 px-5 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
            aria-label="지원서 관리로 이동"
          >
            <FileText className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium">지원서 관리</span>
          </Link>
        </div>

        {/* 도움말 */}
        <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
            💡 자주 찾는 페이지
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              기업 프로필
            </Link>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              결제 관리
            </Link>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" aria-hidden="true" />
              설정
            </Link>
          </div>
        </div>

        {/* 고객 지원 */}
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
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
