import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { startSync, endSync } from '@/lib/sync/logger'
import { createRequestLogger } from '@/lib/logger'
import { cleanupOldMetrics } from '@/lib/metrics/api-metrics'

// Supabase Admin Client 생성
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * 공고 아카이브 Cron 핸들러
 *
 * 실행 주기: 매일 06:00 UTC (한국 시간 15:00)
 *
 * 처리 단계:
 * 1. 만료 처리: application_end < today인 active 공고를 expired로 변경
 * 2. 아카이브 처리: 90일 이상 expired인 공고를 archived로 변경
 * 3. 정리: 180일 이상 archived인 공고의 임베딩 데이터 삭제
 * 4. 통계 로깅: sync_logs 테이블에 source='archive'로 기록
 */
export async function POST(request: NextRequest) {
  const log = createRequestLogger(request, 'archive-cron')
  log.info('공고 아카이브 Cron 시작')

  // Vercel Cron 인증 체크
  const isCronRequest = request.headers.get('x-vercel-cron') === '1'
  const authHeader = request.headers.get('authorization')

  if (!isCronRequest && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    log.warn('인증 실패', { isCronRequest, hasAuthHeader: !!authHeader })
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const startTime = Date.now()
  const logId = await startSync('archive')
  log.debug('동기화 로그 생성', { logId })

  try {
    const supabase = getSupabaseAdmin()
    const today = new Date().toISOString().split('T')[0]

    // 통계 변수 초기화
    let expiredCount = 0
    let archivedCount = 0
    let embeddingsDeletedCount = 0

    // 1. 만료 처리: application_end < today인 active 공고를 expired로 변경
    log.info('만료 공고 처리 시작')
    const { count: expiredUpdated, error: expiredError } = await supabase
      .from('announcements')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString()
      }, { count: 'exact' })
      .eq('status', 'active')
      .lt('application_end', today)

    if (expiredError) {
      log.error('만료 공고 업데이트 실패', { error: expiredError.message })
      throw expiredError
    }

    expiredCount = expiredUpdated || 0
    log.info('만료 공고 처리 완료', { count: expiredCount })

    // 2. 아카이브 처리: 90일 이상 expired인 공고를 archived로 변경
    log.info('아카이브 처리 시작')
    const archiveDate = new Date()
    archiveDate.setDate(archiveDate.getDate() - 90)
    const archiveDateStr = archiveDate.toISOString().split('T')[0]

    const { count: archivedUpdated, error: archiveError } = await supabase
      .from('announcements')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { count: 'exact' })
      .eq('status', 'expired')
      .lt('application_end', archiveDateStr)

    if (archiveError) {
      log.error('아카이브 처리 실패', { error: archiveError.message })
      throw archiveError
    }

    archivedCount = archivedUpdated || 0
    log.info('아카이브 처리 완료', { count: archivedCount })

    // 3. 정리: 180일 이상 archived인 공고의 임베딩 데이터 삭제
    log.info('임베딩 데이터 정리 시작')
    const cleanupDate = new Date()
    cleanupDate.setDate(cleanupDate.getDate() - 180)

    // 먼저 삭제할 공고 ID 조회
    const { data: oldArchivedAnnouncements, error: selectError } = await supabase
      .from('announcements')
      .select('id')
      .eq('status', 'archived')
      .not('archived_at', 'is', null)
      .lt('archived_at', cleanupDate.toISOString())

    if (selectError) {
      log.error('오래된 archived 공고 조회 실패', { error: selectError.message })
      throw selectError
    }

    if (oldArchivedAnnouncements && oldArchivedAnnouncements.length > 0) {
      const announcementIds = oldArchivedAnnouncements.map(a => a.id)

      // announcement_embeddings 테이블에서 해당 공고의 임베딩 삭제
      const { count: embeddingsDeleted, error: deleteError } = await supabase
        .from('announcement_embeddings')
        .delete({ count: 'exact' })
        .in('announcement_id', announcementIds)

      if (deleteError) {
        log.error('임베딩 데이터 삭제 실패', { error: deleteError.message })
        throw deleteError
      }

      embeddingsDeletedCount = embeddingsDeleted || 0
      log.info('임베딩 데이터 정리 완료', {
        announcementCount: announcementIds.length,
        embeddingsDeleted: embeddingsDeletedCount
      })
    } else {
      log.info('삭제할 오래된 임베딩 없음')
    }

    // 4. 오래된 API 메트릭 정리 (7일 이상)
    log.info('오래된 API 메트릭 정리 시작')
    await cleanupOldMetrics()
    log.info('오래된 API 메트릭 정리 완료')

    const duration = Date.now() - startTime

    log.info('아카이브 Cron 완료', {
      duration: `${duration}ms`,
      expiredCount,
      archivedCount,
      embeddingsDeletedCount
    })

    // 5. 동기화 로그 저장
    if (logId) {
      await endSync(logId, {
        total_fetched: expiredCount + archivedCount,
        new_added: 0,
        updated: expiredCount + archivedCount,
        failed: 0,
      })
    }

    return NextResponse.json({
      success: true,
      message: '아카이브 처리 완료',
      stats: {
        expiredCount,
        archivedCount,
        embeddingsDeletedCount,
        duration: `${duration}ms`,
        executedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    log.error('아카이브 Cron 오류', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    // 동기화 실패 로그 저장
    if (logId) {
      await endSync(
        logId,
        { total_fetched: 0, new_added: 0, updated: 0, failed: 0 },
        error instanceof Error ? error.message : '아카이브 처리 중 오류가 발생했습니다'
      )
    }

    return NextResponse.json(
      { success: false, error: '아카이브 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

export const GET = (request: NextRequest) => POST(request)
export const dynamic = 'force-dynamic'
export const maxDuration = 60
