import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 관리자 이메일 목록
const ADMIN_EMAILS = ['choishiam0906@gmail.com']

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST: 입금 확인 및 구독 활성화
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 관리자 권한 확인
    if (!ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    // 결제 정보 조회
    const { data: paymentData, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single()

    const payment = paymentData as {
      id: string
      user_id: string
      status: string
      metadata: any
    } | null

    if (fetchError || !payment) {
      return NextResponse.json(
        { success: false, error: '결제 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (payment.status === 'completed') {
      return NextResponse.json(
        { success: false, error: '이미 처리된 결제입니다' },
        { status: 400 }
      )
    }

    // 결제 상태 업데이트
    const { error: updatePaymentError } = await (supabase
      .from('payments') as any)
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
        metadata: {
          ...payment.metadata,
          confirmedBy: user.email,
          confirmedAt: new Date().toISOString(),
        },
      })
      .eq('id', id)

    if (updatePaymentError) {
      console.error('Payment update error:', updatePaymentError)
      return NextResponse.json(
        { success: false, error: '결제 상태 업데이트에 실패했습니다' },
        { status: 500 }
      )
    }

    // 구독 기간 계산
    const plan = payment.metadata?.plan
    const isYearly = plan === 'proYearly'
    const periodStart = new Date()
    const periodEnd = new Date()

    if (isYearly) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }

    // 기존 구독 확인
    const { data: existingSubData } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', payment.user_id)
      .single()

    const existingSub = existingSubData as { id: string } | null

    if (existingSub) {
      // 기존 구독 업데이트
      const { error: updateSubError } = await (supabase
        .from('subscriptions') as any)
        .update({
          plan: 'pro',
          status: 'active',
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSub.id)

      if (updateSubError) {
        console.error('Subscription update error:', updateSubError)
        return NextResponse.json(
          { success: false, error: '구독 업데이트에 실패했습니다' },
          { status: 500 }
        )
      }
    } else {
      // 새 구독 생성
      const { error: insertSubError } = await (supabase
        .from('subscriptions') as any)
        .insert({
          user_id: payment.user_id,
          plan: 'pro',
          status: 'active',
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })

      if (insertSubError) {
        console.error('Subscription insert error:', insertSubError)
        return NextResponse.json(
          { success: false, error: '구독 생성에 실패했습니다' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: '입금 확인 완료. 구독이 활성화되었습니다.',
      data: {
        paymentId: id,
        userId: payment.user_id,
        plan: 'pro',
        periodEnd: periodEnd.toISOString(),
      },
    })
  } catch (error) {
    console.error('Admin confirm payment error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
