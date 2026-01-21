import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLAN_INFO, PlanType } from '@/lib/queries/dashboard'

// GET: 구독 정보 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 구독 정보 조회
    const { data: subscriptionData, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Subscription fetch error:', error)
      return NextResponse.json(
        { success: false, error: '구독 정보 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    const subscription = subscriptionData as {
      id: string
      plan: string
      status: string
      current_period_start: string | null
      current_period_end: string | null
    } | null

    // 구독이 없으면 무료 플랜 기본값 반환
    if (!subscription) {
      return NextResponse.json({
        success: true,
        data: {
          plan: 'free',
          status: 'active',
          current_period_start: null,
          current_period_end: null,
          features: getFeaturesByPlan('free'),
        },
      })
    }

    // 구독 만료 체크
    const isExpired = subscription.current_period_end
      ? new Date(subscription.current_period_end) < new Date()
      : false

    if (isExpired && subscription.status === 'active') {
      // 만료된 구독 상태 업데이트
      await (supabase
        .from('subscriptions') as any)
        .update({
          plan: 'free',
          status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id)

      subscription.plan = 'free'
      subscription.status = 'expired'
    }

    const features = getFeaturesByPlan(subscription.plan as PlanType)

    return NextResponse.json({
      success: true,
      data: {
        ...subscription,
        features,
        daysRemaining: subscription.current_period_end
          ? Math.max(0, Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : null,
      },
    })
  } catch (error) {
    console.error('Subscription GET error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

function getFeaturesByPlan(plan: PlanType) {
  const planInfo = PLAN_INFO[plan]
  return {
    matchingFull: planInfo.features.matchingFull,
    applicationEnabled: planInfo.features.application,
    priority: plan === 'premium',
  }
}
