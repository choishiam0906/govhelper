import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard/nav"
import { DashboardHeader } from "@/components/dashboard/header"

// 관리자 이메일 목록
const ADMIN_EMAILS = ['choishiam@gmail.com']

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const isAdmin = ADMIN_EMAILS.includes(user.email || '')

  // 현재 경로 확인
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || ""
  const isOnboarding = pathname.includes("/onboarding")
  const isAdminPage = pathname.includes("/admin")

  // 관리자가 아닌 경우에만 기업 정보 체크
  // 관리자는 온보딩 없이 관리자 페이지 접근 가능
  if (!isOnboarding && !isAdmin && !isAdminPage) {
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!company) {
      redirect("/onboarding")
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardHeader user={user} />
      <div className="flex">
        <DashboardNav />
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
