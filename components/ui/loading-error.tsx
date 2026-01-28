"use client"

import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface LoadingErrorProps {
  /** 에러 제목 (해요체) */
  title?: string
  /** 에러 메시지 (해요체) */
  message?: string
  /** 재시도 콜백 */
  onRetry?: () => void | Promise<void>
  /** 추가 CSS 클래스 */
  className?: string
  /** 컴팩트 모드 (위젯/카드용) */
  compact?: boolean
  /** Alert 스타일 (경량) */
  variant?: "alert" | "card"
}

/**
 * 로딩 에러 컴포넌트
 *
 * 페이지나 섹션 로딩이 실패했을 때 표시하는 에러 UI예요.
 *
 * @example
 * // 카드/위젯용 컴팩트 버전
 * ```tsx
 * <LoadingError
 *   compact
 *   title="공고를 불러올 수 없어요"
 *   message="잠시 후 다시 시도해 주세요"
 *   onRetry={() => refetch()}
 * />
 * ```
 *
 * @example
 * // 전체 페이지용 Alert 스타일
 * ```tsx
 * <LoadingError
 *   variant="alert"
 *   title="데이터 로딩 실패"
 *   message="서버와의 연결에 문제가 생겼어요"
 *   onRetry={() => window.location.reload()}
 * />
 * ```
 */
export function LoadingError({
  title = "데이터를 불러올 수 없어요",
  message = "잠시 후 다시 시도해 주세요",
  onRetry,
  className,
  compact = false,
  variant = "card",
}: LoadingErrorProps) {
  // Alert 스타일 (경량)
  if (variant === "alert") {
    return (
      <div
        className={cn(
          "relative w-full rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 px-4 py-3",
          className
        )}
        role="alert"
      >
        <div className="flex gap-3">
          <AlertTriangleIcon className="size-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <h5 className="font-medium text-sm text-red-900 dark:text-red-200 mb-1">{title}</h5>
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">{message}</p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                <RefreshCwIcon className="mr-2 size-3" aria-hidden="true" />
                다시 불러오기
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 컴팩트 모드 (카드 내부용)
  if (compact) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center text-center py-6 px-4",
          className
        )}
        role="alert"
        aria-live="polite"
      >
        <div
          className="rounded-full bg-destructive/10 size-10 flex items-center justify-center mb-3"
          aria-hidden="true"
        >
          <AlertTriangleIcon className="size-5 text-destructive" />
        </div>

        <h4 className="text-sm font-semibold text-foreground mb-1">{title}</h4>

        <p className="text-xs text-muted-foreground mb-4">{message}</p>

        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCwIcon className="mr-2 size-3" aria-hidden="true" />
            다시 불러오기
          </Button>
        )}
      </div>
    )
  }

  // 기본 카드 스타일
  return (
    <Card className={cn("border-destructive/20", className)} role="alert">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div
            className="rounded-full bg-destructive/10 size-8 flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <AlertTriangleIcon className="size-4 text-destructive" />
          </div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{message}</p>

        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCwIcon className="mr-2 size-4" aria-hidden="true" />
            다시 불러오기
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
