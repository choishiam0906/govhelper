import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: 구독 취소
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 현재 구독 정보 조회
    const { data: subscriptionData, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const subscription = subscriptionData as {
      id: string
      plan: string
      status: string
      current_period_end: string | null
      billing_key: string | null
    } | null

    if (fetchError || !subscription) {
      return NextResponse.json(
        { success: false, error: '구독 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (subscription.plan === 'free') {
      return NextResponse.json(
        { success: false, error: '취소할 유료 구독이 없습니다' },
        { status: 400 }
      )
    }

    if (subscription.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: '이미 취소된 구독입니다' },
        { status: 400 }
      )
    }

    // 구독 취소 처리 (즉시 취소가 아닌 기간 종료 후 취소)
    const { error: updateError } = await (supabase
      .from('subscriptions') as any)
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    if (updateError) {
      console.error('Subscription cancel error:', updateError)
      return NextResponse.json(
        { success: false, error: '구독 취소에 실패했습니다' },
        { status: 500 }
      )
    }

    // 자동 결제 취소 처리 (빌링키가 있는 경우)
    if (subscription.billing_key) {
      // TODO: PG사별 자동결제 해지 API 호출
      console.log('TODO: Cancel recurring billing for:', subscription.billing_key)
    }

    return NextResponse.json({
      success: true,
      message: '구독이 취소되었습니다. 현재 구독 기간이 끝나면 무료 플랜으로 전환됩니다.',
      data: {
        cancelledAt: new Date().toISOString(),
        effectiveUntil: subscription.current_period_end,
      },
    })
  } catch (error) {
    console.error('Subscription cancel error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
