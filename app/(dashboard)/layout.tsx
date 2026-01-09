import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard/nav"
import { DashboardHeader } from "@/components/dashboard/header"

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

  // 현재 경로 확인
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || ""
  const isOnboarding = pathname.includes("/onboarding")

  // 기업 정보가 없으면 온보딩으로 리다이렉트 (온보딩 페이지 제외)
  if (!isOnboarding) {
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
