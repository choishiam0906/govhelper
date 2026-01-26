'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  Building2,
  Briefcase,
  Wallet,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface IndustryData {
  industry: string
  totalCount: number
  activeCount: number
  avgSupportAmount: number
  maxSupportAmount: number
  minSupportAmount: number
  topCategories: { category: string; count: number }[]
  targetCompanyTypes: { type: string; count: number }[]
  monthlyTrend: { month: string; count: number }[]
}

interface IndustryAnalysisData {
  industries: IndustryData[]
  summary: {
    totalIndustries: number
    mostActiveIndustry: string
    highestAvgAmount: string
    growingIndustries: string[]
  }
  analyzedAt: string
}

// 금액 포맷
function formatAmount(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억원`
  } else if (amount >= 10000) {
    return `${Math.round(amount / 10000).toLocaleString()}만원`
  }
  return `${amount.toLocaleString()}원`
}

// 월 포맷
function formatMonth(monthStr: string): string {
  const parts = monthStr.split('-')
  return `${parseInt(parts[1], 10)}월`
}

// 업종 색상
const INDUSTRY_COLORS: Record<string, string> = {
  'IT/소프트웨어': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  '제조업': 'bg-blue-100 text-blue-800 border-blue-200',
  '바이오/헬스케어': 'bg-green-100 text-green-800 border-green-200',
  '에너지/환경': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  '콘텐츠/미디어': 'bg-purple-100 text-purple-800 border-purple-200',
  '유통/서비스': 'bg-orange-100 text-orange-800 border-orange-200',
  '금융/핀테크': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  '건설/부동산': 'bg-slate-100 text-slate-800 border-slate-200',
  '농림수산': 'bg-lime-100 text-lime-800 border-lime-200',
  '기타': 'bg-gray-100 text-gray-800 border-gray-200',
}

export function IndustryAnalysis() {
  const [data, setData] = useState<IndustryAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedIndustry, setExpandedIndustry] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/statistics/industry')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '업종별 분석에 실패했어요')
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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
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

  // 차트 데이터
  const barChartData = data.industries.slice(0, 8).map(ind => ({
    name: ind.industry.length > 8 ? ind.industry.slice(0, 8) + '..' : ind.industry,
    fullName: ind.industry,
    공고수: ind.totalCount,
    평균지원금: Math.round(ind.avgSupportAmount / 10000), // 만원 단위
  }))

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              분석 업종
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.summary.totalIndustries}개</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              가장 활발한 업종
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold line-clamp-1">{data.summary.mostActiveIndustry}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              최고 평균 지원금
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold line-clamp-1">{data.summary.highestAvgAmount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              성장 업종
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {data.summary.growingIndustries.slice(0, 2).map((ind, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {ind}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 업종별 공고 현황 차트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            업종별 공고 현황
          </CardTitle>
          <CardDescription>업종별 공고 수와 평균 지원금</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis yAxisId="left" className="text-xs" />
                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value, name) => {
                    if (name === '평균지원금') return [`${(value as number).toLocaleString()}만원`, name]
                    return [value, name]
                  }}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload
                    return item?.fullName || label
                  }}
                />
                <Bar yAxisId="left" dataKey="공고수" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="평균지원금" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 업종별 상세 카드 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">업종별 상세 분석</h3>
        {data.industries.map((industry) => (
          <Collapsible
            key={industry.industry}
            open={expandedIndustry === industry.industry}
            onOpenChange={() =>
              setExpandedIndustry(
                expandedIndustry === industry.industry ? null : industry.industry
              )
            }
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={INDUSTRY_COLORS[industry.industry] || INDUSTRY_COLORS['기타']}
                      >
                        {industry.industry}
                      </Badge>
                      <span className="font-semibold">{industry.totalCount}개 공고</span>
                      <span className="text-sm text-muted-foreground">
                        (활성 {industry.activeCount}개)
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm">
                        평균 <span className="font-semibold text-primary">{formatAmount(industry.avgSupportAmount)}</span>
                      </span>
                      {expandedIndustry === industry.industry ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  {/* 월별 추이 */}
                  {industry.monthlyTrend.length > 1 && (
                    <div>
                      <p className="text-sm font-medium mb-2">월별 추이</p>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={industry.monthlyTrend.map(t => ({
                            name: formatMonth(t.month),
                            공고수: t.count,
                          }))}>
                            <XAxis dataKey="name" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="공고수"
                              stroke="#6366f1"
                              strokeWidth={2}
                              dot={{ fill: '#6366f1' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 주요 카테고리 */}
                    <div>
                      <p className="text-sm font-medium mb-2">주요 카테고리</p>
                      <div className="flex flex-wrap gap-2">
                        {industry.topCategories.map((cat, i) => (
                          <Badge key={i} variant="outline">
                            {cat.category} ({cat.count})
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* 대상 기업 유형 */}
                    {industry.targetCompanyTypes.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">대상 기업 유형</p>
                        <div className="flex flex-wrap gap-2">
                          {industry.targetCompanyTypes.map((type, i) => (
                            <Badge key={i} variant="secondary">
                              {type.type} ({type.count})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 지원금 범위 */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">지원금 범위:</span>
                    <span>
                      {formatAmount(industry.minSupportAmount)} ~ {formatAmount(industry.maxSupportAmount)}
                    </span>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>

      {/* 분석 시점 */}
      <p className="text-xs text-muted-foreground text-center">
        마지막 분석: {new Date(data.analyzedAt).toLocaleString('ko-KR')}
      </p>
    </div>
  )
}
