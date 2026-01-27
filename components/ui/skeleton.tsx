import { cn } from "@/lib/utils"

// 기본 Skeleton 컴포넌트 (다크 모드 지원)
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted animate-pulse rounded-md dark:bg-muted/50", className)}
      {...props}
    />
  )
}

// 텍스트 로딩용 Skeleton
function SkeletonText({
  lines = 3,
  className
}: {
  lines?: number;
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-2/3" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

// 공고 카드 로딩용 Skeleton (SkeletonCard 별칭)
function SkeletonCard() {
  return (
    <div className="border rounded-xl p-6 space-y-4 bg-card shadow-sm">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )
}

// 공고 카드 Skeleton (기존 호환성 유지)
const AnnouncementCardSkeleton = SkeletonCard

// 공고 목록 Skeleton
function AnnouncementListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// 테이블 행 Skeleton
function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b dark:border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

// 테이블 Skeleton
function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <table className="w-full">
        <thead className="bg-muted/50 dark:bg-muted/30">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-4 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// 기존 호환성
const TableSkeleton = SkeletonTable

// 통계 카드 Skeleton
function StatCardSkeleton() {
  return (
    <div className="border rounded-xl p-6 space-y-3 bg-card shadow-sm">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

// 대시보드 통계 Skeleton
function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

// 매칭 결과 카드 Skeleton
function MatchingResultSkeleton() {
  return (
    <div className="border rounded-xl p-6 space-y-4 bg-card shadow-sm">
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-16 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
  )
}

// 프로필 폼 Skeleton
function ProfileFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-32 rounded-md" />
    </div>
  )
}

// 페이지 로딩 Skeleton (전체 화면)
function PageLoadingSkeleton({ title }: { title?: string }) {
  return (
    <div className="container py-8 space-y-6">
      <Skeleton className="h-8 w-48" />
      {title && <p className="text-muted-foreground">{title}</p>}
      <div className="space-y-4">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  )
}

// 리스트 아이템 Skeleton
function ListItemSkeleton() {
  return (
    <div className="flex items-center space-x-4 py-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

// 리스트 Skeleton
function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y dark:divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  )
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  AnnouncementCardSkeleton,
  AnnouncementListSkeleton,
  TableRowSkeleton,
  TableSkeleton,
  StatCardSkeleton,
  DashboardStatsSkeleton,
  MatchingResultSkeleton,
  ProfileFormSkeleton,
  PageLoadingSkeleton,
  ListItemSkeleton,
  ListSkeleton,
}
