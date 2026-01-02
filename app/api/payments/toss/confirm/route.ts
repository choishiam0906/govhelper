import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { confirmTossPayment } from '@/lib/payments/toss'

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
    const { data: existingPayment, error: paymentQueryError } = await supabase
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
    if (existingPayment.amount !== amount) {
      return NextResponse.json(
        { success: false, error: 'Amount mismatch' },
        { status: 400 }
      )
    }

    // Confirm payment with Toss
    const tossResponse = await confirmTossPayment(paymentKey, orderId, amount)

    // Update payment record
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        payment_key: paymentKey,
        status: 'completed',
        metadata: tossResponse,
      })
      .eq('id', existingPayment.id)

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
