import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

interface NewsletterSubscriber {
  id: string
  email: string
  confirmed: boolean | null
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
      .select('id, email, confirmed')
      .eq('confirm_token', token)
      .single() as { data: NewsletterSubscriber | null; error: Error | null }

    if (error || !subscriber) {
      return NextResponse.redirect(new URL('/newsletter/error?reason=invalid_token', request.url))
    }

    if (subscriber.confirmed) {
      return NextResponse.redirect(new URL('/newsletter/already-confirmed', request.url))
    }

    // 구독 확인 처리
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('newsletter_subscribers')
      .update({
        confirmed: true,
        confirmed_at: new Date().toISOString(),
        confirm_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriber.id)

    if (updateError) {
      console.error('Newsletter confirm error:', updateError)
      return NextResponse.redirect(new URL('/newsletter/error?reason=server_error', request.url))
    }

    return NextResponse.redirect(new URL('/newsletter/confirmed', request.url))
  } catch (error) {
    console.error('Newsletter confirm error:', error)
    return NextResponse.redirect(new URL('/newsletter/error?reason=server_error', request.url))
  }
}
