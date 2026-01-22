'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUp, Users, Target, MousePointerClick, ArrowUpRight } from 'lucide-react'

interface UTMStats {
  summary: {
    totalLeads: number
    convertedLeads: number
    conversionRate: number
    utmLeads: number
    organicLeads: number
  }
  bySource: Array<{ name: string; total: number; converted: number; conversionRate: number }>
  byMedium: Array<{ name: string; total: number; converted: number; conversionRate: number }>
  byCampaign: Array<{ name: string; total: number; converted: number; conversionRate: number }>
  dailyTrend: Array<{ date: string; total: number; converted: number }>
  userAnalytics: {
    total: number
    completedOnboarding: number
    usedMatching: number
    convertedPaid: number
  }
}

export default function UTMAnalyticsPage() {
  const [stats, setStats] = useState<UTMStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/utm')
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch UTM stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        통계를 불러올 수 없어요
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">UTM 분석</h1>
        <p className="text-muted-foreground">마케팅 채널별 유입 및 전환 현황 (최근 30일)</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>총 리드</CardDescription>
            <CardTitle className="text-3xl">{stats.summary.totalLeads.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>비회원 매칭 신청</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>전환 (회원가입)</CardDescription>
            <CardTitle className="text-3xl">{stats.summary.convertedLeads}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-500" />
              <span className="text-green-600 font-medium">{stats.summary.conversionRate}%</span>
              <span className="text-muted-foreground">전환율</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>UTM 유입</CardDescription>
            <CardTitle className="text-3xl">{stats.summary.utmLeads}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>마케팅 채널 유입</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>직접 유입</CardDescription>
            <CardTitle className="text-3xl">{stats.summary.organicLeads}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MousePointerClick className="h-4 w-4" />
              <span>자연 유입</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 일별 추이 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            일별 유입 추이 (최근 14일)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end gap-1">
            {stats.dailyTrend.map((day, index) => {
              const maxTotal = Math.max(...stats.dailyTrend.map(d => d.total), 1)
              const height = (day.total / maxTotal) * 100

              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full bg-primary/20 rounded-t relative group cursor-pointer hover:bg-primary/30 transition-colors"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  >
                    {day.converted > 0 && (
                      <div
                        className="absolute bottom-0 w-full bg-green-500 rounded-t"
                        style={{ height: `${(day.converted / day.total) * 100}%` }}
                      />
                    )}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-popover border rounded px-2 py-1 text-xs whitespace-nowrap z-10">
                      {day.total}명 / 전환 {day.converted}명
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(day.date).getDate()}일
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary/20 rounded" />
              <span className="text-muted-foreground">전체 유입</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-muted-foreground">회원 전환</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 소스/매체/캠페인별 분석 */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* 소스별 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">소스별 (utm_source)</CardTitle>
            <CardDescription>유입 경로</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.bySource.length === 0 ? (
              <p className="text-muted-foreground text-sm">데이터 없음</p>
            ) : (
              <div className="space-y-3">
                {stats.bySource.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.name === '(직접 유입)' ? 'secondary' : 'default'}>
                        {item.name}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{item.total}명</div>
                      <div className="text-xs text-muted-foreground">
                        전환 {item.conversionRate}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 매체별 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">매체별 (utm_medium)</CardTitle>
            <CardDescription>마케팅 채널</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.byMedium.length === 0 ? (
              <p className="text-muted-foreground text-sm">데이터 없음</p>
            ) : (
              <div className="space-y-3">
                {stats.byMedium.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.name === '(직접 유입)' ? 'secondary' : 'outline'}>
                        {item.name}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{item.total}명</div>
                      <div className="text-xs text-muted-foreground">
                        전환 {item.conversionRate}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 캠페인별 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">캠페인별 (utm_campaign)</CardTitle>
            <CardDescription>마케팅 캠페인</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.byCampaign.length === 0 ? (
              <p className="text-muted-foreground text-sm">데이터 없음</p>
            ) : (
              <div className="space-y-3">
                {stats.byCampaign.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Badge variant={item.name === '(직접 유입)' ? 'secondary' : 'outline'} className="truncate max-w-[120px]">
                        {item.name}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{item.total}명</div>
                      <div className="text-xs text-muted-foreground">
                        전환 {item.conversionRate}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* UTM 사용법 안내 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">UTM 파라미터 사용법</CardTitle>
          <CardDescription>마케팅 캠페인 추적을 위한 URL 생성 가이드</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm break-all">
            https://govhelpers.com/try?utm_source=<span className="text-blue-600">google</span>&utm_medium=<span className="text-green-600">cpc</span>&utm_campaign=<span className="text-orange-600">startup_support</span>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">utm_source (필수)</h4>
              <p className="text-muted-foreground mb-2">트래픽 소스</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline">google</Badge>
                <Badge variant="outline">naver</Badge>
                <Badge variant="outline">facebook</Badge>
                <Badge variant="outline">instagram</Badge>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">utm_medium (필수)</h4>
              <p className="text-muted-foreground mb-2">마케팅 매체</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline">cpc</Badge>
                <Badge variant="outline">email</Badge>
                <Badge variant="outline">social</Badge>
                <Badge variant="outline">referral</Badge>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">utm_campaign (권장)</h4>
              <p className="text-muted-foreground mb-2">캠페인 이름</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline">startup_2024</Badge>
                <Badge variant="outline">free_trial</Badge>
                <Badge variant="outline">winter_promo</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
