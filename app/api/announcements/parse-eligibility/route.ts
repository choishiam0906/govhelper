import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseEligibilityCriteria } from '@/lib/ai'
import {
  syncRateLimiter,
  checkRateLimit,
  getClientIP,
  getRateLimitHeaders,
  isRateLimitEnabled,
} from '@/lib/rate-limit'
import {
  parallelBatchWithRetry,
  summarizeBatchResults,
} from '@/lib/utils/parallel-batch'

// Supabase Admin Client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// 단일 공고 파싱 (GET)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { success: false, error: '공고 ID가 필요해요' },
      { status: 400 }
    )
  }

  try {
    const supabase = getSupabaseAdmin()

    // 공고 조회
    const { data: announcement, error: fetchError } = await supabase
      .from('announcements')
      .select('id, title, content, target_company, eligibility_criteria')
      .eq('id', id)
      .single()

    if (fetchError || !announcement) {
      return NextResponse.json(
        { success: false, error: '공고를 찾을 수 없어요' },
        { status: 404 }
      )
    }

    // 이미 파싱된 경우 캐시된 결과 반환
    if (announcement.eligibility_criteria) {
      return NextResponse.json({
        success: true,
        data: announcement.eligibility_criteria,
        cached: true
      })
    }

    // AI로 파싱
    const criteria = await parseEligibilityCriteria(
      announcement.title,
      announcement.content || '',
      announcement.target_company
    )

    // DB 업데이트
    await supabase
      .from('announcements')
      .update({ eligibility_criteria: criteria })
      .eq('id', id)

    return NextResponse.json({
      success: true,
      data: criteria,
      cached: false
    })

  } catch (error) {
    console.error('Eligibility parsing error:', error)
    return NextResponse.json(
      { success: false, error: '파싱 중 오류가 발생했어요' },
      { status: 500 }
    )
  }
}

// 배치 파싱 (POST)
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
          error: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.',
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

  try {
    const supabase = getSupabaseAdmin()

    // 요청 본문에서 옵션 가져오기
    let options = { limit: 20, source: null as string | null, forceReparse: false }
    try {
      const body = await request.json()
      options = { ...options, ...body }
    } catch {
      // 본문 없으면 기본값 사용
    }

    // eligibility_criteria가 null인 공고들 조회
    let query = supabase
      .from('announcements')
      .select('id, title, content, target_company')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(options.limit)

    if (!options.forceReparse) {
      query = query.is('eligibility_criteria', null)
    }

    if (options.source) {
      query = query.eq('source', options.source)
    }

    const { data: announcements, error: fetchError } = await query

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      )
    }

    if (!announcements || announcements.length === 0) {
      return NextResponse.json({
        success: true,
        message: '파싱할 공고가 없어요',
        stats: { total: 0, parsed: 0, duration: `${Date.now() - startTime}ms` }
      })
    }


    // 병렬 배치 처리 (동시 5개, 배치 간 500ms 딜레이)
    const results = await parallelBatchWithRetry(
      announcements,
      async (ann) => {
        const criteria = await parseEligibilityCriteria(
          ann.title,
          ann.content || '',
          ann.target_company
        )

        // DB 업데이트
        const { error: updateError } = await supabase
          .from('announcements')
          .update({ eligibility_criteria: criteria })
          .eq('id', ann.id)

        if (updateError) {
          throw new Error(`DB 업데이트 실패: ${updateError.message}`)
        }

        return criteria
      },
      {
        concurrency: 5,
        delayBetweenBatches: 500,
        onProgress: (completed, total) => {
        }
      },
      2 // 최대 2회 재시도
    )

    const summary = summarizeBatchResults(results)
    const duration = Date.now() - startTime


    return NextResponse.json({
      success: true,
      message: '지원자격 파싱 완료',
      stats: {
        total: summary.total,
        parsed: summary.succeeded,
        failed: summary.failed,
        successRate: `${summary.successRate.toFixed(1)}%`,
        duration: `${duration}ms`,
        parsedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Batch parsing error:', error)
    return NextResponse.json(
      { success: false, error: '파싱 중 오류가 발생했어요' },
      { status: 500 }
    )
  }
}
