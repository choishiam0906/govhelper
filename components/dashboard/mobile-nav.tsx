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
    title: "지원서 관리",
    href: "/dashboard/applications",
    icon: FileText,
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

export function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-lg">G</span>
        </div>
        <span className="font-bold text-xl">GovHelper</span>
      </div>
      <nav className="flex-1 p-4" role="navigation" aria-label="모바일 주요 메뉴">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
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
        </div>
      </nav>
    </div>
  )
}
