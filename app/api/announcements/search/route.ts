import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/ai/gemini'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요해요' }, { status: 401 })
    }

    const body = await request.json()
    const {
      query,
      matchThreshold = 0.5,
      matchCount = 20,
      filters = {},
    } = body

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: '검색어를 2자 이상 입력해주세요',
      }, { status: 400 })
    }

    // 검색어를 임베딩으로 변환
    const queryEmbedding = await generateEmbedding(query)

    // pgvector 시맨틱 검색 (RPC 함수 호출)
    const { data: semanticResults, error: searchError } = await (supabase.rpc as any)(
      'search_announcements_by_embedding',
      {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        match_threshold: matchThreshold,
        match_count: matchCount,
      }
    )

    if (searchError) {
      console.error('Semantic search error:', searchError)
      // RPC 함수가 없으면 기본 검색으로 폴백
      return fallbackSearch(supabase, query, filters, matchCount)
    }

    // 필터 적용 (소스, 카테고리 등)
    let filteredResults = semanticResults || []

    if (filters.source) {
      filteredResults = filteredResults.filter((r: any) => r.source === filters.source)
    }

    if (filters.category) {
      filteredResults = filteredResults.filter((r: any) => r.category === filters.category)
    }

    // 마감되지 않은 공고만 (이미 RPC에서 status = 'active' 필터링)
    if (filters.excludeExpired) {
      const today = new Date().toISOString().split('T')[0]
      filteredResults = filteredResults.filter((r: any) =>
        !r.application_end || r.application_end >= today
      )
    }

    return NextResponse.json({
      success: true,
      data: filteredResults,
      meta: {
        query,
        totalResults: filteredResults.length,
        searchType: 'semantic',
      },
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { success: false, error: '검색에 실패했어요' },
      { status: 500 }
    )
  }
}

// 시맨틱 검색 실패 시 키워드 검색으로 폴백
async function fallbackSearch(
  supabase: any,
  query: string,
  filters: any,
  limit: number
) {
  let dbQuery = supabase
    .from('announcements')
    .select('id, title, organization, category, support_type, support_amount, application_end, source')
    .eq('status', 'active')
    .or(`title.ilike.%${query}%,organization.ilike.%${query}%,content.ilike.%${query}%`)
    .order('application_end', { ascending: true, nullsFirst: false })
    .limit(limit)

  if (filters.source) {
    dbQuery = dbQuery.eq('source', filters.source)
  }

  if (filters.category) {
    dbQuery = dbQuery.eq('category', filters.category)
  }

  const { data, error } = await dbQuery

  if (error) {
    throw error
  }

  // 폴백 결과에 similarity 추가 (키워드 검색이므로 null)
  const resultsWithSimilarity = (data || []).map((item: any) => ({
    ...item,
    similarity: null,
  }))

  return NextResponse.json({
    success: true,
    data: resultsWithSimilarity,
    meta: {
      query,
      totalResults: resultsWithSimilarity.length,
      searchType: 'keyword', // 폴백 검색
    },
  })
}

// GET: 검색 통계 및 추천 검색어
export async function GET() {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요해요' }, { status: 401 })
    }

    // 인기 카테고리
    const { data: categories } = await supabase
      .from('announcements')
      .select('category')
      .eq('status', 'active')
      .not('category', 'is', null)

    const categoryCounts: Record<string, number> = {}
    categories?.forEach((item: { category: string }) => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
    })

    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    // 추천 검색어 (예시)
    const suggestedQueries = [
      '창업 지원금',
      'R&D 연구개발',
      '스마트공장',
      '수출 바우처',
      '고용 지원',
      '디지털 전환',
      '친환경 사업',
      '소상공인 지원',
    ]

    return NextResponse.json({
      success: true,
      data: {
        topCategories,
        suggestedQueries,
      },
    })
  } catch (error) {
    console.error('Search stats error:', error)
    return NextResponse.json(
      { success: false, error: '통계 조회에 실패했어요' },
      { status: 500 }
    )
  }
}
