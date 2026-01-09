import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
          features: {
            matchingLimit: 3,
            applicationEnabled: false,
            priority: false,
          },
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

    // 플랜별 기능 정보
    const features = getFeaturesByPlan(subscription.plan)

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

function getFeaturesByPlan(plan: string) {
  switch (plan) {
    case 'pro':
      return {
        matchingLimit: -1, // unlimited
        applicationEnabled: true,
        priority: true,
      }
    case 'enterprise':
      return {
        matchingLimit: -1,
        applicationEnabled: true,
        priority: true,
        teamMembers: true,
        apiAccess: true,
      }
    default: // free
      return {
        matchingLimit: 3,
        applicationEnabled: false,
        priority: false,
      }
  }
}
