import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  syncRateLimiter,
  checkRateLimit,
  getClientIP,
  getRateLimitHeaders,
  isRateLimitEnabled,
} from '@/lib/rate-limit'
import { parseEligibilityCriteria } from '@/lib/ai'
import { syncWithChangeDetection } from '@/lib/announcements/sync-with-changes'
import { startSync, endSync } from '@/lib/sync/logger'
import { detectDuplicate } from '@/lib/announcements/duplicate-detector'
import { createRequestLogger } from '@/lib/logger'

// Supabase Admin Client 생성
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// 오늘 날짜 (YYYY-MM-DD)
function getTodayStr(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// 공통 설정 인터페이스
export interface SyncConfig {
  source: 'smes24' | 'bizinfo' | 'kstartup' | 'g2b'  // 데이터 소스
  logPrefix: string                                   // 로그 prefix (예: 'smes-sync')
  fetchAndTransform: (supabase: any) => Promise<{    // 데이터 fetching 및 변환 함수
    announcements: any[]                              // 변환된 공고 배열
    totalFetched: number                              // 원본 fetching 개수
  }>
}

/**
 * 공통 sync 핸들러 팩토리 함수
 *
 * 4개 sync 라우트(smes, bizinfo, kstartup, g2b)의 공통 로직을 추상화:
 * 1. Rate Limiting 체크
 * 2. 동기화 로그 시작 (startSync)
 * 3. 데이터 fetching 및 변환 (config.fetchAndTransform)
 * 4. 중복 감지 (detectDuplicate)
 * 5. 배치 upsert + 변경 감지 (syncWithChangeDetection)
 * 6. 마감 공고 비활성화
 * 7. AI 자동 분류 (parseEligibilityCriteria)
 * 8. 동기화 로그 종료 (endSync)
 * 9. 응답 반환
 *
 * @param config SyncConfig 설정 객체
 * @returns POST 핸들러 함수
 */
export function createSyncHandler(config: SyncConfig) {
  return async function POST(request: NextRequest) {
    const log = createRequestLogger(request, config.logPrefix)
    log.info(`${config.source} 동기화 시작`)

    // 1. Rate Limiting 체크 (Vercel Cron 요청은 제외)
    const isCronRequest = request.headers.get('x-vercel-cron') === '1'

    if (!isCronRequest && isRateLimitEnabled()) {
      const ip = getClientIP(request)
      const result = await checkRateLimit(syncRateLimiter, ip)

      if (!result.success) {
        log.warn('Rate limit 초과', { ip, retryAfter: Math.ceil((result.reset - Date.now()) / 1000) })
        return NextResponse.json(
          {
            success: false,
            error: '동기화 요청이 너무 많아요. 잠시 후 다시 시도해주세요.',
            retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: getRateLimitHeaders(result),
          }
        )
      }
    }

    const startTime = Date.now()
    const logId = await startSync(config.source)
    log.debug('동기화 로그 생성', { logId })

    try {
      const supabase = getSupabaseAdmin()
      const todayStr = getTodayStr()

      // 3. 데이터 fetching 및 변환 (각 소스별 로직)
      const { announcements: fetchedAnnouncements, totalFetched } = await config.fetchAndTransform(supabase)
      log.info('데이터 조회 완료', { count: fetchedAnnouncements.length, totalFetched })

      // 4. 중복 감지 및 필터링
      const announcementsToUpsert = []
      let skippedDuplicates = 0

      for (const announcement of fetchedAnnouncements) {
        const duplicateResult = await detectDuplicate(
          announcement.title,
          announcement.organization,
          announcement.source,
          supabase
        )

        if (duplicateResult.isDuplicate) {
          log.debug('중복 공고 스킵', {
            title: announcement.title,
            similarity: (duplicateResult.similarity * 100).toFixed(1),
            originalId: duplicateResult.originalId
          })
          skippedDuplicates++
          continue
        }

        announcementsToUpsert.push(announcement)
      }

      // 5. 배치 upsert + 변경 감지
      let syncResult
      try {
        log.info('배치 upsert 시작', { count: announcementsToUpsert.length })
        syncResult = await syncWithChangeDetection(supabase, announcementsToUpsert)
        log.info('배치 upsert 완료', {
          upserted: syncResult.upserted,
          changesDetected: syncResult.changesDetected
        })
      } catch (error) {
        log.error('배치 upsert 실패', {
          error: error instanceof Error ? error.message : 'Unknown error',
          count: announcementsToUpsert.length
        })
        return NextResponse.json(
          { success: false, error: error instanceof Error ? error.message : 'Sync failed' },
          { status: 500 }
        )
      }

      // 6. 마감된 공고 비활성화
      await supabase
        .from('announcements')
        .update({ status: 'expired' })
        .eq('source', config.source)
        .lt('application_end', todayStr)

      // 7. AI 자동 분류: eligibility_criteria가 null인 새 공고들 파싱
      let aiParsed = 0
      try {
        const { data: unparsedAnnouncements } = await supabase
          .from('announcements')
          .select('id, title, content, target_company')
          .eq('source', config.source)
          .eq('status', 'active')
          .is('eligibility_criteria', null)
          .order('created_at', { ascending: false })
          .limit(10)

        if (unparsedAnnouncements && unparsedAnnouncements.length > 0) {
          for (const ann of unparsedAnnouncements) {
            try {
              const criteria = await parseEligibilityCriteria(
                ann.title,
                ann.content || '',
                ann.target_company
              )

              await supabase
                .from('announcements')
                .update({ eligibility_criteria: criteria })
                .eq('id', ann.id)

              aiParsed++

              // Rate limiting: Gemini API 요청 간 딜레이
              await new Promise(resolve => setTimeout(resolve, 1000))
            } catch (parseError) {
              log.warn('AI 분류 실패', {
                announcementId: ann.id,
                error: parseError instanceof Error ? parseError.message : 'Unknown error'
              })
            }
          }
        }
      } catch (aiError) {
        log.error('AI 자동 분류 중 오류', {
          error: aiError instanceof Error ? aiError.message : 'Unknown error'
        })
      }

      log.info('AI 자동 분류 완료', { aiParsed })

      const duration = Date.now() - startTime

      log.info('동기화 완료', {
        duration: `${duration}ms`,
        total: fetchedAnnouncements.length,
        skippedDuplicates,
        upserted: syncResult.upserted,
        changesDetected: syncResult.changesDetected,
        notificationsQueued: syncResult.notificationsQueued,
        aiParsed
      })

      // 8. 동기화 로그 저장
      if (logId) {
        await endSync(logId, {
          total_fetched: fetchedAnnouncements.length,
          new_added: syncResult.upserted,
          updated: syncResult.changesDetected,
          failed: 0,
        })
      }

      // 9. 응답 반환
      return NextResponse.json({
        success: true,
        message: '동기화 완료',
        stats: {
          totalFetched,
          filtered: fetchedAnnouncements.length,
          skippedDuplicates,
          upserted: syncResult.upserted,
          changesDetected: syncResult.changesDetected,
          notificationsQueued: syncResult.notificationsQueued,
          aiParsed,
          duration: `${duration}ms`,
          syncedAt: new Date().toISOString()
        }
      })

    } catch (error) {
      log.error('동기화 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })

      // 동기화 실패 로그 저장
      if (logId) {
        await endSync(
          logId,
          { total_fetched: 0, new_added: 0, updated: 0, failed: 0 },
          error instanceof Error ? error.message : '동기화 중 오류가 발생했습니다'
        )
      }

      return NextResponse.json(
        { success: false, error: '동기화 중 오류가 발생했습니다' },
        { status: 500 }
      )
    }
  }
}
