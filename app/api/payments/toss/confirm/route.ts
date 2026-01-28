import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { confirmTossPayment } from '@/lib/payments/toss'
import { isValidABTestAmount } from '@/lib/ab-test'
import { createRequestLogger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const log = createRequestLogger(request, 'payment-confirm')

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      log.warn('인증되지 않은 요청')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { paymentKey, orderId, amount } = body

    log.info('결제 확인 요청', { userId: user.id, orderId, amount })

    if (!paymentKey || !orderId || !amount) {
      log.warn('필수 필드 누락', { paymentKey, orderId, amount })
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify order exists and belongs to user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingPayment, error: paymentQueryError } = await (supabase as any)
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .single()

    if (paymentQueryError || !existingPayment) {
      log.warn('주문 조회 실패', {
        orderId,
        userId: user.id,
        error: paymentQueryError?.message
      })
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify amount matches
    const paymentAmount = (existingPayment as { amount: number }).amount
    if (paymentAmount !== amount) {
      log.error('금액 불일치', {
        orderId,
        expectedAmount: paymentAmount,
        providedAmount: amount
      })
      return NextResponse.json(
        { success: false, error: 'Amount mismatch' },
        { status: 400 }
      )
    }

    // A/B 테스트 가격 검증 (Pro 플랜만)
    // Pro 플랜: 3900 or 5000 허용, Premium: 49000 고정
    if (amount === 3900 || amount === 5000) {
      if (!isValidABTestAmount(amount, 'monthly')) {
        log.error('A/B 테스트 가격 검증 실패', { amount })
        return NextResponse.json(
          { success: false, error: 'Invalid A/B test amount' },
          { status: 400 }
        )
      }
    }

    // Confirm payment with Toss
    log.info('Toss 결제 승인 요청', { paymentKey, orderId, amount })
    const tossResponse = await confirmTossPayment(paymentKey, orderId, amount)
    log.info('Toss 결제 승인 완료', {
      orderId,
      status: tossResponse.status,
      approvedAt: tossResponse.approvedAt
    })

    // Update payment record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('payments')
      .update({
        payment_key: paymentKey,
        status: 'completed',
        metadata: tossResponse,
      })
      .eq('id', (existingPayment as { id: string }).id)

    if (updateError) {
      log.error('결제 레코드 업데이트 실패', {
        orderId,
        error: updateError.message
      })
      return NextResponse.json(
        { success: false, error: 'Failed to update payment record' },
        { status: 500 }
      )
    }

    log.info('결제 확인 완료', {
      orderId,
      paymentKey,
      amount,
      userId: user.id
    })

    return NextResponse.json({
      success: true,
      data: {
        paymentKey,
        orderId,
        amount,
        status: 'completed',
      },
    })
  } catch (error) {
    log.error('결제 확인 실패', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { success: false, error: 'Payment confirmation failed' },
      { status: 500 }
    )
  }
}
