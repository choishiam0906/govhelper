import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { readyKakaoPay } from '@/lib/payments/kakao'
import { reserveNaverPay } from '@/lib/payments/naver'
import { PAYMENT_PRICES } from '@/lib/payments'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

// 결제 요청 스키마
const paymentRequestSchema = z.object({
  plan: z.enum(['proMonthly', 'proYearly']),
  paymentMethod: z.enum(['toss', 'kakao', 'naver']),
})

// GET: 결제 내역 조회
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

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Payments fetch error:', error)
      return NextResponse.json(
        { success: false, error: '결제 내역 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Payments GET error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// POST: 결제 요청 생성
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
    const validatedData = paymentRequestSchema.parse(body)

    const amount = PAYMENT_PRICES[validatedData.plan]
    const orderId = `ORDER_${Date.now()}_${uuidv4().slice(0, 8)}`
    const orderName = validatedData.plan === 'proMonthly'
      ? 'GovHelper Pro 월간 구독'
      : 'GovHelper Pro 연간 구독'

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // 결제 준비 레코드 생성
    const { data: payment, error: insertError } = await (supabase
      .from('payments') as any)
      .insert({
        user_id: user.id,
        amount,
        payment_method: validatedData.paymentMethod,
        order_id: orderId,
        status: 'pending',
        metadata: {
          plan: validatedData.plan,
          orderName,
        },
      })
      .select()
      .single()

    if (insertError) {
      console.error('Payment insert error:', insertError)
      return NextResponse.json(
        { success: false, error: '결제 생성에 실패했습니다' },
        { status: 500 }
      )
    }

    // 결제 수단별 처리
    let redirectUrl: string | null = null
    let paymentData: any = {}

    switch (validatedData.paymentMethod) {
      case 'toss':
        // 토스는 클라이언트에서 SDK로 처리
        paymentData = {
          clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY,
          orderId,
          amount,
          orderName,
          customerEmail: user.email,
          successUrl: `${baseUrl}/dashboard/billing/success?method=toss`,
          failUrl: `${baseUrl}/dashboard/billing/fail?method=toss`,
        }
        break

      case 'kakao':
        const kakaoResult = await readyKakaoPay(
          orderId,
          user.id,
          orderName,
          1,
          amount,
          `${baseUrl}/api/payments/confirm?method=kakao&orderId=${orderId}`,
          `${baseUrl}/dashboard/billing/fail?method=kakao`,
          `${baseUrl}/dashboard/billing/fail?method=kakao`
        )
        redirectUrl = kakaoResult.next_redirect_pc_url

        // TID 저장
        await (supabase
          .from('payments') as any)
          .update({
            metadata: {
              ...payment.metadata,
              tid: kakaoResult.tid,
            },
          })
          .eq('id', payment.id)

        paymentData = { tid: kakaoResult.tid }
        break

      case 'naver':
        const naverResult = await reserveNaverPay(
          orderId,
          orderName,
          amount,
          `${baseUrl}/api/payments/confirm?method=naver&orderId=${orderId}`
        )
        redirectUrl = `https://dev.pay.naver.com/o/payment?reserveId=${naverResult.body.reserveId}`

        // reserveId 저장
        await (supabase
          .from('payments') as any)
          .update({
            metadata: {
              ...payment.metadata,
              reserveId: naverResult.body.reserveId,
            },
          })
          .eq('id', payment.id)

        paymentData = { reserveId: naverResult.body.reserveId }
        break
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        orderId,
        amount,
        paymentMethod: validatedData.paymentMethod,
        redirectUrl,
        ...paymentData,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '잘못된 요청입니다', details: (error as any).errors },
        { status: 400 }
      )
    }

    console.error('Payment POST error:', error)
    return NextResponse.json(
      { success: false, error: '결제 준비 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
