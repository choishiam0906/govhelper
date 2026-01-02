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

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden lg:flex flex-col w-64 border-r bg-card min-h-[calc(100vh-64px)] p-4">
      <div className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ))}
      </div>
    </nav>
  )
}
