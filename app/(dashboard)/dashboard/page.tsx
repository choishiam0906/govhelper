import { createClient } from "@/lib/supabase/server"
import { getDashboardStats, getRecentAnnouncements, PLAN_INFO, PlanType } from "@/lib/queries/dashboard"
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
  AlertTriangle,
  Bell,
  Calendar,
  Edit,
  ExternalLink,
} from "lucide-react"
import { RecommendedAnnouncements } from "@/components/recommendations/recommended-announcements"
import { DashboardWidgets } from "@/components/dashboard/dashboard-widgets"

// 출처 라벨
const sourceLabels: Record<string, string> = {
  bizinfo: '기업마당',
  kstartup: 'K-Startup',
  narajangteo: '나라장터',
  g2b: '나라장터',
  smes: '중소벤처24',
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

function getDeadlineBadgeVariant(daysLeft: number | null): 'destructive' | 'secondary' | 'outline' {
  if (daysLeft === null) return 'outline'
  if (daysLeft <= 3) return 'destructive'
  if (daysLeft <= 7) return 'secondary'
  return 'outline'
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

  // 오늘 날짜 (마감 7일 이내 필터링용)
  const today = new Date()
  const sevenDaysLater = new Date(today)
  sevenDaysLater.setDate(today.getDate() + 7)

  // 대시보드 통계 및 최근 공고 조회
  const [stats, recentAnnouncements, urgentSavedResult, inProgressAppsResult] = await Promise.all([
    company ? getDashboardStats(supabase, user!.id, company.id) : null,
    getRecentAnnouncements(supabase, 5),
    // 마감 임박 저장 공고 (7일 이내)
    supabase
      .from('saved_announcements')
      .select(`
        id,
        announcements (
          id,
          title,
          organization,
          application_end,
          source
        )
      `)
      .eq('user_id', user!.id)
      .gte('announcements.application_end', today.toISOString().split('T')[0])
      .lte('announcements.application_end', sevenDaysLater.toISOString().split('T')[0])
      .order('announcements(application_end)', { ascending: true })
      .limit(5),
    // 진행 중인 지원서
    supabase
      .from('applications')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        announcements (
          id,
          title,
          organization,
          application_end
        )
      `)
      .eq('user_id', user!.id)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(5),
  ])

  // 마감 임박 공고 필터링 (유효한 데이터만)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const urgentSaved = (urgentSavedResult.data as any[] || []).filter(
    (item) => item.announcements && item.announcements.id
  )

  // 진행 중인 지원서 필터링
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inProgressApps = (inProgressAppsResult.data as any[] || []).filter(
    (item) => item.announcements && item.announcements.id
  )

  // 현재 플랜 정보
  const currentPlan = (stats?.subscription?.plan as PlanType) || 'free'
  const planInfo = PLAN_INFO[currentPlan]

  // 헤더 컴포넌트
  const headerContent = (
    <div>
      <h1 className="text-3xl font-bold">
        안녕하세요, {company?.name || user?.user_metadata?.full_name || "사용자"}님
      </h1>
      <p className="text-muted-foreground mt-1">
        오늘도 좋은 기회를 찾아보세요.
      </p>
    </div>
  )

  // 통계 위젯
  const statsWidget = (
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
          {currentPlan === 'free' ? (
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Crown className="h-4 w-4 text-yellow-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold flex items-center gap-2">
            {planInfo.name}
            {currentPlan !== 'free' && (
              <Badge variant="secondary" className="text-xs">
                {planInfo.priceLabel}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {currentPlan === 'free' ? (
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
  )

  // 빠른 메뉴 위젯
  const quickActionsWidget = (
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
  )

  // 맞춤 추천 공고 위젯
  const recommendationsWidget = <RecommendedAnnouncements />

  // 마감 임박 알림 위젯
  const urgentDeadlinesWidget = (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <CardTitle className="text-lg">마감 임박 공고</CardTitle>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/saved" className="gap-1">
            전체 보기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {urgentSaved.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">마감 임박 공고가 없어요</p>
            <p className="text-xs mt-1">관심 공고를 저장하면 마감일이 다가올 때 알려드려요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {urgentSaved.map((item: { id: string; announcements: { id: string; title: string; organization: string | null; application_end: string | null; source: string } }) => {
              const announcement = item.announcements
              const daysLeft = getDaysLeft(announcement.application_end)

              return (
                <Link
                  key={item.id}
                  href={`/dashboard/announcements/${announcement.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="font-medium text-sm truncate">{announcement.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      {announcement.organization && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">{announcement.organization}</span>
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {sourceLabels[announcement.source] || announcement.source}
                      </Badge>
                    </div>
                  </div>
                  <Badge
                    variant={getDeadlineBadgeVariant(daysLeft)}
                    className="shrink-0"
                  >
                    {daysLeft !== null && daysLeft >= 0 ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        D-{daysLeft}
                      </span>
                    ) : (
                      '마감됨'
                    )}
                  </Badge>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )

  // 진행중 지원서 현황 위젯
  const inProgressAppsWidget = (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Edit className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-lg">작성 중인 지원서</CardTitle>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/applications" className="gap-1">
            전체 보기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {inProgressApps.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">작성 중인 지원서가 없어요</p>
            <p className="text-xs mt-1">AI가 지원서 초안을 작성해 드려요</p>
            <Button variant="outline" size="sm" asChild className="mt-3">
              <Link href="/dashboard/applications">새 지원서 작성</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {inProgressApps.map((app: { id: string; status: string; updated_at: string; announcements: { id: string; title: string; organization: string | null; application_end: string | null } }) => {
              const announcement = app.announcements
              const daysLeft = getDaysLeft(announcement.application_end)
              const updatedAt = new Date(app.updated_at)
              const daysSinceUpdate = Math.floor(
                (new Date().getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)
              )

              return (
                <Link
                  key={app.id}
                  href={`/dashboard/applications/${app.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="font-medium text-sm truncate">{announcement.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      {announcement.organization && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">{announcement.organization}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {daysSinceUpdate === 0
                          ? '오늘 수정'
                          : daysSinceUpdate === 1
                          ? '어제 수정'
                          : `${daysSinceUpdate}일 전 수정`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 && (
                      <Badge variant={getDeadlineBadgeVariant(daysLeft)} className="text-xs">
                        D-{daysLeft}
                      </Badge>
                    )}
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )

  // 최신 공고 위젯
  const recentAnnouncementsWidget = (
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
  )

  return (
    <DashboardWidgets
      header={headerContent}
      widgets={{
        stats: statsWidget,
        quickActions: quickActionsWidget,
        recommendations: recommendationsWidget,
        urgentDeadlines: urgentDeadlinesWidget,
        inProgressApps: inProgressAppsWidget,
        recentAnnouncements: recentAnnouncementsWidget,
      }}
    />
  )
}
