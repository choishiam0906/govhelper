import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: PG 웹훅 수신
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const method = request.headers.get('x-payment-method') || detectPaymentMethod(body)


    const supabase = await createClient()

    // 토스 웹훅 처리
    if (method === 'toss') {
      const { eventType, data } = body

      if (eventType === 'PAYMENT_STATUS_CHANGED') {
        const { paymentKey, status, orderId } = data

        await (supabase
          .from('payments') as any)
          .update({
            status: mapTossStatus(status),
            metadata: (supabase as any).sql`metadata || ${JSON.stringify({ webhookData: data })}::jsonb`,
          })
          .eq('order_id', orderId)
      }
    }

    // 카카오 웹훅 처리
    if (method === 'kakao') {
      const { partner_order_id, status } = body

      if (partner_order_id) {
        await (supabase
          .from('payments') as any)
          .update({
            status: mapKakaoStatus(status),
            metadata: (supabase as any).sql`metadata || ${JSON.stringify({ webhookData: body })}::jsonb`,
          })
          .eq('order_id', partner_order_id)
      }
    }

    // 네이버 웹훅 처리
    if (method === 'naver') {
      const { merchantPayKey, admissionState } = body.body || body

      if (merchantPayKey) {
        await (supabase
          .from('payments') as any)
          .update({
            status: mapNaverStatus(admissionState),
            metadata: (supabase as any).sql`metadata || ${JSON.stringify({ webhookData: body })}::jsonb`,
          })
          .eq('order_id', merchantPayKey)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { success: false, error: '웹훅 처리 실패' },
      { status: 500 }
    )
  }
}

function detectPaymentMethod(body: any): string {
  if (body.eventType) return 'toss'
  if (body.partner_order_id) return 'kakao'
  if (body.body?.merchantPayKey) return 'naver'
  return 'unknown'
}

function mapTossStatus(status: string): string {
  switch (status) {
    case 'DONE':
      return 'completed'
    case 'CANCELED':
    case 'PARTIAL_CANCELED':
      return 'cancelled'
    case 'ABORTED':
    case 'EXPIRED':
      return 'failed'
    default:
      return 'pending'
  }
}

function mapKakaoStatus(status: string): string {
  switch (status) {
    case 'SUCCESS':
      return 'completed'
    case 'CANCEL':
      return 'cancelled'
    case 'FAIL':
      return 'failed'
    default:
      return 'pending'
  }
}

function mapNaverStatus(status: string): string {
  switch (status) {
    case 'SUCCESS':
      return 'completed'
    case 'CANCEL':
      return 'cancelled'
    case 'FAIL':
      return 'failed'
    default:
      return 'pending'
  }
}
