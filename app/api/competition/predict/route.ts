import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { predictCompetition } from '@/lib/competition/predict'
import type { CompetitionPredictionResponse } from '@/types/competition'

/**
 * 경쟁률 예측 API
 * GET /api/competition/predict?announcementId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const announcementId = searchParams.get('announcementId')

    if (!announcementId) {
      return NextResponse.json<CompetitionPredictionResponse>(
        { success: false, error: '공고 ID가 필요해요' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 인증 확인 (선택적 - 비로그인도 허용)
    const { data: { user } } = await supabase.auth.getUser()

    // 경쟁률 예측
    const prediction = await predictCompetition(supabase, announcementId)

    return NextResponse.json<CompetitionPredictionResponse>({
      success: true,
      data: prediction,
    })
  } catch (error) {
    console.error('경쟁률 예측 오류:', error)
    return NextResponse.json<CompetitionPredictionResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : '경쟁률 예측에 실패했어요',
      },
      { status: 500 }
    )
  }
}
