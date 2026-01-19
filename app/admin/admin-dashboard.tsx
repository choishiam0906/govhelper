'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  FileText,
  TrendingUp,
  CreditCard,
  Sparkles,
  BarChart3,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface StatsData {
  users: {
    total: number
    recent: number
    trend: { date: string; count: number }[]
  }
  announcements: {
    total: number
    bySource: Record<string, number>
  }
  matches: {
    total: number
    recent: number
    trend: { date: string; count: number }[]
  }
  applications: {
    total: number
    recent: number
  }
  revenue: {
    total: number
    recent: number
    trend: { month: string; amount: number }[]
  }
  subscriptions: {
    active: number
  }
}

const SOURCE_LABELS: Record<string, string> = {
  smes: '중소벤처24',
  bizinfo: '기업마당',
  kstartup: 'K-Startup',
  g2b: '나라장터',
  hrd: 'HRD Korea',
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

function formatCurrency(amount: number) {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억원`
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}만원`
  }
  return `${amount.toLocaleString()}원`
}

function StatCard({
  title,
  value,
  subValue,
  subLabel,
  icon: Icon,
  color,
}: {
  title: string
  value: string | number
  subValue?: string | number
  subLabel?: string
  icon: React.ElementType
  color: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subValue !== undefined && (
              <p className="text-sm text-muted-foreground mt-1">
                <span className={color}>{subValue}</span> {subLabel}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('600', '100')}`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StatsData | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const result = await response.json()
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('통계 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            관리자 대시보드
          </h1>
          <p className="text-muted-foreground mt-1">서비스 현황을 한눈에 확인하세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">통계를 불러오지 못했어요</p>
      </div>
    )
  }

  // 소스별 공고 데이터 변환
  const announcementSourceData = Object.entries(stats.announcements.bySource).map(
    ([source, count], index) => ({
      name: SOURCE_LABELS[source] || source,
      value: count,
      fill: COLORS[index % COLORS.length],
    })
  )

  // 최근 7일 사용자 추이
  const recentUserTrend = stats.users.trend.slice(-7).map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
  }))

  // 최근 7일 매칭 추이
  const recentMatchTrend = stats.matches.trend.slice(-7).map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
  }))

  // 매출 추이
  const revenueTrend = stats.revenue.trend.map((item) => ({
    ...item,
    month: new Date(item.month + '-01').toLocaleDateString('ko-KR', { month: 'short' }),
  }))

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          관리자 대시보드
        </h1>
        <p className="text-muted-foreground mt-1">서비스 현황을 한눈에 확인하세요</p>
      </div>

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="전체 사용자"
          value={stats.users.total.toLocaleString()}
          subValue={`+${stats.users.recent}`}
          subLabel="최근 7일"
          icon={Users}
          color="text-blue-600"
        />
        <StatCard
          title="전체 공고"
          value={stats.announcements.total.toLocaleString()}
          icon={FileText}
          color="text-green-600"
        />
        <StatCard
          title="AI 매칭"
          value={stats.matches.total.toLocaleString()}
          subValue={`+${stats.matches.recent}`}
          subLabel="최근 7일"
          icon={Sparkles}
          color="text-purple-600"
        />
        <StatCard
          title="총 매출"
          value={formatCurrency(stats.revenue.total)}
          subValue={`+${formatCurrency(stats.revenue.recent)}`}
          subLabel="최근 7일"
          icon={CreditCard}
          color="text-orange-600"
        />
      </div>

      {/* 추가 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">지원서 작성</p>
                <p className="text-2xl font-bold">{stats.applications.total}</p>
                <p className="text-xs text-muted-foreground">+{stats.applications.recent} 최근 7일</p>
              </div>
              <div className="p-3 rounded-full bg-teal-100">
                <TrendingUp className="w-5 h-5 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">활성 구독</p>
                <p className="text-2xl font-bold">{stats.subscriptions.active}</p>
              </div>
              <div className="p-3 rounded-full bg-indigo-100">
                <CreditCard className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">평균 매칭률</p>
                <p className="text-2xl font-bold">
                  {stats.users.total > 0
                    ? ((stats.matches.total / stats.users.total) * 100).toFixed(1)
                    : 0}
                  %
                </p>
                <p className="text-xs text-muted-foreground">사용자당 매칭 비율</p>
              </div>
              <div className="p-3 rounded-full bg-pink-100">
                <Sparkles className="w-5 h-5 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 사용자 가입 추이 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">사용자 가입 추이</CardTitle>
            <CardDescription>최근 7일간 신규 가입자</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={recentUserTrend}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  fill="url(#colorUsers)"
                  name="가입자"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI 매칭 추이 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI 매칭 추이</CardTitle>
            <CardDescription>최근 7일간 매칭 분석 수</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={recentMatchTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="매칭" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 소스별 공고 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">소스별 공고 분포</CardTitle>
            <CardDescription>공고 출처별 비율</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={announcementSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {announcementSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 월별 매출 추이 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">월별 매출 추이</CardTitle>
            <CardDescription>최근 6개월 매출</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" fontSize={12} tickLine={false} />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [formatCurrency(value as number), '매출']}
                />
                <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} name="매출" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
