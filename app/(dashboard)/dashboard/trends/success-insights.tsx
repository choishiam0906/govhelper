'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  Target,
  Lightbulb,
  Award,
  Building2,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
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
} from 'recharts'

interface SuccessInsightData {
  scoreDistribution: {
    range: string
    count: number
    percentage: number
  }[]
  topSuccessFactors: {
    factor: string
    avgContribution: number
    description: string
  }[]
  categoryScores: {
    category: string
    avgScore: number
    matchCount: number
  }[]
  organizationScores: {
    organization: string
    avgScore: number
    matchCount: number
  }[]
  hourlyPattern: {
    hour: number
    count: number
  }[]
  summary: {
    totalMatches: number
    avgScore: number
    highScoreRate: number
    topCategory: string
    topOrganization: string
  }
  recommendations: string[]
}

const COLORS = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981']

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-green-600'
  if (score >= 70) return 'text-emerald-600'
  if (score >= 50) return 'text-yellow-600'
  if (score >= 30) return 'text-orange-600'
  return 'text-red-600'
}

function getScoreBg(score: number): string {
  if (score >= 85) return 'bg-green-100'
  if (score >= 70) return 'bg-emerald-100'
  if (score >= 50) return 'bg-yellow-100'
  if (score >= 30) return 'bg-orange-100'
  return 'bg-red-100'
}

export function SuccessInsights() {
  const [data, setData] = useState<SuccessInsightData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/statistics/insights')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '인사이트 분석에 실패했어요')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
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
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  if (data.summary.totalMatches === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">아직 매칭 데이터가 없어요</p>
          <p className="text-muted-foreground mb-4">
            AI 매칭을 진행하면 여기서 성공률 인사이트를 확인할 수 있어요
          </p>
          <Button asChild>
            <a href="/dashboard/matching">AI 매칭 시작하기</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // 점수 분포 차트 데이터
  const distributionData = data.scoreDistribution.map((d, i) => ({
    name: d.range,
    value: d.count,
    percentage: d.percentage,
    fill: COLORS[i],
  }))

  // 시간대별 패턴 차트 데이터
  const hourlyData = data.hourlyPattern.map(h => ({
    name: `${h.hour}시`,
    매칭수: h.count,
  }))

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              총 매칭 수
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.summary.totalMatches.toLocaleString()}회</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              평균 점수
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${getScoreColor(data.summary.avgScore)}`}>
              {data.summary.avgScore}점
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              고득점 비율
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{data.summary.highScoreRate}%</p>
            <p className="text-xs text-muted-foreground">70점 이상</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              최적 카테고리
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold line-clamp-1">{data.summary.topCategory}</p>
          </CardContent>
        </Card>
      </div>

      {/* 추천 제안 */}
      {data.recommendations.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              맞춤 제안
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 점수 분포 & 성공 요인 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 점수 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              점수 분포
            </CardTitle>
            <CardDescription>매칭 점수 구간별 분포</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value, _name, props) => [
                      `${value}회 (${(props.payload as any).percentage}%)`,
                      '매칭 수',
                    ]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 성공 요인 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              성공 요인 분석
            </CardTitle>
            <CardDescription>점수에 기여하는 주요 요인</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topSuccessFactors.map((factor, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{factor.factor}</span>
                    <Badge
                      variant="outline"
                      className={`${getScoreBg(factor.avgContribution)} ${getScoreColor(factor.avgContribution)}`}
                    >
                      평균 {factor.avgContribution}점
                    </Badge>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${factor.avgContribution}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{factor.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 카테고리별 & 기관별 점수 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 카테고리별 평균 점수 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              카테고리별 평균 점수
            </CardTitle>
            <CardDescription>카테고리별 매칭 성과</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {data.categoryScores.map((cat, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i < 3 ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="font-medium line-clamp-1">{cat.category}</span>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${getScoreColor(cat.avgScore)}`}>
                      {cat.avgScore}점
                    </p>
                    <p className="text-xs text-muted-foreground">{cat.matchCount}회 매칭</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 기관별 평균 점수 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              기관별 평균 점수
            </CardTitle>
            <CardDescription>지원 기관별 매칭 성과</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {data.organizationScores.map((org, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i < 3 ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="font-medium line-clamp-1">{org.organization}</span>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${getScoreColor(org.avgScore)}`}>
                      {org.avgScore}점
                    </p>
                    <p className="text-xs text-muted-foreground">{org.matchCount}회 매칭</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 시간대별 매칭 패턴 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            시간대별 매칭 패턴
          </CardTitle>
          <CardDescription>언제 가장 많이 매칭을 진행하는지 확인해 보세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorMatching" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" interval={2} />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="매칭수"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorMatching)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
