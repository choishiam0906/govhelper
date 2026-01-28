/**
 * 전역 404 페이지 (Global Not Found Page)
 *
 * 존재하지 않는 경로에 접근했을 때 표시되는 페이지입니다.
 *
 * 주요 기능:
 * - 친화적인 404 에러 메시지 (해요체)
 * - 주요 페이지로 이동할 수 있는 링크 제공
 * - 검색 제안
 * - SEO 최적화
 */

import Link from "next/link";
import { Home, Search, FileText, HelpCircle } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없어요",
  description: "요청하신 페이지를 찾을 수 없습니다. URL을 확인해 주세요.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 텍스트 */}
        <div className="mb-8">
          <h1
            className="text-9xl font-bold text-gray-200 dark:text-gray-700"
            aria-hidden="true"
          >
            404
          </h1>
          <div className="-mt-16">
            <div className="text-6xl mb-4" aria-hidden="true">
              🔍
            </div>
          </div>
        </div>

        {/* 에러 메시지 (해요체) */}
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          페이지를 찾을 수 없어요
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          요청하신 페이지가 존재하지 않거나 이동했습니다.
          <br />
          URL을 다시 확인해 주세요.
        </p>

        {/* 링크 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link
            href="/"
            className="flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            aria-label="홈으로 이동"
          >
            <Home className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium">홈으로 이동</span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-3 px-6 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            aria-label="대시보드로 이동"
          >
            <FileText className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium">대시보드</span>
          </Link>

          <Link
            href="/dashboard/announcements"
            className="flex items-center justify-center gap-3 px-6 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            aria-label="공고 검색으로 이동"
          >
            <Search className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium">공고 검색</span>
          </Link>

          <Link
            href="/about"
            className="flex items-center justify-center gap-3 px-6 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            aria-label="서비스 소개로 이동"
          >
            <HelpCircle className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium">서비스 소개</span>
          </Link>
        </div>

        {/* 도움말 */}
        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            💡 이런 경우일 수 있어요
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 text-left max-w-md mx-auto">
            <li>• URL에 오타가 있는지 확인해 주세요</li>
            <li>• 삭제되거나 이동한 페이지일 수 있어요</li>
            <li>• 북마크가 오래된 것은 아닌지 확인해 주세요</li>
            <li>• 권한이 필요한 페이지일 수 있어요</li>
          </ul>
        </div>

        {/* 고객 지원 */}
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
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
