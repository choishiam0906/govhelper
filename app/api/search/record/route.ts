import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

// 검색어 기록 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, source = 'filter' } = body

    // 검색어 최소 2자 이상
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: '검색어를 2자 이상 입력해주세요',
      }, { status: 400 })
    }

    // 유효한 source 값 체크
    if (!['filter', 'semantic'].includes(source)) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 source 값입니다',
      }, { status: 400 })
    }

    // auth용 client (typed)
    const authClient = await createServerClient()
    const { data: { user } } = await authClient.auth.getUser()

    // insert용 client (untyped, service role)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // search_queries 테이블에 기록 (service role 사용)
    const { error } = await supabase
      .from('search_queries')
      .insert({
        query: query.trim(),
        user_id: user?.id || null,
        source,
      })

    if (error) {
      console.error('Search record error:', error)
      return NextResponse.json(
        { success: false, error: '검색어 기록에 실패했어요' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '검색어를 기록했어요',
    })
  } catch (error) {
    console.error('Search record error:', error)
    return NextResponse.json(
      { success: false, error: '검색어 기록에 실패했어요' },
      { status: 500 }
    )
  }
}
