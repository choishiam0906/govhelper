import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Building2,
  ExternalLink,
  Bookmark,
  AlertTriangle
} from 'lucide-react'
import { CalendarView } from './calendar-view'

// 출처 라벨
const sourceLabels: Record<string, string> = {
  bizinfo: '기업마당',
  kstartup: 'K-Startup',
  smes: '중소벤처24',
  g2b: '나라장터',
}

interface SearchParams {
  month?: string
  year?: string
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 현재 날짜 또는 쿼리 파라미터에서 월/년 가져오기
  const now = new Date()
  const currentYear = params.year ? parseInt(params.year) : now.getFullYear()
  const currentMonth = params.month ? parseInt(params.month) : now.getMonth() + 1

  // 해당 월의 시작일과 종료일
  const startOfMonth = new Date(currentYear, currentMonth - 1, 1)
  const endOfMonth = new Date(currentYear, currentMonth, 0)

  // 저장된 공고 조회 (해당 월에 마감되는 것들)
  const { data: savedAnnouncements } = await supabase
    .from('saved_announcements')
    .select(`
      id,
      announcements (
        id,
        title,
        organization,
        application_end,
        source,
        support_amount
      )
    `)
    .eq('user_id', user!.id)
    .gte('announcements.application_end', startOfMonth.toISOString().split('T')[0])
    .lte('announcements.application_end', endOfMonth.toISOString().split('T')[0])

  // 전체 활성 공고 중 해당 월 마감 공고
  const { data: allAnnouncements } = await supabase
    .from('announcements')
    .select('id, title, organization, application_end, source, support_amount')
    .eq('status', 'active')
    .gte('application_end', startOfMonth.toISOString().split('T')[0])
    .lte('application_end', endOfMonth.toISOString().split('T')[0])
    .order('application_end', { ascending: true })

  // 데이터 정리
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const savedItems = (savedAnnouncements || [])
    .filter((item: any) => item.announcements?.id)
    .map((item: any) => ({
      ...item.announcements,
      isSaved: true,
    }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allItems = (allAnnouncements || []).map((item: any) => ({
    id: item.id,
    title: item.title,
    organization: item.organization,
    application_end: item.application_end,
    source: item.source,
    support_amount: item.support_amount,
    isSaved: savedItems.some((s: any) => s.id === item.id),
  }))

  // 날짜별로 그룹화
  const eventsByDate: Record<string, typeof allItems> = {}
  allItems.forEach(item => {
    if (item.application_end) {
      const dateKey = item.application_end.split('T')[0]
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = []
      }
      eventsByDate[dateKey].push(item)
    }
  })

  // 이전/다음 월 계산
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear

  // 이번 주 마감 공고 (오늘부터 7일)
  const today = new Date()
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)

  const thisWeekDeadlines = allItems.filter(item => {
    if (!item.application_end) return false
    const endDate = new Date(item.application_end)
    return endDate >= today && endDate <= nextWeek
  })

  // 저장된 공고 중 이번 달 마감
  const savedThisMonth = savedItems.length

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-8 w-8" />
            지원 일정
          </h1>
          <p className="text-muted-foreground mt-1">
            공고 마감일을 캘린더로 확인하세요
          </p>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              이번 주 마감
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {thisWeekDeadlines.length}건
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              7일 이내 마감 공고
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              이번 달 마감
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{allItems.length}건</div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentMonth}월 마감 공고
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              저장된 공고
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {savedThisMonth}건
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              관심 등록한 공고
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 캘린더 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{currentYear}년 {currentMonth}월</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link href={`/dashboard/calendar?year=${prevYear}&month=${prevMonth}`}>
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/calendar">오늘</Link>
              </Button>
              <Button variant="outline" size="icon" asChild>
                <Link href={`/dashboard/calendar?year=${nextYear}&month=${nextMonth}`}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CalendarView
            year={currentYear}
            month={currentMonth}
            eventsByDate={eventsByDate}
          />
        </CardContent>
      </Card>

      {/* 이번 주 마감 공고 목록 */}
      {thisWeekDeadlines.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              이번 주 마감 공고
            </CardTitle>
            <CardDescription>7일 이내에 마감되는 공고예요. 서둘러 지원하세요!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {thisWeekDeadlines.map((item) => {
                const daysLeft = Math.ceil(
                  (new Date(item.application_end!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                )
                return (
                  <Link
                    key={item.id}
                    href={`/dashboard/announcements/${item.id}`}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border hover:border-primary transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        {item.isSaved && (
                          <Bookmark className="h-4 w-4 text-primary fill-primary" />
                        )}
                        <span className="font-medium truncate">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {item.organization && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {item.organization}
                          </span>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {sourceLabels[item.source] || item.source}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant="destructive">D-{daysLeft}</Badge>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
