import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnnouncementsListCache, setAnnouncementsListCache } from '@/lib/cache'

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
      const response = NextResponse.json(cachedData)
      response.headers.set('X-Cache', 'HIT')
      return response
    }

    // 2. 캐시 미스 - Supabase 조회
    const supabase = await createClient()

    let query = supabase
      .from('announcements')
      .select('*', { count: 'exact' })

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
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const responseData = {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }

    // 3. 캐시 저장 (5분 TTL)
    await setAnnouncementsListCache(cacheParams, responseData)

    const response = NextResponse.json(responseData)
    response.headers.set('X-Cache', 'MISS')
    return response
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
