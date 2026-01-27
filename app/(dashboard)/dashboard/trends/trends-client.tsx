'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, TrendingUp, Building2, Layers, Calendar, Lightbulb } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface TrendsData {
  period: string
  totalAnnouncements: number
  activeCount: number
  trends: {
    byCategory: { category: string; count: number }[]
    byOrganization: { org: string; count: number }[]
    bySource: { source: string; count: number }[]
    deadlineDistribution: { label: string; count: number }[]
  }
  hotKeywords: { keyword: string; count: number }[]
  insights: string[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d']

const sourceLabels: Record<string, string> = {
  bizinfo: '기업마당',
  kstartup: 'K-Startup',
  smes: '중소벤처24',
  g2b: '나라장터',
}

export function TrendsClient() {
  const [period, setPeriod] = useState('30')
  const [data, setData] = useState<TrendsData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchTrends = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/announcements/trends?period=${period}`)
      const result = await res.json()
      if (!result.error) setData(result)
    } catch {
      // 에러 무시
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTrends()
  }, [period])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">데이터를 불러올 수 없어요</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">트렌드 분석</h1>
          <p className="text-muted-foreground mt-1">최근 정부지원사업 공고 트렌드를 한눈에 확인해요</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">최근 7일</SelectItem>
            <SelectItem value="14">최근 14일</SelectItem>
            <SelectItem value="30">최근 30일</SelectItem>
            <SelectItem value="60">최근 60일</SelectItem>
            <SelectItem value="90">최근 90일</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">전체 공고</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalAnnouncements}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">활성 공고</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{data.activeCount}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">기간</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.period}</p>
          </CardContent>
        </Card>
      </div>

      {/* 인사이트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            주요 인사이트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.insights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-primary font-bold mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 카테고리별 분포 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            카테고리별 공고 분포
          </CardTitle>
          <CardDescription>어떤 분야의 공고가 많이 나왔나요?</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.trends.byCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#0088FE" name="공고 수" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 기관별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              상위 기관별 공고
            </CardTitle>
            <CardDescription>어느 기관이 가장 많은 공고를 게시했나요?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.trends.byOrganization.slice(0, 5).map((org, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate mr-2">{org.org}</span>
                  <Badge variant="secondary">{org.count}건</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 소스별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              소스별 공고 비율
            </CardTitle>
            <CardDescription>어떤 플랫폼에서 공고가 많이 나왔나요?</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.trends.bySource.map(s => ({ name: sourceLabels[s.source] || s.source, value: s.count }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {data.trends.bySource.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 마감일 분포 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            마감일 분포
          </CardTitle>
          <CardDescription>언제까지 지원 가능한가요?</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.trends.deadlineDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#00C49F" name="공고 수" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 핫 키워드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            핫 키워드
          </CardTitle>
          <CardDescription>공고 제목에서 자주 등장하는 키워드예요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.hotKeywords.slice(0, 20).map((kw, idx) => (
              <Badge key={idx} variant="outline" className="text-sm">
                {kw.keyword} <span className="ml-1 text-xs text-muted-foreground">({kw.count})</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
