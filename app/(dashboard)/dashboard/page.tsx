import { createClient } from "@/lib/supabase/server"
import { getDashboardStats, getRecentAnnouncements } from "@/lib/queries/dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Search,
  TrendingUp,
  FileText,
  Bookmark,
  ArrowRight,
  Clock,
  CheckCircle,
  Crown,
  Building2,
} from "lucide-react"

// 출처 라벨
const sourceLabels: Record<string, string> = {
  bizinfo: '기업마당',
  kstartup: 'K-Startup',
  narajangteo: '나라장터',
  datagoKr: '공공데이터',
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  })
}

function getDaysLeft(endDate: string | null) {
  if (!endDate) return null
  const end = new Date(endDate)
  const today = new Date()
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 기업 정보 조회
  const { data: companyData } = await supabase
    .from('companies')
    .select('id, name')
    .eq('user_id', user!.id)
    .single()

  const company = companyData as { id: string; name: string } | null

  // 대시보드 통계 및 최근 공고 조회
  const [stats, recentAnnouncements] = await Promise.all([
    company ? getDashboardStats(supabase, user!.id, company.id) : null,
    getRecentAnnouncements(supabase, 5),
  ])

  const planLabels: Record<string, string> = {
    free: 'Free',
    pro: 'Pro',
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          안녕하세요, {company?.name || user?.user_metadata?.full_name || "사용자"}님
        </h1>
        <p className="text-muted-foreground mt-1">
          오늘도 좋은 기회를 찾아보세요.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">매칭 분석</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.matchesCount || 0}건</div>
            <p className="text-xs text-muted-foreground">
              {stats?.avgMatchScore ? `평균 ${stats.avgMatchScore}점` : '분석 내역 없음'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">작성 중 지원서</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inProgressApplications || 0}건</div>
            <p className="text-xs text-muted-foreground">
              총 {stats?.applicationsCount || 0}건 작성
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">관심 공고</CardTitle>
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.savedCount || 0}건</div>
            <p className="text-xs text-muted-foreground">
              저장된 공고
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">구독 상태</CardTitle>
            {stats?.subscription?.plan === 'free' ? (
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Crown className="h-4 w-4 text-yellow-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {planLabels[stats?.subscription?.plan || 'free']}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.subscription?.plan === 'free' ? (
                <Link href="/dashboard/billing" className="text-primary hover:underline">
                  업그레이드
                </Link>
              ) : (
                '구독 중'
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:border-primary transition-colors cursor-pointer">
          <Link href="/dashboard/announcements">
            <CardHeader>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">공고 검색</CardTitle>
              <CardDescription>
                최신 정부지원사업 공고를 검색하세요
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
        <Card className="hover:border-primary transition-colors cursor-pointer">
          <Link href="/dashboard/matching">
            <CardHeader>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">AI 매칭 분석</CardTitle>
              <CardDescription>
                우리 기업에 맞는 사업을 AI가 찾아드립니다
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
        <Card className="hover:border-primary transition-colors cursor-pointer">
          <Link href="/dashboard/applications">
            <CardHeader>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">지원서 작성</CardTitle>
              <CardDescription>
                AI가 지원서 초안을 작성해 드립니다
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Recent Announcements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>최신 공고</CardTitle>
            <CardDescription>최근 등록된 정부지원사업 공고입니다</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/announcements" className="gap-2">
              전체 보기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentAnnouncements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>아직 등록된 공고가 없어요</p>
              <Button variant="link" asChild className="mt-2">
                <Link href="/dashboard/announcements">공고 검색하기</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentAnnouncements.map((announcement) => {
                const daysLeft = getDaysLeft(announcement.application_end)
                return (
                  <div
                    key={announcement.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/dashboard/announcements/${announcement.id}`}
                          className="font-medium hover:text-primary truncate"
                        >
                          {announcement.title}
                        </Link>
                        <Badge variant="outline" className="shrink-0">
                          {sourceLabels[announcement.source] || announcement.source}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {announcement.organization && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {announcement.organization}
                          </span>
                        )}
                        {announcement.application_end && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {daysLeft !== null && daysLeft > 0
                              ? `D-${daysLeft}`
                              : formatDate(announcement.application_end)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" asChild className="shrink-0 ml-4">
                      <Link href={`/dashboard/announcements/${announcement.id}`}>
                        자세히
                      </Link>
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
