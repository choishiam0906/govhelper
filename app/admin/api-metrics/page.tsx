'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Activity, Clock, AlertTriangle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EndpointStats {
  endpoint: string
  requests: number
  avgDuration: number
  p50: number
  p95: number
  p99: number
  errorRate: number
}

interface MetricsData {
  period: string
  totalRequests: number
  endpoints: EndpointStats[]
  overall: {
    avgDuration: number
    p50: number
    p95: number
    p99: number
    errorRate: number
  }
}

const PERIOD_LABELS: Record<string, string> = {
  '1h': '최근 1시간',
  '6h': '최근 6시간',
  '24h': '최근 24시간',
  '7d': '최근 7일',
}

export default function ApiMetricsPage() {
  const [period, setPeriod] = useState('24h')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<MetricsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async (selectedPeriod: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/api-metrics?period=${selectedPeriod}`)
      if (!res.ok) {
        throw new Error('메트릭 조회에 실패했어요')
      }

      const json = await res.json()
      setData(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics(period)
  }, [period])

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const getDurationColor = (ms: number) => {
    if (ms < 1000) return 'text-green-600'
    if (ms < 3000) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="w-8 h-8" />
            API 성능 모니터링
          </h1>
          <p className="text-muted-foreground mt-2">
            API 응답 시간 및 에러율을 모니터링해요
          </p>
        </div>

        <div className="flex gap-2">
          {Object.entries(PERIOD_LABELS).map(([key, label]) => (
            <Button
              key={key}
              variant={period === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-muted-foreground">
          로딩 중...
        </div>
      )}

      {error && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950">
          <CardContent className="pt-6">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && data && (
        <>
          {/* 전체 요약 카드 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 요청수</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.totalRequests.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">평균 응답 시간</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getDurationColor(data.overall.avgDuration)}`}>
                  {formatDuration(data.overall.avgDuration)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">P95 응답 시간</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getDurationColor(data.overall.p95)}`}>
                  {formatDuration(data.overall.p95)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">P99 응답 시간</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getDurationColor(data.overall.p99)}`}>
                  {formatDuration(data.overall.p99)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">에러율</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${data.overall.errorRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                  {data.overall.errorRate.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 엔드포인트별 상세 테이블 */}
          <Card>
            <CardHeader>
              <CardTitle>엔드포인트별 성능</CardTitle>
            </CardHeader>
            <CardContent>
              {data.endpoints.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>엔드포인트</TableHead>
                      <TableHead className="text-right">요청수</TableHead>
                      <TableHead className="text-right">평균</TableHead>
                      <TableHead className="text-right">P50</TableHead>
                      <TableHead className="text-right">P95</TableHead>
                      <TableHead className="text-right">P99</TableHead>
                      <TableHead className="text-right">에러율</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.endpoints.map((endpoint) => (
                      <TableRow key={endpoint.endpoint}>
                        <TableCell className="font-mono text-sm">
                          {endpoint.endpoint}
                        </TableCell>
                        <TableCell className="text-right">
                          {endpoint.requests.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right ${getDurationColor(endpoint.avgDuration)}`}>
                          {formatDuration(endpoint.avgDuration)}
                        </TableCell>
                        <TableCell className={`text-right ${getDurationColor(endpoint.p50)}`}>
                          {formatDuration(endpoint.p50)}
                        </TableCell>
                        <TableCell className={`text-right ${getDurationColor(endpoint.p95)}`}>
                          {formatDuration(endpoint.p95)}
                          {endpoint.p95 > 3000 && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              느림
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className={`text-right ${getDurationColor(endpoint.p99)}`}>
                          {formatDuration(endpoint.p99)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={endpoint.errorRate > 5 ? 'text-red-600 font-semibold' : ''}>
                            {endpoint.errorRate.toFixed(2)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  해당 기간에 메트릭 데이터가 없어요
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
