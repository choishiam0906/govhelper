import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnnouncementsListCache, setAnnouncementsListCache } from '@/lib/cache'
import { apiSuccess, apiError } from '@/lib/api/error-handler'

// 정적 데이터 5분 캐싱 (Next.js 라우트 레벨 캐싱)
export const revalidate = 300

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const source = searchParams.get('source') || ''
    const status = searchParams.get('status') || 'active'
    const sort = searchParams.get('sort') || 'created_at' // 정렬 옵션: created_at, quality_score
    const minQualityScore = searchParams.get('minQualityScore') ? parseInt(searchParams.get('minQualityScore')!) : undefined

    // 캐시 파라미터
    const cacheParams = { page, limit, search, category, source, status, sort, minQualityScore }

    // 1. 캐시 조회
    const cachedData = await getAnnouncementsListCache(cacheParams)
    if (cachedData) {
      const response = NextResponse.json(cachedData, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      })
      return response
    }

    // 2. 캐시 미스 - Supabase 조회
    const supabase = await createClient()

    let query = supabase
      .from('announcements')
      .select(`
        id,
        title,
        organization,
        category,
        support_type,
        support_amount,
        application_start,
        application_end,
        status,
        source,
        quality_score,
        created_at
      `, { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,organization.ilike.%${search}%`)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (source) {
      query = query.eq('source', source)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // 최소 품질 점수 필터
    if (minQualityScore !== undefined) {
      query = query.gte('quality_score', minQualityScore)
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    // 정렬 옵션 적용
    if (sort === 'quality_score') {
      // 품질순: quality_score 내림차순, NULL은 최하위
      query = query.order('quality_score', { ascending: false, nullsFirst: false })
    } else {
      // 기본: 생성일 내림차순
      query = query.order('created_at', { ascending: false })
    }

    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      return apiError(error.message || '공고 조회에 실패했어요', 'DATABASE_ERROR', 500)
    }

    const resultData = {
      announcements: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }

    // 3. 캐시 저장 (5분 TTL)
    await setAnnouncementsListCache(cacheParams, resultData)

    const response = apiSuccess(resultData)
    response.headers.set('X-Cache', 'MISS')
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return response
  } catch (error) {
    return apiError('공고 목록 조회 중 오류가 발생했어요', 'INTERNAL_SERVER_ERROR', 500)
  }
}
