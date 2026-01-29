import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 검색어 자동완성 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    // 검색어 최소 1자 이상
    if (!query || query.length < 1) {
      return NextResponse.json({
        success: false,
        error: '검색어를 1자 이상 입력해주세요',
      }, { status: 400 })
    }

    // untyped client 생성 (service role)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const suggestions: string[] = []
    const seen = new Set<string>()

    // 1. 최근 검색어에서 prefix 매칭 (최근 7일, 중복 제거, 빈도순)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentSearches } = await supabase
      .from('search_queries')
      .select('query')
      .ilike('query', `${query}%`)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(20)

    if (recentSearches) {
      // 빈도수 집계
      const queryCounts: Record<string, number> = {}
      recentSearches.forEach((item) => {
        const q = item.query.trim()
        if (q.length >= 2) {
          queryCounts[q] = (queryCounts[q] || 0) + 1
        }
      })

      // 빈도순 정렬
      const sortedRecent = Object.entries(queryCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([q]) => q)

      sortedRecent.forEach((q) => {
        if (suggestions.length < 8 && !seen.has(q)) {
          suggestions.push(q)
          seen.add(q)
        }
      })
    }

    // 2. 인기 검색어에서 prefix 매칭 (최근 30일, 빈도순)
    if (suggestions.length < 8) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: popularSearches } = await supabase
        .from('search_queries')
        .select('query')
        .ilike('query', `${query}%`)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .limit(50)

      if (popularSearches) {
        const queryCounts: Record<string, number> = {}
        popularSearches.forEach((item) => {
          const q = item.query.trim()
          if (q.length >= 2) {
            queryCounts[q] = (queryCounts[q] || 0) + 1
          }
        })

        const sortedPopular = Object.entries(queryCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([q]) => q)

        sortedPopular.forEach((q) => {
          if (suggestions.length < 8 && !seen.has(q)) {
            suggestions.push(q)
            seen.add(q)
          }
        })
      }
    }

    // 3. 공고 제목에서 prefix 매칭 (active 공고만, ILIKE)
    if (suggestions.length < 8) {
      const { data: announcements } = await supabase
        .from('announcements')
        .select('title')
        .eq('status', 'active')
        .or(`title.ilike.${query}%,organization.ilike.${query}%`)
        .limit(20)

      if (announcements) {
        announcements.forEach((item) => {
          const title = item.title.trim()
          if (suggestions.length < 8 && !seen.has(title)) {
            suggestions.push(title)
            seen.add(title)
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: suggestions.slice(0, 8),
    })
  } catch (error) {
    console.error('Autocomplete error:', error)
    return NextResponse.json(
      { success: false, error: '자동완성 조회에 실패했어요' },
      { status: 500 }
    )
  }
}
