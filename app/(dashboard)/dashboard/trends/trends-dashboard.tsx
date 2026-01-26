'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  Building2,
  Briefcase,
  MapPin,
  BarChart3,
  PieChart,
  Activity,
  Wallet,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts'
import type { TrendsAnalysis } from '@/types/trends'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

// 금액 포맷
function formatAmount(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억원`
  } else if (amount >= 10000) {
    return `${Math.round(amount / 10000).toLocaleString()}만원`
  }
  return `${amount.toLocaleString()}원`
}

// 월 포맷 (YYYY-MM -> M월)
function formatMonth(monthStr: string): string {
  const parts = monthStr.split('-')
  return `${parseInt(parts[1], 10)}월`
}

export function TrendsDashboard() {
  const [trends, setTrends] = useState<TrendsAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTrends = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/statistics/trends')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setTrends(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '트렌드 분석에 실패했어요')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrends()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        {/* 요약 카드 스켈레톤 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 차트 스켈레톤 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={fetchTrends}>
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!trends) return null

  // 차트 데이터 변환
  const monthlyChartData = trends.monthlyTrends.map(m => ({
    name: formatMonth(m.month),
    공고수: m.count,
    평균지원금: Math.round(m.avgAmount / 10000), // 만원 단위
  }))

  const categoryChartData = trends.topCategories.slice(0, 5).map(c => ({
    name: c.category.length > 10 ? c.category.slice(0, 10) + '...' : c.category,
    value: c.count,
    fullName: c.category,
  }))

  const regionChartData = trends.topRegions.slice(0, 8).map(r => ({
    name: r.region,
    공고수: r.count,
  }))

  const supportTypeData = trends.supportTypes.slice(0, 6).map((s, i) => ({
    name: s.type.length > 8 ? s.type.slice(0, 8) + '...' : s.type,
    value: s.count,
    fullName: s.type,
  }))

  return (
    <div className="space-y-6">
      {/* 요약 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              전체 공고
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{trends.summary.totalAnnouncements.toLocaleString()}개</p>
            <p className="text-xs text-muted-foreground mt-1">
              활성 {trends.summary.activeAnnouncements.toLocaleString()}개
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              평균 지원금
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatAmount(trends.summary.avgSupportAmount)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              중앙값 {formatAmount(trends.summary.medianSupportAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              인기 분야
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold line-clamp-1">{trends.summary.mostPopularCategory}</p>
            <Badge variant="secondary" className="mt-1">
              {trends.topCategories[0]?.count || 0}개 공고
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              활발한 기관
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold line-clamp-1">{trends.summary.mostActiveOrganization}</p>
            <Badge variant="secondary" className="mt-1">
              {trends.topOrganizations[0]?.count || 0}개 공고
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* 월별 추이 차트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            월별 공고 추이
          </CardTitle>
          <CardDescription>최근 6개월간 공고 등록 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value, name) => {
                    if (name === '평균지원금') return [`${(value as number).toLocaleString()}만원`, name]
                    return [(value as number).toLocaleString(), name]
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="공고수"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 카테고리 & 지역 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 카테고리별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              카테고리별 분포
            </CardTitle>
            <CardDescription>상위 5개 카테고리</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value, _name, props) => [
                      `${value}개`,
                      (props as any).payload.fullName,
                    ]}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {trends.topCategories.slice(0, 5).map((cat, i) => (
                <Badge
                  key={cat.category}
                  variant="outline"
                  style={{ borderColor: COLORS[i % COLORS.length] }}
                >
                  {cat.category} ({cat.count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 지역별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              지역별 분포
            </CardTitle>
            <CardDescription>지원 가능 지역 상위 8개</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis type="category" dataKey="name" className="text-xs" width={50} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`${value}개 공고`, '공고수']}
                  />
                  <Bar dataKey="공고수" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 지원유형 & 활발한 기관 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 지원유형별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              지원유형별 분포
            </CardTitle>
            <CardDescription>지원 유형별 공고 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={supportTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {supportTypeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value, _name, props) => [
                      `${value}개`,
                      (props as any).payload.fullName,
                    ]}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 활발한 기관 TOP 10 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              활발한 지원 기관
            </CardTitle>
            <CardDescription>공고 등록이 많은 기관 TOP 10</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {trends.topOrganizations.map((org, index) => (
                <div
                  key={org.organization}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index < 3 ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="font-medium line-clamp-1">{org.organization}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{org.count}개</p>
                    {org.avgAmount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        평균 {formatAmount(org.avgAmount)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 분석 시점 */}
      <p className="text-xs text-muted-foreground text-center">
        마지막 분석: {new Date(trends.analyzedAt).toLocaleString('ko-KR')}
      </p>
    </div>
  )
}
