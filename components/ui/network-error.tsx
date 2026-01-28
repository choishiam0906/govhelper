"use client"

import { useEffect, useState } from "react"
import { WifiOffIcon, AlertCircleIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface NetworkErrorProps {
  /** 에러 타입 */
  type?: "offline" | "server" | "timeout"
  /** 재시도 콜백 */
  onRetry?: () => void | Promise<void>
  /** 자동 재시도 활성화 */
  autoRetry?: boolean
  /** 자동 재시도 대기 시간 (초) */
  retryDelay?: number
  /** 추가 CSS 클래스 */
  className?: string
  /** 컴팩트 모드 */
  compact?: boolean
}

/**
 * 네트워크 에러 컴포넌트
 *
 * 네트워크 연결 실패 시 사용자에게 친절한 안내와 재시도 옵션을 제공해요.
 *
 * @example
 * ```tsx
 * <NetworkError
 *   type="offline"
 *   onRetry={() => refetch()}
 *   autoRetry
 *   retryDelay={5}
 * />
 * ```
 */
export function NetworkError({
  type = "server",
  onRetry,
  autoRetry = false,
  retryDelay = 5,
  className,
  compact = false,
}: NetworkErrorProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [countdown, setCountdown] = useState(retryDelay)

  const config = {
    offline: {
      icon: WifiOffIcon,
      title: "인터넷 연결을 확인해 주세요",
      description: "네트워크 연결 상태를 확인한 후 다시 시도해 주세요",
      iconColor: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
    },
    server: {
      icon: AlertCircleIcon,
      title: "잠시 후 다시 시도해 주세요",
      description: "서버와의 연결에 문제가 생겼어요. 곧 복구될 거예요",
      iconColor: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950/20",
    },
    timeout: {
      icon: AlertCircleIcon,
      title: "요청 시간이 초과되었어요",
      description: "응답 시간이 너무 오래 걸렸어요. 다시 시도해 주세요",
      iconColor: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    },
  }

  const { icon: Icon, title, description, iconColor, bgColor } = config[type]

  // 자동 재시도 카운트다운
  useEffect(() => {
    if (!autoRetry || !onRetry) return

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      handleRetry()
    }
  }, [autoRetry, countdown, onRetry])

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return

    setIsRetrying(true)
    try {
      await onRetry()
    } catch (error) {
      console.error("재시도 실패:", error)
    } finally {
      setIsRetrying(false)
      if (autoRetry) {
        setCountdown(retryDelay) // 재시도 실패 시 카운트다운 재설정
      }
    }
  }

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-6" : "py-10",
        className
      )}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div
        className={cn(
          "rounded-full flex items-center justify-center mb-4",
          bgColor,
          compact ? "size-12" : "size-16"
        )}
        aria-hidden="true"
      >
        <Icon
          className={cn(iconColor, compact ? "size-6" : "size-8")}
          aria-hidden="true"
        />
      </div>

      <h3
        className={cn(
          "font-semibold text-foreground mb-2",
          compact ? "text-sm" : "text-base"
        )}
      >
        {title}
      </h3>

      <p
        className={cn(
          "text-muted-foreground max-w-md mb-6",
          compact ? "text-xs" : "text-sm"
        )}
      >
        {description}
      </p>

      {onRetry && (
        <Button
          onClick={handleRetry}
          disabled={isRetrying}
          variant="outline"
          size={compact ? "sm" : "default"}
          aria-label={
            autoRetry && countdown > 0
              ? `${countdown}초 후 자동으로 다시 시도해요`
              : "다시 시도하기"
          }
        >
          <RefreshCwIcon
            className={cn("mr-2", compact ? "size-3" : "size-4", {
              "animate-spin": isRetrying,
            })}
            aria-hidden="true"
          />
          {isRetrying
            ? "재시도 중..."
            : autoRetry && countdown > 0
            ? `다시 시도 (${countdown}초)`
            : "다시 시도"}
        </Button>
      )}
    </div>
  )

  if (compact) {
    return content
  }

  return (
    <Card className="border-destructive/20">
      <CardContent className="p-0">{content}</CardContent>
    </Card>
  )
}
