import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요해요' }, { status: 401 })
    }

    // 관리자 확인
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json({ success: false, error: '관리자만 접근할 수 있어요' }, { status: 403 })
    }

    // 피드백 통계 집계
    const { data: feedbacks } = await (supabase as any)
      .from('match_feedback')
      .select('accuracy_rating, score_direction, actual_outcome, created_at')
      .order('created_at', { ascending: false })
      .limit(200)

    if (!feedbacks || feedbacks.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalFeedbacks: 0,
          averageRating: 0,
          directionDistribution: {},
          outcomeDistribution: {},
        }
      })
    }

    // 통계 계산
    const totalFeedbacks = feedbacks.length
    const averageRating = feedbacks.reduce((s: number, f: any) => s + f.accuracy_rating, 0) / totalFeedbacks

    const directionDistribution: Record<string, number> = {}
    const outcomeDistribution: Record<string, number> = {}

    for (const f of feedbacks) {
      if (f.score_direction) {
        directionDistribution[f.score_direction] = (directionDistribution[f.score_direction] || 0) + 1
      }
      if (f.actual_outcome) {
        outcomeDistribution[f.actual_outcome] = (outcomeDistribution[f.actual_outcome] || 0) + 1
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalFeedbacks,
        averageRating: Math.round(averageRating * 10) / 10,
        directionDistribution,
        outcomeDistribution,
      }
    })
  } catch (error) {
    console.error('피드백 통계 오류:', error)
    return NextResponse.json({ success: false, error: '통계 조회에 실패했어요' }, { status: 500 })
  }
}
