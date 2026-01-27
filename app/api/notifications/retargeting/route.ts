/**
 * 비회원 재타겟팅 Cron Job
 *
 * 매일 09:00 KST (00:00 UTC) 실행
 * - 7일 전 비회원 매칭 리드 조회
 * - 매칭된 공고 중 마감 임박(15일 이내) 공고 필터링
 * - 재타겟팅 이메일 발송
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resend, FROM_EMAIL } from '@/lib/email/resend'
import { renderRetargetingEmail } from '@/lib/email/templates/retargeting'

// Admin 클라이언트 (RLS 우회)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function POST(request: NextRequest) {
  try {
    // Cron 인증 헤더 확인 (Vercel Cron)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 7일 전 날짜 계산
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // 7일 전 매칭 리드 조회 (재타겟팅 미발송 + 회원 전환 안 함)
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('guest_leads')
      .select('id, email, company_name')
      .gte('created_at', sevenDaysAgo.toISOString())
      .lt('created_at', new Date(sevenDaysAgo.getTime() + 24 * 60 * 60 * 1000).toISOString())
      .is('retargeting_sent_at', null)
      .eq('converted_to_user', false)

    if (leadsError) {
      console.error('[Retargeting] Failed to fetch leads:', leadsError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({ message: 'No leads to retarget', sent: 0 })
    }


    let sentCount = 0
    const errors: string[] = []

    // 각 리드에 대해 재타겟팅 이메일 발송
    for (const lead of leads) {
      try {
        // 해당 리드의 매칭 결과 조회
        const { data: match, error: matchError } = await supabaseAdmin
          .from('guest_matches')
          .select('matches')
          .eq('lead_id', lead.id)
          .single()

        if (matchError || !match) {
          console.warn(`[Retargeting] No match found for lead ${lead.id}`)
          continue
        }

        const matches = match.matches as Array<{
          rank: number
          announcement_id: string
          score: number
        }>

        if (!matches || matches.length === 0) {
          console.warn(`[Retargeting] Empty matches for lead ${lead.id}`)
          continue
        }

        // 매칭된 공고 ID 목록
        const announcementIds = matches.map((m) => m.announcement_id)

        // 공고 정보 조회 (마감 15일 이내, 활성 상태만)
        const { data: announcements, error: announcementsError } = await supabaseAdmin
          .from('announcements')
          .select('id, title, organization, application_end')
          .in('id', announcementIds)
          .eq('status', 'active')
          .gte('application_end', new Date().toISOString())
          .lte('application_end', new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString())

        if (announcementsError) {
          console.error(`[Retargeting] Failed to fetch announcements for lead ${lead.id}:`, announcementsError)
          continue
        }

        if (!announcements || announcements.length === 0) {
          continue
        }

        // 마감 임박 공고 데이터 생성
        const matchedAnnouncements = announcements.map((a) => {
          const endDate = new Date(a.application_end)
          const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

          return {
            title: a.title,
            organization: a.organization,
            daysLeft,
            url: `https://govhelpers.com/dashboard/announcements/${a.id}`,
          }
        })

        // 이메일 HTML 생성
        const emailHtml = renderRetargetingEmail({
          leadName: lead.company_name || '고객',
          matchedAnnouncements,
          upgradeUrl: 'https://govhelpers.com/register?plan=pro',
          unsubscribeUrl: `https://govhelpers.com/api/notifications/retargeting/unsubscribe?email=${encodeURIComponent(lead.email)}`,
        })

        // 이메일 발송 (Resend)
        if (!resend) {
          console.error('[Retargeting] Resend client not available')
          errors.push(`Lead ${lead.id}: Resend not configured`)
          continue
        }

        const { error: sendError } = await resend.emails.send({
          from: FROM_EMAIL,
          to: lead.email,
          subject: '[GovHelper] 마감 임박! 놓치기 전에 확인하세요',
          html: emailHtml,
        })

        if (sendError) {
          console.error(`[Retargeting] Failed to send email to ${lead.email}:`, sendError)
          errors.push(`Lead ${lead.id}: ${sendError.message}`)
          continue
        }

        // retargeting_sent_at 업데이트
        const { error: updateError } = await supabaseAdmin
          .from('guest_leads')
          .update({ retargeting_sent_at: new Date().toISOString() })
          .eq('id', lead.id)

        if (updateError) {
          console.error(`[Retargeting] Failed to update lead ${lead.id}:`, updateError)
        }

        sentCount++
      } catch (error) {
        console.error(`[Retargeting] Error processing lead ${lead.id}:`, error)
        errors.push(`Lead ${lead.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }


    return NextResponse.json({
      message: 'Retargeting emails sent',
      sent: sentCount,
      total: leads.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('[Retargeting] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET 요청은 지원하지 않음
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed. Use POST.' }, { status: 405 })
}
