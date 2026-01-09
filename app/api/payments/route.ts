import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PAYMENT_PRICES } from '@/lib/payments'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

// 결제 요청 스키마 (무통장 입금)
const paymentRequestSchema = z.object({
  plan: z.enum(['proMonthly', 'proYearly']),
  depositorName: z.string().min(2, '입금자명을 입력해주세요'),
})

// 계좌 정보
export const BANK_ACCOUNT = {
  bankName: '신한은행',
  accountNumber: '110-377-265-992',
  accountHolder: '최기헌',
}

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

// POST: 무통장 입금 결제 요청 생성
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

    // 결제 레코드 생성 (입금 대기 상태)
    const { data: payment, error: insertError } = await (supabase
      .from('payments') as any)
      .insert({
        user_id: user.id,
        amount,
        payment_method: 'bank_transfer',
        order_id: orderId,
        status: 'pending', // 입금 대기
        metadata: {
          plan: validatedData.plan,
          orderName,
          depositorName: validatedData.depositorName,
          bankAccount: BANK_ACCOUNT,
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

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        orderId,
        amount,
        orderName,
        depositorName: validatedData.depositorName,
        bankAccount: BANK_ACCOUNT,
        message: '입금 확인 후 24시간 내에 구독이 활성화됩니다.',
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
      { success: false, error: '결제 요청 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
