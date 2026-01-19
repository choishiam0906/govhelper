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
  const isProfilePage = pathname.includes("/dashboard/profile")
  const isSettingsPage = pathname.includes("/dashboard/settings")

  // 기업 프로필 필수 체크
  // 예외: 온보딩, 관리자 페이지, 프로필 페이지, 설정 페이지
  const isExemptFromCompanyCheck = isOnboarding || isAdmin || isAdminPage || isProfilePage || isSettingsPage

  if (!isExemptFromCompanyCheck) {
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!company) {
      redirect("/dashboard/profile")
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardHeader user={user} />
      <div className="flex">
        <DashboardNav userEmail={user.email} />
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
