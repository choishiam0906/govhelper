import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL } from '@/lib/email/resend'
import { renderSmartRecommendationEmail } from '@/lib/email/templates'
import { filterAndScoreAnnouncements } from '@/lib/recommendations/filter'
import type { CompanyInfo, AnnouncementForRecommendation } from '@/lib/recommendations/types'

/**
 * 스마트 추천 알림 발송 API
 * Cron Job으로 매일 오전 10시에 실행 (schedule: "0 1 * * *" UTC = 오전 10시 KST)
 * 최근 24시간 내 등록된 신규 공고 중 매칭률 높은 공고 알림
 */
export async function GET(request: NextRequest) {
  try {
    // Resend API 키 확인
    if (!resend) {
      return NextResponse.json({
        success: false,
        error: 'RESEND_API_KEY가 설정되지 않았어요',
      }, { status: 500 })
    }

    // Cron Job 인증 확인
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }
    }

    const supabase = await createServiceClient()

    // 최근 24시간 내 등록된 신규 공고 조회
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const { data: newAnnouncements, error: announcementsError } = await supabase
      .from('announcements')
      .select(`
        id,
        title,
        organization,
        category,
        support_type,
        support_amount,
        application_end,
        eligibility_criteria
      `)
      .eq('status', 'active')
      .not('eligibility_criteria', 'is', null)
      .gte('created_at', oneDayAgo.toISOString())
      .gte('application_end', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })

    if (announcementsError) {
      console.error('신규 공고 조회 오류:', announcementsError)
      throw announcementsError
    }

    if (!newAnnouncements || newAnnouncements.length === 0) {
      return NextResponse.json({
        success: true,
        message: '신규 공고가 없어요',
        sent: 0,
      })
    }

    console.log(`신규 공고 ${newAnnouncements.length}건 발견`)

    // 스마트 알림이 활성화된 사용자 + 회사 정보 조회
    const { data: usersWithCompaniesData, error: usersError } = await supabase
      .from('companies')
      .select(`
        id,
        user_id,
        name,
        industry,
        location,
        employee_count,
        annual_revenue,
        founded_date,
        certifications
      `)
      .not('user_id', 'is', null)

    // 타입 캐스팅
    const usersWithCompanies = usersWithCompaniesData as Array<{
      id: string
      user_id: string
      name: string | null
      industry: string | null
      location: string | null
      employee_count: number | null
      annual_revenue: number | null
      founded_date: string | null
      certifications: string[] | null
    }> | null

    if (usersError) {
      console.error('사용자 조회 오류:', usersError)
      throw usersError
    }

    if (!usersWithCompanies || usersWithCompanies.length === 0) {
      return NextResponse.json({
        success: true,
        message: '알림 대상 사용자가 없어요',
        sent: 0,
      })
    }

    let sentCount = 0
    const errors: string[] = []
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://govhelpers.com'

    // 각 사용자별로 매칭 점수 계산 및 알림 발송
    for (const company of usersWithCompanies) {
      try {
        // 알림 설정 확인
        const { data: preferencesData } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', company.user_id)
          .single()

        const preferences = preferencesData as {
          email_enabled: boolean
          smart_recommendations?: boolean
          notification_email?: string
        } | null

        // 이메일 알림 비활성화된 경우 스킵
        if (preferences && !preferences.email_enabled) continue

        // 스마트 추천 알림 비활성화된 경우 스킵
        if (preferences && preferences.smart_recommendations === false) continue

        // 회사 정보 변환
        const companyInfo: CompanyInfo = {
          industry: company.industry,
          location: company.location,
          employeeCount: company.employee_count,
          annualRevenue: company.annual_revenue,
          foundedDate: company.founded_date,
          certifications: company.certifications,
        }

        // 매칭 점수 계산 (최소 70점 이상만)
        const recommendations = filterAndScoreAnnouncements(
          newAnnouncements as AnnouncementForRecommendation[],
          companyInfo,
          { limit: 5, minScore: 70 }
        )

        // 추천할 공고가 없으면 스킵
        if (recommendations.length === 0) continue

        // 이미 발송된 알림 확인 (같은 날 같은 공고)
        const today = new Date().toISOString().split('T')[0]
        const { data: existingLogsData } = await supabase
          .from('notification_logs')
          .select('announcement_id')
          .eq('user_id', company.user_id)
          .eq('notification_type', 'smart_recommendation')
          .gte('created_at', today)
          .in('announcement_id', recommendations.map((r) => r.announcement.id))

        const existingLogs = existingLogsData as Array<{ announcement_id: string }> | null
        const sentIds = new Set(existingLogs?.map((l) => l.announcement_id) || [])
        const newRecommendations = recommendations.filter(
          (r) => !sentIds.has(r.announcement.id)
        )

        if (newRecommendations.length === 0) continue

        // 사용자 이메일 조회
        const { data: userData } = await supabase.auth.admin.getUserById(company.user_id)
        const email = (preferences as any)?.notification_email || userData?.user?.email

        if (!email) continue

        const userName = userData?.user?.user_metadata?.name || userData?.user?.email?.split('@')[0] || '회원'
        const unsubscribeUrl = `${appUrl}/dashboard/settings/notifications`

        // 이메일 발송
        const emailHtml = renderSmartRecommendationEmail({
          userName,
          companyName: company.name || '회사',
          recommendations: newRecommendations.map((r) => ({
            id: r.announcement.id,
            title: r.announcement.title,
            organization: r.announcement.organization || '',
            score: r.score,
            matchReasons: r.matchedCriteria.filter(c => c.matched).map(c => c.name),
            endDate: r.announcement.applicationEnd
              ? new Date(r.announcement.applicationEnd).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : '마감일 미정',
            detailUrl: `${appUrl}/dashboard/announcements/${r.announcement.id}`,
          })),
          unsubscribeUrl,
        })

        const { error: sendError } = await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: `[GovHelper] ${company.name || '회원'}님에게 딱 맞는 새 공고 ${newRecommendations.length}건`,
          html: emailHtml,
        })

        if (sendError) {
          console.error(`이메일 발송 실패 (${email}):`, sendError)
          errors.push(`${email}: ${sendError.message}`)
          continue
        }

        // 발송 로그 저장
        const logsToInsert = newRecommendations.map((r) => ({
          user_id: company.user_id,
          announcement_id: r.announcement.id,
          notification_type: 'smart_recommendation' as const,
        }))

        await supabase.from('notification_logs').insert(logsToInsert as any)

        sentCount++
        console.log(`${company.name}님에게 ${newRecommendations.length}건 추천 알림 발송`)
      } catch (userError) {
        console.error(`사용자 ${company.user_id} 처리 오류:`, userError)
        errors.push(`User ${company.user_id}: ${userError}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${sentCount}명에게 스마트 추천 알림을 발송했어요`,
      sent: sentCount,
      newAnnouncements: newAnnouncements.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('스마트 알림 발송 오류:', error)
    return NextResponse.json(
      { success: false, error: '알림 발송에 실패했어요' },
      { status: 500 }
    )
  }
}
