import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  syncRateLimiter,
  checkRateLimit,
  getClientIP,
  getRateLimitHeaders,
  isRateLimitEnabled,
} from '@/lib/rate-limit'
import { startSync, endSync } from '@/lib/sync/logger'
import { getEnabledLocalSources } from '@/lib/announcements/local-sources'
import { getScraperById } from '@/lib/announcements/scrapers'
import { syncWithChangeDetection } from '@/lib/announcements/sync-with-changes'
import { detectDuplicate } from '@/lib/announcements/duplicate-detector'
import { createRequestLogger } from '@/lib/logger'
import { parseEligibilityCriteria } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// Supabase Admin Client 생성
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const log = createRequestLogger(request, 'local-sync')
  log.info('지자체 동기화 시작')

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
  const logId = await startSync('local')

  try {
    const supabase = getSupabaseAdmin()

    // 활성화된 지자체 소스 조회
    const enabledSources = getEnabledLocalSources()

    if (enabledSources.length === 0) {
      // 활성화된 소스 없음 - 정상 종료
      const duration = Date.now() - startTime
      log.info('활성화된 지자체 소스 없음', { duration })

      if (logId) {
        await endSync(logId, {
          total_fetched: 0,
          new_added: 0,
          updated: 0,
          failed: 0,
        })
      }

      return NextResponse.json({
        success: true,
        message: '활성화된 지자체 소스가 없어요',
        stats: {
          enabledSources: 0,
          total: 0,
          upserted: 0,
          changesDetected: 0,
          duration: `${duration}ms`,
          syncedAt: new Date().toISOString()
        }
      })
    }

    log.info('활성화된 지자체 소스', {
      count: enabledSources.length,
      sources: enabledSources.map(s => s.id)
    })

    // 각 지자체별 스크래퍼 실행
    let totalFetched = 0
    let totalUpserted = 0
    let totalChanges = 0
    let totalFailed = 0

    for (const source of enabledSources) {
      try {
        log.info(`[${source.name}] 스크래핑 시작`)

        // 스크래퍼 조회
        const scraper = getScraperById(source.id)
        if (!scraper) {
          log.warn(`[${source.name}] 스크래퍼를 찾을 수 없어요`, { sourceId: source.id })
          totalFailed++
          continue
        }

        // 공고 스크래핑
        const scraperResult = await scraper.scrape({ limit: 20, daysBack: 30 })
        totalFetched += scraperResult.total

        log.info(`[${source.name}] 스크래핑 완료`, { total: scraperResult.total })

        if (scraperResult.announcements.length === 0) {
          log.info(`[${source.name}] 수집된 공고 없음`)
          continue
        }

        // DB 형식으로 변환
        const announcementsToUpsert = []

        for (const item of scraperResult.announcements) {
          // 중복 감지
          const duplicateResult = await detectDuplicate(
            item.title,
            item.organization,
            scraperResult.source,
            supabase
          )

          if (duplicateResult.isDuplicate) {
            log.info(`[${source.name}] 중복 스킵`, { title: item.title })
            continue
          }

          announcementsToUpsert.push({
            source: scraperResult.source,
            source_id: item.source_id,
            title: item.title,
            organization: item.organization,
            category: item.category || '지자체',
            support_type: item.support_type || source.name,
            target_company: item.target_company || '',
            support_amount: item.support_amount || '',
            application_start: item.application_start || null,
            application_end: item.application_end || null,
            content: item.content || `상세보기: ${item.detail_url || ''}`,
            attachment_urls: item.attachment_urls || [],
            status: 'active',
            updated_at: new Date().toISOString(),
          })
        }

        if (announcementsToUpsert.length === 0) {
          log.info(`[${source.name}] 저장할 공고 없음 (중복 제외)`)
          continue
        }

        // 배치 upsert + 변경 감지
        const syncResult = await syncWithChangeDetection(supabase, announcementsToUpsert)
        totalUpserted += syncResult.upserted
        totalChanges += syncResult.changesDetected

        log.info(`[${source.name}] 동기화 완료`, {
          upserted: syncResult.upserted,
          changes: syncResult.changesDetected
        })

        // AI 자동 분류: 최신 10개 공고 eligibility_criteria 파싱
        if (syncResult.upserted > 0) {
          const { data: latestAnnouncements } = await supabase
            .from('announcements')
            .select('id, title, content, parsed_content, eligibility')
            .eq('source', scraperResult.source)
            .is('eligibility_criteria', null)
            .order('created_at', { ascending: false })
            .limit(10)

          if (latestAnnouncements && latestAnnouncements.length > 0) {
            log.info(`[${source.name}] AI 자동 분류 시작`, { count: latestAnnouncements.length })

            for (const ann of latestAnnouncements) {
              try {
                const criteria = await parseEligibilityCriteria(
                  ann.title,
                  ann.content || ann.parsed_content || ann.eligibility || '',
                  null
                )

                await supabase
                  .from('announcements')
                  .update({ eligibility_criteria: criteria })
                  .eq('id', ann.id)

                log.info(`[${source.name}] AI 파싱 완료`, { id: ann.id })
              } catch (parseError) {
                log.error(`[${source.name}] AI 파싱 오류`, {
                  id: ann.id,
                  error: parseError instanceof Error ? parseError.message : String(parseError)
                })
              }
            }
          }
        }

      } catch (error) {
        log.error(`[${source.name}] 동기화 오류`, {
          error: error instanceof Error ? error.message : String(error)
        })
        totalFailed++
      }
    }

    const duration = Date.now() - startTime

    // 동기화 로그 저장
    if (logId) {
      await endSync(logId, {
        total_fetched: totalFetched,
        new_added: totalUpserted,
        updated: totalChanges,
        failed: totalFailed,
      })
    }

    log.info('지자체 동기화 완료', {
      duration,
      totalFetched,
      totalUpserted,
      totalChanges,
      totalFailed
    })

    return NextResponse.json({
      success: true,
      message: '지자체 동기화 완료',
      stats: {
        enabledSources: enabledSources.length,
        sources: enabledSources.map(s => s.name),
        totalFetched,
        totalUpserted,
        totalChanges,
        totalFailed,
        duration: `${duration}ms`,
        syncedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('지자체 동기화 오류:', error)

    // 동기화 실패 로그 저장
    if (logId) {
      await endSync(
        logId,
        { total_fetched: 0, new_added: 0, updated: 0, failed: 0 },
        error instanceof Error ? error.message : '동기화 중 오류가 발생했어요'
      )
    }

    return NextResponse.json(
      { success: false, error: '동기화 중 오류가 발생했어요' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
