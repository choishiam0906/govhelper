import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 피드백 제출
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요해요' }, { status: 401 })
    }

    const body = await request.json()
    const { accuracyRating, scoreDirection, actualOutcome, comment } = body

    if (!accuracyRating || accuracyRating < 1 || accuracyRating > 5) {
      return NextResponse.json({ success: false, error: '정확도 평가를 1-5점으로 입력해주세요' }, { status: 400 })
    }

    // match가 해당 사용자의 것인지 확인
    const { data: match } = await supabase
      .from('matches')
      .select('id, company_id, companies!inner(user_id)')
      .eq('id', matchId)
      .single()

    if (!match || (match as any).companies?.user_id !== user.id) {
      return NextResponse.json({ success: false, error: '접근 권한이 없어요' }, { status: 403 })
    }

    // upsert 피드백
    const { error } = await (supabase as any)
      .from('match_feedback')
      .upsert({
        match_id: matchId,
        user_id: user.id,
        accuracy_rating: accuracyRating,
        score_direction: scoreDirection || null,
        actual_outcome: actualOutcome || null,
        comment: comment || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'match_id,user_id' })

    if (error) {
      console.error('피드백 저장 실패:', error)
      return NextResponse.json({ success: false, error: '피드백 저장에 실패했어요' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: '피드백을 저장했어요' })
  } catch (error) {
    console.error('피드백 API 오류:', error)
    return NextResponse.json({ success: false, error: '피드백 처리 중 오류가 발생했어요' }, { status: 500 })
  }
}

// 피드백 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요해요' }, { status: 401 })
    }

    const { data } = await (supabase as any)
      .from('match_feedback')
      .select('*')
      .eq('match_id', matchId)
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ success: true, data: data || null })
  } catch {
    return NextResponse.json({ success: true, data: null })
  }
}
