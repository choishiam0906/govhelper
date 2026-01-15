import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL } from '@/lib/email/resend'
import { renderDeadlineEmail } from '@/lib/email/templates'

// Vercel Cron Job에서 호출되는 알림 발송 API
// 매일 오전 9시에 실행 권장 (schedule: "0 0 * * *" UTC = 오전 9시 KST)
export async function GET(request: NextRequest) {
  try {
    // Resend API 키 확인
    if (!resend) {
      return NextResponse.json({
        success: false,
        error: 'RESEND_API_KEY가 설정되지 않았어요',
      }, { status: 500 })
    }

    // Cron Job 인증 확인 (Vercel에서 자동으로 헤더 추가)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // 개발 환경에서는 CRON_SECRET 없이도 허용
      if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }
    }

    const supabase = await createServiceClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 마감일 기준 날짜 계산
    const in1Day = new Date(today)
    in1Day.setDate(in1Day.getDate() + 1)

    const in3Days = new Date(today)
    in3Days.setDate(in3Days.getDate() + 3)

    const in7Days = new Date(today)
    in7Days.setDate(in7Days.getDate() + 7)

    // 마감 임박 공고와 저장한 사용자 조회
    const { data: savedAnnouncements, error: fetchError } = (await supabase
      .from('saved_announcements')
      .select(`
        user_id,
        announcement_id,
        announcements (
          id,
          title,
          organization,
          application_end
        )
      `)
      .not('announcements.application_end', 'is', null)
      .gte('announcements.application_end', today.toISOString().split('T')[0])
      .lte('announcements.application_end', in7Days.toISOString().split('T')[0])) as {
      data: Array<{
        user_id: string
        announcement_id: string
        announcements: {
          id: string
          title: string
          organization: string | null
          application_end: string
        } | null
      }> | null
      error: any
    }

    if (fetchError) {
      console.error('공고 조회 오류:', fetchError)
      throw fetchError
    }

    if (!savedAnnouncements || savedAnnouncements.length === 0) {
      return NextResponse.json({
        success: true,
        message: '발송할 알림이 없어요',
        sent: 0,
      })
    }

    // 사용자별로 그룹화
    const userAnnouncements = new Map<
      string,
      Array<{
        id: string
        title: string
        organization: string
        endDate: string
        daysLeft: number
      }>
    >()

    for (const item of savedAnnouncements) {
      const announcement = item.announcements as any
      if (!announcement || !announcement.application_end) continue

      const endDate = new Date(announcement.application_end)
      const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      // 1일, 3일, 7일 전에만 알림
      if (daysLeft !== 1 && daysLeft !== 3 && daysLeft !== 7) continue

      const existing = userAnnouncements.get(item.user_id) || []
      existing.push({
        id: announcement.id,
        title: announcement.title,
        organization: announcement.organization || '',
        endDate: announcement.application_end,
        daysLeft,
      })
      userAnnouncements.set(item.user_id, existing)
    }

    let sentCount = 0
    const errors: string[] = []

    // 각 사용자에게 이메일 발송
    for (const [userId, announcements] of userAnnouncements) {
      try {
        // 사용자 알림 설정 확인
        const { data: preferences } = (await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .single()) as {
          data: {
            email_enabled: boolean
            deadline_7_days: boolean
            deadline_3_days: boolean
            deadline_1_day: boolean
            notification_email: string | null
          } | null
        }

        // 이메일 알림 비활성화된 경우 스킵
        if (preferences && !preferences.email_enabled) continue

        // 각 공고별로 알림 타입에 맞는 설정 확인
        const filteredAnnouncements = announcements.filter((a) => {
          if (!preferences) return true // 기본값은 전부 활성화
          if (a.daysLeft === 1 && !preferences.deadline_1_day) return false
          if (a.daysLeft === 3 && !preferences.deadline_3_days) return false
          if (a.daysLeft === 7 && !preferences.deadline_7_days) return false
          return true
        })

        if (filteredAnnouncements.length === 0) continue

        // 이미 발송된 알림 필터링
        const { data: existingLogs } = (await supabase
          .from('notification_logs')
          .select('announcement_id, notification_type')
          .eq('user_id', userId)
          .in(
            'announcement_id',
            filteredAnnouncements.map((a) => a.id)
          )) as {
          data: Array<{ announcement_id: string; notification_type: string }> | null
        }

        const sentSet = new Set(existingLogs?.map((l) => `${l.announcement_id}-${l.notification_type}`) || [])

        const newAnnouncements = filteredAnnouncements.filter((a) => {
          const key = `${a.id}-deadline_${a.daysLeft}_day${a.daysLeft > 1 ? 's' : ''}`
          return !sentSet.has(key)
        })

        if (newAnnouncements.length === 0) continue

        // 사용자 이메일 조회
        const { data: userData } = await supabase.auth.admin.getUserById(userId)
        const email = preferences?.notification_email || userData?.user?.email

        if (!email) continue

        const userName = userData?.user?.user_metadata?.name || userData?.user?.email?.split('@')[0] || '회원'
        const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://govhelpers.com'}/dashboard/settings/notifications`

        // 이메일 발송
        const emailHtml = renderDeadlineEmail({
          userName,
          announcements: newAnnouncements.map((a) => ({
            id: a.id,
            title: a.title,
            organization: a.organization,
            endDate: new Date(a.endDate).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            daysLeft: a.daysLeft,
            detailUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://govhelpers.com'}/dashboard/announcements/${a.id}`,
          })),
          unsubscribeUrl,
        })

        const { error: sendError } = await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: `[GovHelper] 마감 임박 공고 ${newAnnouncements.length}건을 확인하세요`,
          html: emailHtml,
        })

        if (sendError) {
          console.error(`이메일 발송 실패 (${email}):`, sendError)
          errors.push(`${email}: ${sendError.message}`)
          continue
        }

        // 발송 로그 저장
        const logsToInsert = newAnnouncements.map((a) => ({
          user_id: userId,
          announcement_id: a.id,
          notification_type: `deadline_${a.daysLeft}_day${a.daysLeft > 1 ? 's' : ''}`,
        }))

        await (supabase.from('notification_logs') as any).insert(logsToInsert)

        sentCount++
      } catch (userError) {
        console.error(`사용자 ${userId} 처리 오류:`, userError)
        errors.push(`User ${userId}: ${userError}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${sentCount}명에게 알림을 발송했어요`,
      sent: sentCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('알림 발송 오류:', error)
    return NextResponse.json({ success: false, error: '알림 발송에 실패했어요' }, { status: 500 })
  }
}
