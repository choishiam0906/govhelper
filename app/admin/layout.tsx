import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { LayoutDashboard, CreditCard, Users, ArrowLeft, ClipboardCheck, BarChart3, MessageSquare, LineChart, Mail } from "lucide-react"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'choishiam@gmail.com').split(',').map(e => e.trim())

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-card border-r p-4">
          <div className="mb-8">
            <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              대시보드로 돌아가기
            </Link>
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5" />
              관리자
            </h2>
          </div>

          <nav className="space-y-2">
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              대시보드
            </Link>
            <Link
              href="/admin/approvals"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ClipboardCheck className="w-4 h-4" />
              승인 관리
            </Link>
            <Link
              href="/admin/payments"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              결제 관리
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Users className="w-4 h-4" />
              사용자 관리
            </Link>
            <Link
              href="/admin/feedback"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              피드백 관리
            </Link>
            <Link
              href="/admin/utm"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <LineChart className="w-4 h-4" />
              UTM 분석
            </Link>
            <Link
              href="/admin/newsletter"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Mail className="w-4 h-4" />
              뉴스레터
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
