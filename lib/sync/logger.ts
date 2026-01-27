import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface SyncStats {
  total_fetched: number
  new_added: number
  updated: number
  failed: number
}

export interface SyncLog {
  id: string
  source: string
  started_at: string
  completed_at: string | null
  status: 'running' | 'success' | 'failed'
  total_fetched: number
  new_added: number
  updated: number
  failed: number
  error_message: string | null
  created_at: string
}

/**
 * 동기화 시작 로그 생성
 */
export async function startSync(source: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('sync_logs')
      .insert({
        source,
        started_at: new Date().toISOString(),
        status: 'running',
      })
      .select('id')
      .single()

    if (error) {
      console.error('동기화 시작 로그 생성 실패:', error)
      return null
    }

    return data.id
  } catch (error) {
    console.error('동기화 시작 로그 생성 중 오류:', error)
    return null
  }
}

/**
 * 동기화 완료/실패 로그 업데이트
 */
export async function endSync(
  logId: string,
  stats: SyncStats,
  errorMessage?: string
): Promise<void> {
  try {
    const status = errorMessage ? 'failed' : 'success'

    const { error } = await supabase
      .from('sync_logs')
      .update({
        completed_at: new Date().toISOString(),
        status,
        total_fetched: stats.total_fetched,
        new_added: stats.new_added,
        updated: stats.updated,
        failed: stats.failed,
        error_message: errorMessage || null,
      })
      .eq('id', logId)

    if (error) {
      console.error('동기화 완료 로그 업데이트 실패:', error)
    }
  } catch (error) {
    console.error('동기화 완료 로그 업데이트 중 오류:', error)
  }
}

/**
 * 최근 N일간 동기화 통계 조회
 */
export async function getSyncStats(source?: string, days: number = 7) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    let query = supabase
      .from('sync_logs')
      .select('*')
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })

    if (source) {
      query = query.eq('source', source)
    }

    const { data, error } = await query

    if (error) {
      console.error('동기화 통계 조회 실패:', error)
      return null
    }

    return data as SyncLog[]
  } catch (error) {
    console.error('동기화 통계 조회 중 오류:', error)
    return null
  }
}

/**
 * 특정 소스의 최근 동기화 로그 조회
 */
export async function getLastSyncLog(source: string): Promise<SyncLog | null> {
  try {
    const { data, error } = await supabase
      .from('sync_logs')
      .select('*')
      .eq('source', source)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('최근 동기화 로그 조회 실패:', error)
      return null
    }

    return data as SyncLog
  } catch (error) {
    console.error('최근 동기화 로그 조회 중 오류:', error)
    return null
  }
}

/**
 * 실행 중인 동기화 작업 조회
 */
export async function getRunningSyncs(): Promise<SyncLog[]> {
  try {
    const { data, error } = await supabase
      .from('sync_logs')
      .select('*')
      .eq('status', 'running')
      .order('started_at', { ascending: false })

    if (error) {
      console.error('실행 중인 동기화 작업 조회 실패:', error)
      return []
    }

    return data as SyncLog[]
  } catch (error) {
    console.error('실행 중인 동기화 작업 조회 중 오류:', error)
    return []
  }
}

/**
 * 소스별 통계 요약
 */
export async function getSourceSummary(source: string, days: number = 7) {
  const logs = await getSyncStats(source, days)

  if (!logs || logs.length === 0) {
    return {
      lastSync: null,
      status: null,
      last24h: { success: 0, failed: 0 },
      last7d: { totalFetched: 0, newAdded: 0, updated: 0, failed: 0 },
    }
  }

  const now = new Date()
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const recentLogs = logs.filter(
    (log) => new Date(log.created_at) >= last24h
  )

  const last24hStats = {
    success: recentLogs.filter((log) => log.status === 'success').length,
    failed: recentLogs.filter((log) => log.status === 'failed').length,
  }

  const last7dStats = logs.reduce(
    (acc, log) => ({
      totalFetched: acc.totalFetched + log.total_fetched,
      newAdded: acc.newAdded + log.new_added,
      updated: acc.updated + log.updated,
      failed: acc.failed + log.failed,
    }),
    { totalFetched: 0, newAdded: 0, updated: 0, failed: 0 }
  )

  return {
    lastSync: logs[0].completed_at || logs[0].started_at,
    status: logs[0].status,
    last24h: last24hStats,
    last7d: last7dStats,
  }
}
