import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 기본 위젯 설정
export const DEFAULT_WIDGETS = [
  { id: 'stats', name: '통계 카드', visible: true, order: 0 },
  { id: 'quickActions', name: '빠른 메뉴', visible: true, order: 1 },
  { id: 'recommendations', name: '맞춤 추천 공고', visible: true, order: 2 },
  { id: 'urgentDeadlines', name: '마감 임박 공고', visible: true, order: 3 },
  { id: 'inProgressApps', name: '작성 중인 지원서', visible: true, order: 4 },
  { id: 'recentAnnouncements', name: '최신 공고', visible: true, order: 5 },
]

export interface WidgetSetting {
  id: string
  name: string
  visible: boolean
  order: number
}

/**
 * GET: 위젯 설정 조회
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요해요' },
        { status: 401 }
      )
    }

    // 사용자 위젯 설정 조회
    const { data: settings, error } = await (supabase
      .from('dashboard_widget_settings') as any)
      .select('widgets')
      .eq('user_id', user.user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116: 데이터 없음
      console.error('Fetch widget settings error:', error)
      return NextResponse.json(
        { success: false, error: '위젯 설정을 불러오지 못했어요' },
        { status: 500 }
      )
    }

    // 설정이 없으면 기본값 반환
    const widgets = settings?.widgets || DEFAULT_WIDGETS

    return NextResponse.json({
      success: true,
      widgets,
    })
  } catch (error) {
    console.error('Get widget settings error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했어요' },
      { status: 500 }
    )
  }
}

/**
 * PUT: 위젯 설정 저장
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요해요' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { widgets } = body

    if (!widgets || !Array.isArray(widgets)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 위젯 설정이에요' },
        { status: 400 }
      )
    }

    // 위젯 설정 유효성 검사
    const validWidgetIds = DEFAULT_WIDGETS.map(w => w.id)
    for (const widget of widgets) {
      if (!validWidgetIds.includes(widget.id)) {
        return NextResponse.json(
          { success: false, error: `유효하지 않은 위젯 ID: ${widget.id}` },
          { status: 400 }
        )
      }
    }

    // Upsert 위젯 설정
    const { error } = await (supabase
      .from('dashboard_widget_settings') as any)
      .upsert(
        {
          user_id: user.user.id,
          widgets,
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      console.error('Save widget settings error:', error)
      return NextResponse.json(
        { success: false, error: '위젯 설정을 저장하지 못했어요' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '위젯 설정을 저장했어요',
    })
  } catch (error) {
    console.error('Save widget settings error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했어요' },
      { status: 500 }
    )
  }
}
