"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Search,
  TrendingUp,
  FileText,
  Building2,
  CreditCard,
  Settings,
  Shield,
  ClipboardList,
  Calendar,
  GitCompare,
  Bookmark,
  FolderOpen,
  BarChart3,
} from "lucide-react"

const navItems = [
  {
    title: "대시보드",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "공고 검색",
    href: "/dashboard/announcements",
    icon: Search,
  },
  {
    title: "AI 매칭",
    href: "/dashboard/matching",
    icon: TrendingUp,
  },
  {
    title: "저장된 공고",
    href: "/dashboard/saved",
    icon: Bookmark,
  },
  {
    title: "지원 이력",
    href: "/dashboard/tracking",
    icon: ClipboardList,
  },
  {
    title: "지원 일정",
    href: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    title: "공고 비교",
    href: "/dashboard/compare",
    icon: GitCompare,
  },
  {
    title: "트렌드 분석",
    href: "/dashboard/trends",
    icon: BarChart3,
  },
  {
    title: "지원서 관리",
    href: "/dashboard/applications",
    icon: FileText,
  },
  {
    title: "지원서 템플릿",
    href: "/dashboard/templates",
    icon: FolderOpen,
  },
  {
    title: "기업 프로필",
    href: "/dashboard/profile",
    icon: Building2,
  },
  {
    title: "구독/결제",
    href: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    title: "설정",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

interface DashboardNavProps {
  userEmail?: string
}

// 관리자 이메일 목록
const ADMIN_EMAILS = ['choishiam@gmail.com']

export function DashboardNav({ userEmail }: DashboardNavProps) {
  const pathname = usePathname()
  const isAdmin = userEmail && ADMIN_EMAILS.includes(userEmail)

  return (
    <nav className="hidden lg:flex flex-col w-64 min-w-[256px] flex-shrink-0 border-r bg-card min-h-[calc(100vh-64px)] p-4" role="navigation" aria-label="주요 메뉴">
      <div className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.title}
            </Link>
          )
        })}

        {/* 관리자 메뉴 */}
        {isAdmin && (
          <>
            <div className="my-4 border-t" role="separator" aria-label="관리자 메뉴 구분선" />
            <Link
              href="/admin/payments"
              aria-current={pathname === "/admin/payments" ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors whitespace-nowrap",
                pathname === "/admin/payments"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Shield className="h-4 w-4" aria-hidden="true" />
              관리자 페이지
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
