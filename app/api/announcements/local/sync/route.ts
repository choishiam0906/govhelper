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
  // Vercel Cron 요청은 Rate Limiting 제외
  const isCronRequest = request.headers.get('x-vercel-cron') === '1'

  if (!isCronRequest && isRateLimitEnabled()) {
    const ip = getClientIP(request)
    const result = await checkRateLimit(syncRateLimiter, ip)

    if (!result.success) {
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

    // TODO: 활성화된 각 지자체별 스크래퍼 실행
    // 예시:
    // for (const source of enabledSources) {
    //   switch (source.id) {
    //     case 'seoul':
    //       await syncSeoulAnnouncements(supabase)
    //       break
    //     case 'gyeonggi':
    //       await syncGyeonggiAnnouncements(supabase)
    //       break
    //     // ... 기타 지자체
    //   }
    // }

    const duration = Date.now() - startTime

    // 동기화 로그 저장
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
      message: '지자체 동기화 완료',
      stats: {
        enabledSources: enabledSources.length,
        sources: enabledSources.map(s => s.name),
        total: 0,
        upserted: 0,
        changesDetected: 0,
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
