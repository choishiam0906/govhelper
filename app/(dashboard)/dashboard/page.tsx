import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Search,
  TrendingUp,
  FileText,
  Bell,
  ArrowRight,
  Clock,
  CheckCircle,
} from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // TODO: Fetch actual data from database
  const stats = {
    totalMatches: 12,
    activeApplications: 3,
    savedAnnouncements: 8,
    matchScore: 85,
  }

  const recentAnnouncements = [
    {
      id: "1",
      title: "2026년 초기창업패키지 지원사업",
      organization: "창업진흥원",
      deadline: "2026-02-28",
      matchScore: 92,
    },
    {
      id: "2",
      title: "AI 바우처 지원사업",
      organization: "정보통신산업진흥원",
      deadline: "2026-03-15",
      matchScore: 88,
    },
    {
      id: "3",
      title: "중소기업 R&D 역량강화 사업",
      organization: "중소벤처기업부",
      deadline: "2026-02-20",
      matchScore: 75,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">안녕하세요, {user?.user_metadata?.full_name || "사용자"}님</h1>
        <p className="text-muted-foreground mt-1">
          오늘도 좋은 기회를 찾아보세요.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">매칭된 공고</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMatches}건</div>
            <p className="text-xs text-muted-foreground">
              평균 매칭률 {stats.matchScore}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">진행중 지원서</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeApplications}건</div>
            <p className="text-xs text-muted-foreground">
              이번 달 작성
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">관심 공고</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.savedAnnouncements}건</div>
            <p className="text-xs text-muted-foreground">
              저장된 공고
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">구독 상태</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Free</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/dashboard/billing" className="text-primary hover:underline">
                업그레이드
              </Link>
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

      {/* Recent Recommendations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>추천 공고</CardTitle>
            <CardDescription>AI가 분석한 맞춤 추천 공고입니다</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/matching" className="gap-2">
              전체 보기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{announcement.title}</span>
                    <Badge variant="secondary">{announcement.matchScore}% 매칭</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{announcement.organization}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      마감 {announcement.deadline}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/dashboard/announcements/${announcement.id}`}>
                    자세히
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
