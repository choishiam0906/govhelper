import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

interface NewsletterSubscriber {
  id: string
  email?: string
  status: string | null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/newsletter/error?reason=invalid_token', request.url))
    }

    const supabase = await createServiceClient()

    // 토큰으로 구독자 찾기
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscriber, error } = await (supabase as any)
      .from('newsletter_subscribers')
      .select('id, email, status')
      .eq('unsubscribe_token', token)
      .single() as { data: NewsletterSubscriber | null; error: Error | null }

    if (error || !subscriber) {
      return NextResponse.redirect(new URL('/newsletter/error?reason=invalid_token', request.url))
    }

    if (subscriber.status === 'unsubscribed') {
      return NextResponse.redirect(new URL('/newsletter/already-unsubscribed', request.url))
    }

    // 수신 거부 처리
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('newsletter_subscribers')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriber.id)

    if (updateError) {
      console.error('Newsletter unsubscribe error:', updateError)
      return NextResponse.redirect(new URL('/newsletter/error?reason=server_error', request.url))
    }

    return NextResponse.redirect(new URL('/newsletter/unsubscribed', request.url))
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error)
    return NextResponse.redirect(new URL('/newsletter/error?reason=server_error', request.url))
  }
}

const unsubscribeSchema = z.object({
  token: z.string(),
  reason: z.string().optional(),
})

interface SubscriberStatus {
  id: string
  status: string | null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, reason } = unsubscribeSchema.parse(body)

    const supabase = await createServiceClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscriber, error } = await (supabase as any)
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('unsubscribe_token', token)
      .single() as { data: SubscriberStatus | null; error: Error | null }

    if (error || !subscriber) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 토큰이에요' },
        { status: 400 }
      )
    }

    if (subscriber.status === 'unsubscribed') {
      return NextResponse.json(
        { success: false, message: '이미 수신 거부된 이메일이에요' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('newsletter_subscribers')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
        unsubscribe_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriber.id)

    if (updateError) {
      return NextResponse.json(
        { success: false, message: '수신 거부 처리에 실패했어요' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '수신 거부 처리가 완료됐어요',
    })
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error)
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했어요' },
      { status: 500 }
    )
  }
}
