import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { confirmTossPayment } from '@/lib/payments/toss'
import { isValidABTestAmount } from '@/lib/ab-test'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { paymentKey, orderId, amount } = body

    if (!paymentKey || !orderId || !amount) {
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
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify amount matches
    const paymentAmount = (existingPayment as { amount: number }).amount
    if (paymentAmount !== amount) {
      return NextResponse.json(
        { success: false, error: 'Amount mismatch' },
        { status: 400 }
      )
    }

    // A/B 테스트 가격 검증 (Pro 플랜만)
    // Pro 플랜: 3900 or 5000 허용, Premium: 49000 고정
    if (amount === 3900 || amount === 5000) {
      if (!isValidABTestAmount(amount, 'monthly')) {
        return NextResponse.json(
          { success: false, error: 'Invalid A/B test amount' },
          { status: 400 }
        )
      }
    }

    // Confirm payment with Toss
    const tossResponse = await confirmTossPayment(paymentKey, orderId, amount)

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
      console.error('Payment update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update payment record' },
        { status: 500 }
      )
    }

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
    console.error('Toss payment confirm error:', error)
    return NextResponse.json(
      { success: false, error: 'Payment confirmation failed' },
      { status: 500 }
    )
  }
}
