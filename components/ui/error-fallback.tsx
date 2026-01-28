/**
 * 컴포넌트 레벨 에러 폴백
 *
 * 개별 컴포넌트에서 발생하는 에러를 처리하기 위한 재사용 가능한 폴백 UI입니다.
 * React Error Boundary와 함께 사용하거나 단독으로 사용할 수 있습니다.
 *
 * 주요 기능:
 * - 레이아웃을 깨트리지 않는 최소한의 에러 UI
 * - 재시도 기능 제공
 * - 에러 상세 정보 표시 옵션 (개발 환경)
 * - 커스터마이징 가능한 제목, 메시지, 액션
 */

import { AlertCircle, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ErrorFallbackProps {
  /** 에러 객체 */
  error?: Error;
  /** 에러 제목 */
  title?: string;
  /** 에러 메시지 */
  message?: string;
  /** 재시도 핸들러 */
  onRetry?: () => void;
  /** 에러 상세 정보 표시 여부 (기본: 개발 환경에서만) */
  showDetails?: boolean;
  /** 크기 (기본: default) */
  size?: "sm" | "default" | "lg";
  /** 아이콘 표시 여부 (기본: true) */
  showIcon?: boolean;
}

/**
 * 에러 폴백 컴포넌트
 *
 * @example
 * ```tsx
 * // 기본 사용법
 * <ErrorFallback
 *   title="데이터를 불러올 수 없어요"
 *   message="네트워크 연결을 확인해 주세요"
 *   onRetry={() => refetch()}
 * />
 *
 * // Error Boundary와 함께
 * <ErrorBoundary FallbackComponent={ErrorFallback}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export function ErrorFallback({
  error,
  title = "문제가 발생했어요",
  message = "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  onRetry,
  showDetails,
  size = "default",
  showIcon = true,
}: ErrorFallbackProps) {
  const sizeClasses = {
    sm: "p-4 text-sm",
    default: "p-6 text-base",
    lg: "p-8 text-lg",
  };

  const iconSizes = {
    sm: "h-8 w-8",
    default: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const shouldShowDetails =
    showDetails ?? process.env.NODE_ENV === "development";

  return (
    <div
      className={`w-full bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg ${sizeClasses[size]}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        {/* 에러 아이콘 */}
        {showIcon && (
          <div
            className={`flex-shrink-0 ${iconSizes[size]} flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30`}
            aria-hidden="true"
          >
            <XCircle className="h-1/2 w-1/2 text-red-600 dark:text-red-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* 에러 제목 */}
          <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">
            {title}
          </h3>

          {/* 에러 메시지 */}
          <p className="text-red-700 dark:text-red-300 mb-3">{message}</p>

          {/* 재시도 버튼 */}
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size={size === "sm" ? "sm" : "default"}
              className="mt-2"
              aria-label="다시 시도"
            >
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
              다시 시도
            </Button>
          )}

          {/* 에러 상세 정보 (개발 환경) */}
          {shouldShowDetails && error && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-red-800 dark:text-red-300 hover:text-red-900 dark:hover:text-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1">
                에러 상세 정보 (개발 환경)
              </summary>
              <div className="mt-2 p-3 bg-white dark:bg-gray-900 rounded border border-red-200 dark:border-red-800">
                <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-auto max-h-32">
                  <code>{error.stack || error.message}</code>
                </pre>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 작은 크기의 인라인 에러 폴백
 *
 * @example
 * ```tsx
 * <InlineError message="데이터를 불러올 수 없어요" />
 * ```
 */
export function InlineError({ message }: { message: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded"
      role="alert"
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

/**
 * 빈 상태 에러 폴백 (데이터 없음)
 *
 * @example
 * ```tsx
 * <EmptyState
 *   title="공고가 없어요"
 *   message="조건에 맞는 공고를 찾을 수 없습니다"
 * />
 * ```
 */
export function EmptyState({
  title = "데이터가 없어요",
  message = "표시할 내용이 없습니다",
  icon: Icon = AlertCircle,
  action,
}: {
  title?: string;
  message?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      role="status"
    >
      <div
        className="flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4"
        aria-hidden="true"
      >
        <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-sm">
        {message}
      </p>
      {action}
    </div>
  );
}
