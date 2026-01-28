import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  /** 아이콘 컴포넌트 */
  icon?: LucideIcon
  /** 제목 (해요체) */
  title: string
  /** 설명 (해요체) */
  description?: string
  /** 액션 버튼 */
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "secondary"
  }
  /** 추가 CSS 클래스 */
  className?: string
  /** 컴팩트 모드 (카드 없이 표시) */
  compact?: boolean
}

/**
 * 빈 상태 컴포넌트
 *
 * 데이터가 없을 때 사용자에게 친근한 안내 메시지를 표시해요.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={FileTextIcon}
 *   title="저장한 공고가 없어요"
 *   description="관심 있는 공고를 저장해 보세요"
 *   action={{
 *     label: "공고 둘러보기",
 *     onClick: () => router.push('/dashboard/announcements')
 *   }}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8" : "py-12",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={title}
    >
      {Icon && (
        <div
          className={cn(
            "rounded-full bg-muted flex items-center justify-center mb-4",
            compact ? "size-12" : "size-16"
          )}
          aria-hidden="true"
        >
          <Icon
            className={cn(
              "text-muted-foreground",
              compact ? "size-6" : "size-8"
            )}
          />
        </div>
      )}

      <h3
        className={cn(
          "font-semibold text-foreground mb-2",
          compact ? "text-base" : "text-lg"
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            "text-muted-foreground max-w-md",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {description}
        </p>
      )}

      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || "default"}
          className="mt-6"
          size={compact ? "sm" : "default"}
        >
          {action.label}
        </Button>
      )}
    </div>
  )

  if (compact) {
    return content
  }

  return (
    <Card className="border-dashed">
      <CardContent className="p-0">{content}</CardContent>
    </Card>
  )
}
