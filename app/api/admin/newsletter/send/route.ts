import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { z } from 'zod'

const sendSchema = z.object({
  subject: z.string().min(1, '제목을 입력해주세요'),
  previewText: z.string().optional(),
  htmlContent: z.string().min(1, '내용을 입력해주세요'),
  testEmail: z.string().email().optional(), // 테스트 발송용
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient()

    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, message: '로그인이 필요해요' }, { status: 401 })
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json({ success: false, message: '관리자 권한이 필요해요' }, { status: 403 })
    }

    const body = await request.json()
    const { subject, previewText, htmlContent, testEmail } = sendSchema.parse(body)

    // 구독자 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('newsletter_subscribers')
      .select('id, email, name, unsubscribe_token')
      .eq('status', 'active')
      .eq('confirmed', true)

    if (testEmail) {
      query = query.eq('email', testEmail)
    }

    const { data: subscribers, error: subscribersError } = await query

    if (subscribersError) {
      console.error('구독자 조회 실패:', subscribersError)
      return NextResponse.json({ success: false, message: '구독자 조회에 실패했어요' }, { status: 500 })
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({
        success: false,
        message: testEmail ? '해당 이메일이 구독자 목록에 없어요' : '발송할 구독자가 없어요',
      }, { status: 400 })
    }

    // 캠페인 생성
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campaign, error: campaignError } = await (supabase as any)
      .from('newsletter_campaigns')
      .insert({
        subject,
        preview_text: previewText,
        content: htmlContent,
        status: 'sending',
        created_by: user.id,
      })
      .select()
      .single()

    if (campaignError) {
      console.error('캠페인 생성 실패:', campaignError)
      return NextResponse.json({ success: false, message: '캠페인 생성에 실패했어요' }, { status: 500 })
    }

    // 이메일 발송
    const resend = new Resend(process.env.RESEND_API_KEY)
    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    for (const subscriber of subscribers) {
      try {
        // HTML에 수신거부 링크 추가
        const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/unsubscribe?token=${subscriber.unsubscribe_token}`
        const finalHtml = htmlContent.replace(
          '{{unsubscribe_url}}',
          unsubscribeUrl
        ).replace(
          '{{email}}',
          subscriber.email
        ).replace(
          '{{name}}',
          subscriber.name || '고객'
        )

        await resend.emails.send({
          from: 'GovHelper <newsletter@govhelpers.com>',
          to: subscriber.email,
          subject: subject,
          html: finalHtml,
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
          },
        })

        // 발송 로그
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('newsletter_sends')
          .insert({
            campaign_id: campaign.id,
            subscriber_id: subscriber.id,
            status: 'sent',
            sent_at: new Date().toISOString(),
          })

        successCount++

        // Rate limit (100ms 간격)
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        failCount++
        errors.push(`${subscriber.email}: ${error}`)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('newsletter_sends')
          .insert({
            campaign_id: campaign.id,
            subscriber_id: subscriber.id,
            status: 'bounced',
            error_message: String(error),
          })
      }
    }

    // 캠페인 완료 처리
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('newsletter_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        total_recipients: subscribers.length,
        emails_sent: successCount,
        emails_bounced: failCount,
      })
      .eq('id', campaign.id)

    return NextResponse.json({
      success: true,
      message: `${successCount}건 발송 완료${failCount > 0 ? `, ${failCount}건 실패` : ''}`,
      data: {
        campaignId: campaign.id,
        totalRecipients: subscribers.length,
        successCount,
        failCount,
        errors: errors.slice(0, 5), // 최대 5개만 반환
      },
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Newsletter send error:', error)
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했어요' },
      { status: 500 }
    )
  }
}
