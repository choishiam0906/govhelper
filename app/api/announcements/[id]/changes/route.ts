import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET: 공고 변경 이력 조회
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: announcementId } = await params
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요해요' },
        { status: 401 }
      )
    }

    // 변경 이력 조회 (최근 50개)
    const { data: changes, error } = await (supabase
      .from('announcement_changes') as any)
      .select('*')
      .eq('announcement_id', announcementId)
      .order('detected_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Fetch changes error:', error)
      return NextResponse.json(
        { success: false, error: '변경 이력을 조회하지 못했어요' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      changes: changes || [],
    })
  } catch (error) {
    console.error('Get announcement changes error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했어요' },
      { status: 500 }
    )
  }
}
