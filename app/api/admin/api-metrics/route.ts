import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api/error-handler'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'choishiam@gmail.com')
  .split(',')
  .map((e) => e.trim())

/**
 * 관리자 API 메트릭 조회
 *
 * 쿼리 파라미터:
 * - period: 1h, 6h, 24h, 7d (기본: 24h)
 * - endpoint: 특정 엔드포인트 필터 (선택)
 *
 * 응답:
 * - 엔드포인트별 평균/p50/p95/p99 응답 시간
 * - 요청 수
 * - 에러율
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      return apiError('관리자만 접근할 수 있어요', 'UNAUTHORIZED', 403)
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '24h'
    const endpointFilter = searchParams.get('endpoint')

    // period를 시간으로 변환
    const periodHours: Record<string, number> = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
    }

    const hours = periodHours[period] || 24
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - hours)

    // Supabase service role로 메트릭 조회
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const serviceSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let query = serviceSupabase
      .from('api_metrics')
      .select('*')
      .gte('created_at', cutoffDate.toISOString())

    if (endpointFilter) {
      query = query.eq('endpoint', endpointFilter)
    }

    const { data: metrics, error } = await query

    if (error) {
      return apiError('메트릭 조회에 실패했어요', 'DATABASE_ERROR', 500)
    }

    if (!metrics || metrics.length === 0) {
      return apiSuccess({
        period,
        totalRequests: 0,
        endpoints: [],
        overall: {
          avgDuration: 0,
          p50: 0,
          p95: 0,
          p99: 0,
          errorRate: 0,
        },
      })
    }

    // 엔드포인트별 집계
    const endpointMap = new Map<
      string,
      {
        endpoint: string
        requests: number
        durations: number[]
        errors: number
      }
    >()

    metrics.forEach((metric) => {
      const key = metric.endpoint
      if (!endpointMap.has(key)) {
        endpointMap.set(key, {
          endpoint: key,
          requests: 0,
          durations: [],
          errors: 0,
        })
      }

      const endpointData = endpointMap.get(key)!
      endpointData.requests++
      endpointData.durations.push(metric.duration_ms)

      if (metric.status_code >= 400) {
        endpointData.errors++
      }
    })

    // 엔드포인트별 통계 계산
    const endpointStats = Array.from(endpointMap.values()).map((data) => {
      const sortedDurations = data.durations.sort((a, b) => a - b)
      const count = sortedDurations.length

      const avgDuration =
        sortedDurations.reduce((sum, d) => sum + d, 0) / count

      const p50 = sortedDurations[Math.floor(count * 0.5)]
      const p95 = sortedDurations[Math.floor(count * 0.95)]
      const p99 = sortedDurations[Math.floor(count * 0.99)]

      const errorRate = (data.errors / data.requests) * 100

      return {
        endpoint: data.endpoint,
        requests: data.requests,
        avgDuration: Math.round(avgDuration),
        p50: Math.round(p50),
        p95: Math.round(p95),
        p99: Math.round(p99),
        errorRate: Math.round(errorRate * 100) / 100,
      }
    })

    // 전체 통계 계산
    const allDurations = metrics.map((m) => m.duration_ms).sort((a, b) => a - b)
    const totalCount = allDurations.length
    const totalErrors = metrics.filter((m) => m.status_code >= 400).length

    const overallStats = {
      avgDuration: Math.round(
        allDurations.reduce((sum, d) => sum + d, 0) / totalCount
      ),
      p50: Math.round(allDurations[Math.floor(totalCount * 0.5)]),
      p95: Math.round(allDurations[Math.floor(totalCount * 0.95)]),
      p99: Math.round(allDurations[Math.floor(totalCount * 0.99)]),
      errorRate: Math.round((totalErrors / totalCount) * 10000) / 100,
    }

    return apiSuccess({
      period,
      totalRequests: totalCount,
      endpoints: endpointStats.sort((a, b) => b.requests - a.requests),
      overall: overallStats,
    })
  } catch (error) {
    return apiError('메트릭 조회 중 오류가 발생했어요', 'INTERNAL_SERVER_ERROR', 500)
  }
}
