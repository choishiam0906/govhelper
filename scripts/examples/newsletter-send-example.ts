/**
 * 뉴스레터 발송 예시 스크립트
 *
 * 사용법:
 * npx tsx scripts/examples/newsletter-send-example.ts
 *
 * 환경변수 필요:
 * - RESEND_API_KEY
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// 환경변수 로드
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

// ============================================
// 1. 뉴스레터 템플릿 예시
// ============================================

interface NewsletterContent {
  subject: string
  previewText: string
  heroTitle: string
  heroDescription: string
  announcements: Array<{
    title: string
    organization: string
    deadline: string
    amount: string
    link: string
  }>
  tips?: string[]
}

function generateNewsletterHTML(content: NewsletterContent, unsubscribeToken: string): string {
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/unsubscribe?token=${unsubscribeToken}`

  const announcementsHTML = content.announcements.map(a => `
    <tr>
      <td style="padding:16px;border-bottom:1px solid #e5e7eb;">
        <a href="${a.link}" style="color:#2563eb;text-decoration:none;font-weight:600;font-size:16px;">
          ${a.title}
        </a>
        <p style="margin:8px 0 0;color:#6b7280;font-size:14px;">
          ${a.organization} · 마감 ${a.deadline} · ${a.amount}
        </p>
      </td>
    </tr>
  `).join('')

  const tipsHTML = content.tips ? `
    <div style="background-color:#f0fdf4;padding:20px;border-radius:8px;margin-top:24px;">
      <h3 style="color:#166534;margin:0 0 12px;font-size:16px;">💡 이번 주 팁</h3>
      <ul style="margin:0;padding-left:20px;color:#166534;">
        ${content.tips.map(tip => `<li style="margin-bottom:8px;">${tip}</li>`).join('')}
      </ul>
    </div>
  ` : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.subject}</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;">

    <!-- 헤더 -->
    <div style="background-color:#2563eb;padding:32px;border-radius:8px 8px 0 0;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:bold;">GovHelper</h1>
      <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">주간 뉴스레터</p>
    </div>

    <!-- 본문 -->
    <div style="background-color:#ffffff;padding:32px;border-radius:0 0 8px 8px;">

      <!-- 히어로 섹션 -->
      <div style="text-align:center;margin-bottom:32px;">
        <h2 style="color:#1f2937;margin:0 0 12px;font-size:24px;">${content.heroTitle}</h2>
        <p style="color:#6b7280;margin:0;font-size:16px;">${content.heroDescription}</p>
      </div>

      <!-- 추천 공고 -->
      <div style="margin-bottom:24px;">
        <h3 style="color:#1f2937;margin:0 0 16px;font-size:18px;border-bottom:2px solid #2563eb;padding-bottom:8px;">
          📢 이번 주 추천 공고
        </h3>
        <table style="width:100%;border-collapse:collapse;">
          ${announcementsHTML}
        </table>
      </div>

      <!-- 더보기 버튼 -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/announcements"
           style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:500;">
          전체 공고 보기 →
        </a>
      </div>

      ${tipsHTML}

    </div>

    <!-- 푸터 -->
    <div style="text-align:center;padding:24px;color:#9ca3af;font-size:12px;">
      <p style="margin:0 0 8px;">
        이 이메일은 GovHelper 뉴스레터 구독자에게 발송됩니다.
      </p>
      <p style="margin:0;">
        <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">수신거부</a>
        &nbsp;·&nbsp;
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" style="color:#9ca3af;text-decoration:underline;">개인정보처리방침</a>
      </p>
      <p style="margin:16px 0 0;color:#d1d5db;">
        © 2026 GovHelper. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
  `
}

// ============================================
// 2. 뉴스레터 발송 함수
// ============================================

interface SendNewsletterOptions {
  subject: string
  previewText: string
  content: NewsletterContent
  testEmail?: string  // 테스트 발송용 (지정하면 이 이메일로만 발송)
}

async function sendNewsletter(options: SendNewsletterOptions) {
  const { subject, previewText, content, testEmail } = options

  console.log('📧 뉴스레터 발송 시작...\n')

  // 1. 캠페인 생성
  const { data: campaign, error: campaignError } = await supabase
    .from('newsletter_campaigns')
    .insert({
      subject,
      preview_text: previewText,
      content: JSON.stringify(content),
      status: 'sending',
    })
    .select()
    .single()

  if (campaignError) {
    console.error('캠페인 생성 실패:', campaignError)
    return
  }

  console.log(`✅ 캠페인 생성됨: ${campaign.id}`)

  // 2. 구독자 목록 조회
  let query = supabase
    .from('newsletter_subscribers')
    .select('id, email, name, unsubscribe_token')
    .eq('status', 'active')
    .eq('confirmed', true)

  // 테스트 모드면 특정 이메일만
  if (testEmail) {
    query = query.eq('email', testEmail)
  }

  const { data: subscribers, error: subscribersError } = await query

  if (subscribersError) {
    console.error('구독자 조회 실패:', subscribersError)
    return
  }

  console.log(`📋 발송 대상: ${subscribers?.length || 0}명\n`)

  if (!subscribers || subscribers.length === 0) {
    console.log('발송할 구독자가 없습니다.')
    return
  }

  // 3. 이메일 발송
  let successCount = 0
  let failCount = 0

  for (const subscriber of subscribers) {
    try {
      // HTML 생성 (개인별 수신거부 토큰 포함)
      const html = generateNewsletterHTML(content, subscriber.unsubscribe_token)

      // 이메일 발송
      const { error: sendError } = await resend.emails.send({
        from: 'GovHelper <newsletter@govhelpers.com>',
        to: subscriber.email,
        subject: subject,
        html: html,
        headers: {
          'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/unsubscribe?token=${subscriber.unsubscribe_token}>`,
        },
      })

      if (sendError) {
        throw sendError
      }

      // 발송 로그 기록
      await supabase
        .from('newsletter_sends')
        .insert({
          campaign_id: campaign.id,
          subscriber_id: subscriber.id,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })

      // 구독자 통계 업데이트
      await supabase
        .from('newsletter_subscribers')
        .update({
          emails_sent: supabase.rpc('increment', { x: 1 }),
          last_email_at: new Date().toISOString(),
        })
        .eq('id', subscriber.id)

      successCount++
      console.log(`  ✅ ${subscriber.email}`)

      // Rate limit 방지 (1초당 10개)
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      failCount++
      console.log(`  ❌ ${subscriber.email}: ${error}`)

      // 실패 로그 기록
      await supabase
        .from('newsletter_sends')
        .insert({
          campaign_id: campaign.id,
          subscriber_id: subscriber.id,
          status: 'bounced',
          error_message: String(error),
        })
    }
  }

  // 4. 캠페인 완료 처리
  await supabase
    .from('newsletter_campaigns')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      total_recipients: subscribers.length,
      emails_sent: successCount,
      emails_bounced: failCount,
    })
    .eq('id', campaign.id)

  console.log(`\n📊 발송 완료!`)
  console.log(`   성공: ${successCount}건`)
  console.log(`   실패: ${failCount}건`)
}

// ============================================
// 3. 예시 실행
// ============================================

async function main() {
  // 예시 콘텐츠
  const newsletterContent: NewsletterContent = {
    subject: '[GovHelper] 이번 주 맞춤 정부지원사업 공고',
    previewText: '귀사에 딱 맞는 지원사업 5건을 추천해드려요',
    heroTitle: '이번 주 추천 공고 5선',
    heroDescription: '마감이 임박한 정부지원사업을 놓치지 마세요!',
    announcements: [
      {
        title: '2026년 중소기업 R&D 지원사업',
        organization: '중소벤처기업부',
        deadline: 'D-7',
        amount: '최대 5억원',
        link: 'https://govhelpers.com/dashboard/announcements/example-1',
      },
      {
        title: '스타트업 스케일업 펀드',
        organization: '창업진흥원',
        deadline: 'D-14',
        amount: '최대 10억원',
        link: 'https://govhelpers.com/dashboard/announcements/example-2',
      },
      {
        title: 'AI 바우처 지원사업',
        organization: '정보통신산업진흥원',
        deadline: 'D-21',
        amount: '최대 3억원',
        link: 'https://govhelpers.com/dashboard/announcements/example-3',
      },
      {
        title: '수출 초보기업 지원',
        organization: 'KOTRA',
        deadline: 'D-30',
        amount: '최대 2천만원',
        link: 'https://govhelpers.com/dashboard/announcements/example-4',
      },
      {
        title: '그린 스타트업 육성 프로그램',
        organization: '환경부',
        deadline: 'D-45',
        amount: '최대 1억원',
        link: 'https://govhelpers.com/dashboard/announcements/example-5',
      },
    ],
    tips: [
      '지원서 작성 시 정량적 수치를 포함하면 선정 확률이 높아져요',
      '동일 사업의 재지원 시 이전 피드백을 반영해 보완하세요',
      'AI 매칭 점수 80점 이상인 공고에 집중하면 효율적이에요',
    ],
  }

  // 테스트 발송 (특정 이메일로만)
  // await sendNewsletter({
  //   subject: newsletterContent.subject,
  //   previewText: newsletterContent.previewText,
  //   content: newsletterContent,
  //   testEmail: 'test@example.com',  // 테스트할 이메일 주소
  // })

  // 전체 발송
  await sendNewsletter({
    subject: newsletterContent.subject,
    previewText: newsletterContent.previewText,
    content: newsletterContent,
  })
}

// 실행
main().catch(console.error)
