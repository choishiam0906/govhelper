import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL } from '@/lib/email/resend'
import { renderRetargetingEmail } from '@/lib/email/templates/retargeting'

// 매일 오전 10시 KST (1 UTC) 실행
export async function GET(request: NextRequest) {
  try {
    if (!resend) {
      return NextResponse.json({ success: false, error: 'RESEND_API_KEY 미설정' }, { status: 500 })
    }

    // Cron 인증
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }
    }

    const supabase = await createServiceClient()

    // 7일 전 생성된 비회원 리드 조회 (아직 회원 전환 안 된 + 이메일 미발송)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStart = new Date(sevenDaysAgo)
    sevenDaysAgoStart.setHours(0, 0, 0, 0)
    const sevenDaysAgoEnd = new Date(sevenDaysAgo)
    sevenDaysAgoEnd.setHours(23, 59, 59, 999)

    const { data: leadsRaw, error: leadsError } = await supabase
      .from('guest_leads')
      .select(`
        id,
        email,
        company_name,
        guest_matches (
          id,
          matches,
          email_sent
        )
      `)
      .eq('converted_to_user', false)
      .gte('created_at', sevenDaysAgoStart.toISOString())
      .lte('created_at', sevenDaysAgoEnd.toISOString())

    const leads = leadsRaw as any[] | null

    if (leadsError) {
      throw leadsError
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({ success: true, message: '발송 대상 없음', sent: 0 })
    }

    // 마감 임박 공고 조회 (14일 이내 마감)
    const today = new Date()
    const in14Days = new Date(today)
    in14Days.setDate(in14Days.getDate() + 14)

    const { data: urgentAnnouncementsRaw } = await supabase
      .from('announcements')
      .select('id, title, organization, application_end')
      .eq('status', 'active')
      .gte('application_end', today.toISOString())
      .lte('application_end', in14Days.toISOString())
      .order('application_end', { ascending: true })
      .limit(50)

    const urgentAnnouncements = urgentAnnouncementsRaw as any[] | null

    let sentCount = 0
    let errorCount = 0

    for (const lead of leads) {
      // 이미 이메일 발송된 매칭 결과 건너뛰기
      const match = (lead.guest_matches as any)?.[0]
      if (!match || match.email_sent) continue

      // 매칭 결과에서 공고 ID 추출
      const matchedIds = (match.matches as any[])?.map((m: any) => m.announcement_id) || []

      // 매칭된 공고 중 마감 임박인 것 필터
      const matchedUrgent = (urgentAnnouncements || [])
        .filter(a => matchedIds.includes(a.id))
        .map(a => {
          const endDate = new Date(a.application_end!)
          const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          return {
            title: a.title || '제목 없음',
            organization: a.organization || '기관 미상',
            daysLeft,
            url: `https://govhelpers.com/try/result/${match.id}`,
          }
        })

      // 매칭된 마감 임박 공고가 없으면 전체 마감 임박 공고에서 상위 3개
      const announcementsToShow = matchedUrgent.length > 0
        ? matchedUrgent.slice(0, 5)
        : (urgentAnnouncements || []).slice(0, 3).map(a => {
            const endDate = new Date(a.application_end!)
            const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            return {
              title: a.title || '제목 없음',
              organization: a.organization || '기관 미상',
              daysLeft,
              url: `https://govhelpers.com/try`,
            }
          })

      if (announcementsToShow.length === 0) continue

      try {
        const html = renderRetargetingEmail({
          leadName: lead.company_name || '기업 담당자',
          matchedAnnouncements: announcementsToShow,
          upgradeUrl: 'https://govhelpers.com/register',
          unsubscribeUrl: `https://govhelpers.com/api/retargeting/unsubscribe?email=${encodeURIComponent(lead.email)}`,
        })

        await resend.emails.send({
          from: FROM_EMAIL,
          to: lead.email,
          subject: `[GovHelper] ${lead.company_name || '기업'}님, 매칭된 공고가 곧 마감돼요!`,
          html,
        })

        // 이메일 발송 상태 업데이트
        await (supabase
          .from('guest_matches') as any)
          .update({ email_sent: true, email_sent_at: new Date().toISOString() })
          .eq('id', match.id)

        sentCount++
      } catch (emailError) {
        console.error('이메일 발송 오류:', emailError)
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      errors: errorCount,
      total: leads.length,
    })
  } catch (error) {
    console.error('재타겟팅 이메일 발송 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }, { status: 500 })
  }
}
