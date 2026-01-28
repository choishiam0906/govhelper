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
import { fetchWithRetry } from '@/lib/api/retry'

// 중소벤처24 API 설정
const SMES_API_URL = 'https://www.smes.go.kr/main/fnct/apiReqst/extPblancInfo'
const SMES_API_TOKEN = process.env.SMES_API_TOKEN || ''

// Supabase Admin Client 생성 (런타임에 호출)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface SMESAnnouncement {
  pblancSeq: number
  pblancNm: string
  sportInsttNm: string
  bizType: string
  sportType: string
  pblancBgnDt: string
  pblancEndDt: string
  areaNm: string
  cmpScale: string
  pblancDtlUrl: string
  creatDt: string
  updDt: string
  policyCnts?: string
  sportCnts?: string
  sportTrget?: string
  // 추가 필드
  ablbiz?: string           // 적용 업종
  emplyCnt?: string         // 직원수 제한
  needCrtfn?: string        // 필요 인증
  pblancAttach?: string     // 첨부파일 URL
  pblancAttachNm?: string   // 첨부파일명
  sportAmt?: string         // 지원금액
}

// 날짜 포맷 (YYYYMMDD)
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

// YYYY-MM-DD 형식으로 변환
function toDateFormat(dateStr: string): string | null {
  if (!dateStr || dateStr.length < 10) return null
  if (dateStr.includes('-')) return dateStr.substring(0, 10)
  if (dateStr.length >= 8) {
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
  }
  return null
}

// 오늘 날짜 (YYYY-MM-DD)
function getTodayStr(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

export async function POST(request: NextRequest) {
  const log = createRequestLogger(request, 'smes-sync')
  log.info('SMES 동기화 시작')

  // Vercel Cron 요청은 Rate Limiting 제외
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
  const logId = await startSync('smes')
  log.debug('동기화 로그 생성', { logId })

  try {
    const supabase = getSupabaseAdmin()

    // 조회 기간: 최근 3개월 ~ 2개월 후 (짧게 조정)
    const today = new Date()
    const startDate = new Date(today)
    startDate.setMonth(startDate.getMonth() - 3)
    const endDate = new Date(today)
    endDate.setMonth(endDate.getMonth() + 2)

    // SMES API 호출 (재시도 로직 포함)
    const apiUrl = `${SMES_API_URL}?token=${SMES_API_TOKEN}&strDt=${formatDate(startDate)}&endDt=${formatDate(endDate)}`

    const response = await fetchWithRetry(
      apiUrl,
      {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      },
      {
        maxRetries: 3,
        baseDelay: 2000,
        backoff: 'exponential',
      }
    )

    // fetchWithRetry는 이미 !res.ok 체크를 하므로 여기서는 제거
    log.debug('SMES API 호출 성공', { status: response.status })

    const result = await response.json()

    if (result.resultCd !== '0') {
      log.error('SMES API 응답 오류', { resultCd: result.resultCd, resultMsg: result.resultMsg })
      return NextResponse.json(
        { success: false, error: result.resultMsg || 'SMES API 오류' },
        { status: 500 }
      )
    }

    let announcements: SMESAnnouncement[] = result.data || []
    log.info('SMES API 데이터 조회 완료', { count: announcements.length })

    // 진행 중인 공고만 필터링
    const todayStr = getTodayStr()
    announcements = announcements.filter(item => {
      const endDt = item.pblancEndDt
      return endDt && endDt >= todayStr
    })

    // 중복 제거
    const seen = new Set<number>()
    const uniqueAnnouncements = announcements.filter(item => {
      if (seen.has(item.pblancSeq)) return false
      seen.add(item.pblancSeq)
      return true
    })

    // 데이터 변환 및 중복 감지 (배치용)
    const announcementsToUpsert = []
    let skippedDuplicates = 0

    for (const item of uniqueAnnouncements) {
      // 지원 대상 정보 구성 (기업규모 + 업종 + 직원수 + 인증)
      const targetParts = [
        item.cmpScale,
        item.ablbiz ? `업종: ${item.ablbiz}` : '',
        item.emplyCnt ? `직원수: ${item.emplyCnt}` : '',
        item.needCrtfn ? `필요인증: ${item.needCrtfn}` : '',
      ].filter(Boolean)

      // 첨부파일 URL 배열 생성
      const attachmentUrls: string[] = []
      if (item.pblancAttach) {
        attachmentUrls.push(item.pblancAttach)
      }

      const announcement = {
        source: 'smes24',
        source_id: String(item.pblancSeq),
        title: item.pblancNm,
        organization: item.sportInsttNm || '',
        category: item.bizType || '',
        support_type: item.sportType || '',
        target_company: targetParts.join(' / ') || '',
        support_amount: item.sportAmt || '',
        application_start: toDateFormat(item.pblancBgnDt),
        application_end: toDateFormat(item.pblancEndDt),
        content: [
          item.policyCnts || '',
          item.sportCnts || '',
          item.sportTrget || '',
          item.areaNm ? `지역: ${item.areaNm}` : '',
          item.pblancDtlUrl ? `상세보기: ${item.pblancDtlUrl}` : ''
        ].filter(Boolean).join('\n\n'),
        attachment_urls: attachmentUrls.length > 0 ? attachmentUrls : null,
        status: 'active',
        updated_at: new Date().toISOString()
      }

      // 중복 감지
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
        continue // 중복이면 skip
      }

      announcementsToUpsert.push(announcement)
    }

    // 배치 upsert + 변경 감지
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

    // 마감된 SMES 공고 비활성화
    await supabase
      .from('announcements')
      .update({ status: 'expired' })
      .eq('source', 'smes24')
      .lt('application_end', todayStr)

    // AI 자동 분류: eligibility_criteria가 null인 새 공고들 파싱
    let aiParsed = 0
    try {
      // 파싱되지 않은 최근 공고 조회 (최대 10개, API 비용 및 시간 제한)
      const { data: unparsedAnnouncements } = await supabase
        .from('announcements')
        .select('id, title, content, target_company')
        .eq('source', 'smes24')
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

    log.info('SMES 동기화 완료', {
      duration: `${duration}ms`,
      total: uniqueAnnouncements.length,
      skippedDuplicates,
      upserted: syncResult.upserted,
      changesDetected: syncResult.changesDetected,
      notificationsQueued: syncResult.notificationsQueued,
      aiParsed
    })

    // 동기화 로그 저장
    if (logId) {
      await endSync(logId, {
        total_fetched: uniqueAnnouncements.length,
        new_added: syncResult.upserted,
        updated: syncResult.changesDetected,
        failed: 0,
      })
    }

    return NextResponse.json({
      success: true,
      message: '동기화 완료',
      stats: {
        total: uniqueAnnouncements.length,
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
    log.error('SMES 동기화 오류', {
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

export async function GET(request: NextRequest) {
  return POST(request)
}
