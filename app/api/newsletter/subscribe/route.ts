import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { z } from 'zod'

const subscribeSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력해 주세요'),
  name: z.string().optional(),
  source: z.enum(['landing', 'footer', 'popup', 'try_page']).optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
})

interface ExistingSubscriber {
  id: string
  status: string | null
  confirmed: boolean | null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = subscribeSchema.parse(body)

    const supabase = await createServiceClient()

    // 기존 구독자 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('newsletter_subscribers')
      .select('id, status, confirmed')
      .eq('email', data.email)
      .single() as { data: ExistingSubscriber | null }

    if (existing) {
      if (existing.status === 'active' && existing.confirmed) {
        return NextResponse.json(
          { success: false, message: '이미 구독 중인 이메일이에요' },
          { status: 400 }
        )
      }

      // 재구독 처리
      if (existing.status === 'unsubscribed') {
        const confirmToken = crypto.randomUUID().replace(/-/g, '')

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('newsletter_subscribers')
          .update({
            status: 'active',
            confirmed: false,
            confirm_token: confirmToken,
            confirm_sent_at: new Date().toISOString(),
            unsubscribed_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        // 인증 이메일 발송
        await sendConfirmationEmail(data.email, confirmToken, data.name)

        return NextResponse.json({
          success: true,
          message: '재구독 인증 이메일을 발송했어요',
          requiresConfirmation: true,
        })
      }
    }

    // 신규 구독자 등록
    const confirmToken = crypto.randomUUID().replace(/-/g, '')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from('newsletter_subscribers')
      .insert({
        email: data.email,
        name: data.name,
        source: data.source || 'landing',
        utm_source: data.utm_source,
        utm_medium: data.utm_medium,
        utm_campaign: data.utm_campaign,
        confirm_token: confirmToken,
        confirm_sent_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Newsletter subscribe error:', insertError)
      return NextResponse.json(
        { success: false, message: '구독 등록에 실패했어요' },
        { status: 500 }
      )
    }

    // 인증 이메일 발송
    await sendConfirmationEmail(data.email, confirmToken, data.name)

    return NextResponse.json({
      success: true,
      message: '구독 인증 이메일을 발송했어요',
      requiresConfirmation: true,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Newsletter subscribe error:', error)
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했어요' },
      { status: 500 }
    )
  }
}

async function sendConfirmationEmail(email: string, token: string, name?: string) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/confirm?token=${token}`

  await resend.emails.send({
    from: 'GovHelper <noreply@govhelpers.com>',
    to: email,
    subject: '[GovHelper] 뉴스레터 구독을 확인해 주세요',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
    <div style="background-color:#2563eb;padding:24px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:bold;">GovHelper</h1>
      <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">뉴스레터 구독 확인</p>
    </div>
    <div style="padding:24px;">
      <p style="font-size:16px;color:#374151;margin:0 0 16px;">
        안녕하세요${name ? `, ${name}님` : ''}!
      </p>
      <p style="font-size:14px;color:#6b7280;margin:0 0 24px;">
        GovHelper 뉴스레터 구독을 신청해 주셨어요.<br>
        아래 버튼을 클릭하여 구독을 확인해 주세요.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${confirmUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:500;">
          구독 확인하기
        </a>
      </div>
      <p style="font-size:13px;color:#9ca3af;margin:24px 0 0;text-align:center;">
        버튼이 작동하지 않으면 아래 링크를 복사해서 브라우저에 붙여넣어 주세요:<br>
        <a href="${confirmUrl}" style="color:#2563eb;word-break:break-all;">${confirmUrl}</a>
      </p>
    </div>
    <div style="background-color:#f9fafb;padding:16px 24px;border-top:1px solid #e5e7eb;">
      <p style="font-size:12px;color:#9ca3af;margin:0;text-align:center;">
        본인이 신청하지 않으셨다면 이 이메일을 무시해 주세요.
      </p>
    </div>
  </div>
</body>
</html>
    `,
  })
}
