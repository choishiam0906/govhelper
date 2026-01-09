import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { confirmTossPayment } from '@/lib/payments/toss'
import { approveKakaoPay } from '@/lib/payments/kakao'
import { approveNaverPay } from '@/lib/payments/naver'

// POST: 결제 승인
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

    const body = await request.json()
    const { paymentKey, orderId, amount, method } = body

    // 결제 정보 조회
    const { data: paymentData, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .single()

    const payment = paymentData as {
      id: string
      status: string
      amount: number
      metadata: any
    } | null

    if (fetchError || !payment) {
      return NextResponse.json(
        { success: false, error: '결제 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (payment.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: '이미 처리된 결제입니다' },
        { status: 400 }
      )
    }

    // 금액 검증
    if (payment.amount !== amount) {
      return NextResponse.json(
        { success: false, error: '결제 금액이 일치하지 않습니다' },
        { status: 400 }
      )
    }

    // 결제 승인 처리
    let approveResult: any

    switch (method) {
      case 'toss':
        approveResult = await confirmTossPayment(paymentKey, orderId, amount)
        break

      case 'kakao':
        // 카카오는 GET 방식으로 호출될 수 있음 (pg_token 전달)
        const pgToken = body.pg_token
        if (!pgToken) {
          return NextResponse.json(
            { success: false, error: 'pg_token이 필요합니다' },
            { status: 400 }
          )
        }
        approveResult = await approveKakaoPay(
          payment.metadata?.tid,
          orderId,
          user.id,
          pgToken
        )
        break

      case 'naver':
        const paymentId = body.paymentId
        if (!paymentId) {
          return NextResponse.json(
            { success: false, error: 'paymentId가 필요합니다' },
            { status: 400 }
          )
        }
        approveResult = await approveNaverPay(paymentId)
        break

      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 결제 수단입니다' },
          { status: 400 }
        )
    }

    // 결제 상태 업데이트
    await (supabase
      .from('payments') as any)
      .update({
        payment_key: paymentKey || approveResult.paymentKey || approveResult.tid,
        status: 'completed',
        metadata: {
          ...payment.metadata,
          approveResult,
        },
      })
      .eq('id', payment.id)

    // 구독 생성/업데이트
    const plan = payment.metadata?.plan
    const isYearly = plan === 'proYearly'
    const periodEnd = new Date()
    if (isYearly) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }

    const { data: existingSubData } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const existingSub = existingSubData as { id: string } | null

    if (existingSub) {
      await (supabase
        .from('subscriptions') as any)
        .update({
          plan: 'pro',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSub.id)
    } else {
      await (supabase
        .from('subscriptions') as any)
        .insert({
          user_id: user.id,
          plan: 'pro',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
    }

    return NextResponse.json({
      success: true,
      message: '결제가 완료되었습니다',
      data: {
        paymentId: payment.id,
        plan: 'pro',
        periodEnd: periodEnd.toISOString(),
      },
    })
  } catch (error) {
    console.error('Payment confirm error:', error)
    return NextResponse.json(
      { success: false, error: '결제 승인 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// GET: 카카오/네이버 결제 콜백 처리
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const method = searchParams.get('method')
  const orderId = searchParams.get('orderId')
  const pgToken = searchParams.get('pg_token') // 카카오
  const paymentId = searchParams.get('paymentId') // 네이버

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(`${baseUrl}/dashboard/billing/fail?error=auth`)
    }

    if (!orderId) {
      return NextResponse.redirect(`${baseUrl}/dashboard/billing/fail?error=missing_order`)
    }

    // 결제 정보 조회
    const { data: paymentData2, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .single()

    const payment2 = paymentData2 as {
      id: string
      status: string
      amount: number
      metadata: any
    } | null

    if (fetchError || !payment2) {
      return NextResponse.redirect(`${baseUrl}/dashboard/billing/fail?error=not_found`)
    }

    let approveResult: any

    if (method === 'kakao' && pgToken) {
      approveResult = await approveKakaoPay(
        payment2.metadata?.tid,
        orderId,
        user.id,
        pgToken
      )
    } else if (method === 'naver' && paymentId) {
      approveResult = await approveNaverPay(paymentId)
    } else {
      return NextResponse.redirect(`${baseUrl}/dashboard/billing/fail?error=invalid_params`)
    }

    // 결제 상태 업데이트
    await (supabase
      .from('payments') as any)
      .update({
        payment_key: approveResult.tid || approveResult.body?.paymentId,
        status: 'completed',
        metadata: {
          ...payment2.metadata,
          approveResult,
        },
      })
      .eq('id', payment2.id)

    // 구독 생성/업데이트
    const plan2 = payment2.metadata?.plan
    const isYearly2 = plan2 === 'proYearly'
    const periodEnd2 = new Date()
    if (isYearly2) {
      periodEnd2.setFullYear(periodEnd2.getFullYear() + 1)
    } else {
      periodEnd2.setMonth(periodEnd2.getMonth() + 1)
    }

    const { data: existingSubData2 } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const existingSub2 = existingSubData2 as { id: string } | null

    if (existingSub2) {
      await (supabase
        .from('subscriptions') as any)
        .update({
          plan: 'pro',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd2.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSub2.id)
    } else {
      await (supabase
        .from('subscriptions') as any)
        .insert({
          user_id: user.id,
          plan: 'pro',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd2.toISOString(),
        })
    }

    return NextResponse.redirect(`${baseUrl}/dashboard/billing/success`)
  } catch (error) {
    console.error('Payment callback error:', error)
    return NextResponse.redirect(`${baseUrl}/dashboard/billing/fail?error=server`)
  }
}
