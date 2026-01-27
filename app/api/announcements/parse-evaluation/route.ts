/**
 * 공고 평가기준 추출 API
 *
 * GET: 단일 공고 평가기준 추출
 * POST: 배치 평가기준 추출 (관리자용)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractEvaluationCriteria } from '@/lib/ai/gemini'
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

// 단일 공고 평가기준 추출 (GET)
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
      .select('id, title, content, parsed_content, evaluation_criteria, evaluation_parsed')
      .eq('id', id)
      .single()

    if (fetchError || !announcement) {
      return NextResponse.json(
        { success: false, error: '공고를 찾을 수 없어요' },
        { status: 404 }
      )
    }

    // 이미 파싱된 경우 캐시된 결과 반환
    if (announcement.evaluation_parsed && announcement.evaluation_criteria) {
      return NextResponse.json({
        success: true,
        data: announcement.evaluation_criteria,
        cached: true
      })
    }

    // 파싱할 컨텐츠 결정 (parsed_content 우선, 없으면 content)
    const contentToAnalyze = announcement.parsed_content || announcement.content || ''

    if (!contentToAnalyze || contentToAnalyze.length < 100) {
      return NextResponse.json({
        success: false,
        error: '분석할 공고 내용이 부족해요'
      })
    }

    // AI 평가기준 추출
    const result = await extractEvaluationCriteria(announcement.title, contentToAnalyze)

    if (result.success && result.criteria) {
      // DB에 결과 저장
      await supabase
        .from('announcements')
        .update({
          evaluation_criteria: result.criteria,
          evaluation_parsed: true,
          evaluation_parsed_at: new Date().toISOString()
        })
        .eq('id', id)

      return NextResponse.json({
        success: true,
        data: result.criteria,
        summary: result.summary,
        cached: false
      })
    }

    // 평가기준을 찾지 못한 경우에도 파싱 완료로 표시 (재시도 방지)
    await supabase
      .from('announcements')
      .update({
        evaluation_parsed: true,
        evaluation_parsed_at: new Date().toISOString()
      })
      .eq('id', id)

    return NextResponse.json({
      success: false,
      error: result.error || '평가기준을 추출할 수 없어요'
    })

  } catch (error) {
    console.error('평가기준 추출 오류:', error)
    return NextResponse.json(
      { success: false, error: '추출 중 오류가 발생했어요' },
      { status: 500 }
    )
  }
}

// 배치 평가기준 추출 (POST)
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
    let options = { limit: 20, forceReparse: false }
    try {
      const body = await request.json()
      options = { ...options, ...body }
    } catch {
      // 본문 없으면 기본값 사용
    }

    // evaluation_parsed가 false이거나 null인 공고들 조회
    let query = supabase
      .from('announcements')
      .select('id, title, content, parsed_content')
      .eq('status', 'active')
      .not('parsed_content', 'is', null)
      .order('created_at', { ascending: false })
      .limit(options.limit)

    if (!options.forceReparse) {
      query = query.or('evaluation_parsed.is.null,evaluation_parsed.eq.false')
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


    // 병렬 배치 처리 (동시 5개, 배치 간 1000ms 딜레이)
    const results = await parallelBatchWithRetry(
      announcements,
      async (ann: { id: string; title: string; content: string | null; parsed_content: string | null }) => {
        const contentToAnalyze = ann.parsed_content || ann.content || ''

        // 내용이 너무 짧으면 스킵
        if (contentToAnalyze.length < 200) {
          await supabase
            .from('announcements')
            .update({
              evaluation_parsed: true,
              evaluation_parsed_at: new Date().toISOString()
            })
            .eq('id', ann.id)
          return null
        }

        const result = await extractEvaluationCriteria(ann.title, contentToAnalyze)

        if (result.success && result.criteria) {
          // DB 업데이트
          const { error: updateError } = await supabase
            .from('announcements')
            .update({
              evaluation_criteria: result.criteria,
              evaluation_parsed: true,
              evaluation_parsed_at: new Date().toISOString()
            })
            .eq('id', ann.id)

          if (updateError) {
            throw new Error(`DB 업데이트 실패: ${updateError.message}`)
          }

          return result.criteria
        } else {
          // 평가기준 없음으로 표시
          await supabase
            .from('announcements')
            .update({
              evaluation_parsed: true,
              evaluation_parsed_at: new Date().toISOString()
            })
            .eq('id', ann.id)
          return null
        }
      },
      {
        concurrency: 5,
        delayBetweenBatches: 1000,
        onProgress: (completed, total) => {
        }
      },
      2 // 최대 2회 재시도
    )

    const summary = summarizeBatchResults(results)
    const duration = Date.now() - startTime


    return NextResponse.json({
      success: true,
      message: '평가기준 추출 완료',
      stats: {
        total: summary.total,
        extracted: summary.succeeded,
        failed: summary.failed,
        successRate: `${summary.successRate.toFixed(1)}%`,
        duration: `${duration}ms`,
        parsedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('배치 추출 오류:', error)
    return NextResponse.json(
      { success: false, error: '추출 중 오류가 발생했어요' },
      { status: 500 }
    )
  }
}
