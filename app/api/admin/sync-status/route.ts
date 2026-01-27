import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getSyncStats,
  getSourceSummary,
  getRunningSyncs,
} from '@/lib/sync/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 관리자 권한 확인
async function isAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false

  const token = authHeader.replace('Bearer ', '')

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) return false

    return user.user_metadata?.role === 'admin'
  } catch {
    return false
  }
}

interface SyncStatusResponse {
  sources: {
    source: string
    lastSync: string | null
    status: 'success' | 'failed' | 'running' | null
    stats: {
      last24h: { success: number; failed: number }
      last7d: {
        totalFetched: number
        newAdded: number
        updated: number
        failed: number
      }
    }
  }[]
  runningSyncs?: {
    source: string
    startedAt: string
    duration: string
  }[]
}

/**
 * GET /api/admin/sync-status
 * 전체 소스별 동기화 현황 조회
 *
 * GET /api/admin/sync-status?source=smes
 * 특정 소스 상세 로그 조회
 */
export async function GET(request: NextRequest) {
  // 관리자 권한 확인
  if (!(await isAdmin(request))) {
    return NextResponse.json(
      { error: '관리자 권한이 필요해요' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const source = searchParams.get('source')
  const days = parseInt(searchParams.get('days') || '7', 10)

  try {
    // 특정 소스의 상세 로그 조회
    if (source) {
      const logs = await getSyncStats(source, days)

      if (!logs) {
        return NextResponse.json(
          { error: '동기화 로그를 조회할 수 없어요' },
          { status: 500 }
        )
      }

      const summary = await getSourceSummary(source, days)

      return NextResponse.json({
        source,
        summary,
        logs: logs.map((log) => ({
          id: log.id,
          startedAt: log.started_at,
          completedAt: log.completed_at,
          status: log.status,
          duration: log.completed_at
            ? calculateDuration(log.started_at, log.completed_at)
            : calculateDuration(log.started_at, new Date().toISOString()),
          stats: {
            totalFetched: log.total_fetched,
            newAdded: log.new_added,
            updated: log.updated,
            failed: log.failed,
          },
          errorMessage: log.error_message,
        })),
      })
    }

    // 전체 소스별 동기화 현황 조회
    const sources = ['smes', 'bizinfo', 'kstartup', 'g2b', 'local']
    const summaries = await Promise.all(
      sources.map(async (src) => {
        const summary = await getSourceSummary(src, days)
        return {
          source: src,
          lastSync: summary.lastSync,
          status: summary.status,
          stats: {
            last24h: summary.last24h,
            last7d: summary.last7d,
          },
        }
      })
    )

    // 실행 중인 동기화 작업 조회
    const runningSyncs = await getRunningSyncs()
    const runningSyncsData = runningSyncs.map((sync) => ({
      source: sync.source,
      startedAt: sync.started_at,
      duration: calculateDuration(sync.started_at, new Date().toISOString()),
    }))

    const response: SyncStatusResponse = {
      sources: summaries,
      runningSyncs: runningSyncsData.length > 0 ? runningSyncsData : undefined,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('동기화 상태 조회 중 오류:', error)
    return NextResponse.json(
      { error: '동기화 상태를 조회할 수 없어요' },
      { status: 500 }
    )
  }
}

/**
 * 동기화 소요 시간 계산 (분 단위)
 */
function calculateDuration(startedAt: string, completedAt: string): string {
  const start = new Date(startedAt)
  const end = new Date(completedAt)
  const diffMs = end.getTime() - start.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffSecs = Math.floor((diffMs % 60000) / 1000)

  if (diffMins > 0) {
    return `${diffMins}분 ${diffSecs}초`
  }
  return `${diffSecs}초`
}
