import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushNotification, createNotificationPayload, PushSubscription } from '@/lib/push'

// Cron job: 마감 임박 공고 푸시 알림 발송
// 매일 09:00 KST (00:00 UTC) 실행
export async function POST(request: NextRequest) {
  try {
    // Vercel Cron 인증 확인
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // 개발 환경에서는 통과
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const supabase = createAdminClient()

    // 오늘 날짜
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 3일 후, 7일 후 날짜
    const threeDaysLater = new Date(today)
    threeDaysLater.setDate(today.getDate() + 3)

    const sevenDaysLater = new Date(today)
    sevenDaysLater.setDate(today.getDate() + 7)

    // 알림 대상: 저장된 공고 중 3일/7일 후 마감되는 것
    const { data: savedAnnouncements, error: fetchError } = await supabase
      .from('saved_announcements')
      .select(`
        id,
        user_id,
        notify_deadline,
        announcements (
          id,
          title,
          application_end
        )
      `)
      .eq('notify_deadline', true)
      .gte('announcements.application_end', today.toISOString().split('T')[0])
      .lte('announcements.application_end', sevenDaysLater.toISOString().split('T')[0])

    if (fetchError) {
      console.error('Fetch saved announcements error:', fetchError)
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      )
    }

    // 사용자별로 그룹화
    const userNotifications: Record<string, {
      userId: string
      announcements: Array<{
        id: string
        title: string
        daysLeft: number
      }>
    }> = {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    savedAnnouncements?.forEach((item: any) => {
      if (!item.announcements?.application_end) return

      const endDate = new Date(item.announcements.application_end)
      const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      // 3일 또는 7일 남은 경우만 알림
      if (daysLeft !== 3 && daysLeft !== 7) return

      if (!userNotifications[item.user_id]) {
        userNotifications[item.user_id] = {
          userId: item.user_id,
          announcements: [],
        }
      }

      userNotifications[item.user_id].announcements.push({
        id: item.announcements.id,
        title: item.announcements.title,
        daysLeft,
      })
    })

    // 각 사용자에게 푸시 알림 발송
    let totalSent = 0
    let totalFailed = 0

    for (const [userId, notification] of Object.entries(userNotifications)) {
      // 해당 사용자의 푸시 구독 조회
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', userId)

      if (!subscriptions || subscriptions.length === 0) continue

      // 각 공고에 대해 알림 발송
      for (const announcement of notification.announcements) {
        const payload = createNotificationPayload('deadline', {
          announcementTitle: announcement.title,
          daysLeft: announcement.daysLeft,
          url: `/dashboard/announcements/${announcement.id}`,
        })

        for (const sub of subscriptions) {
          const subscription: PushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          }

          const result = await sendPushNotification(subscription, payload)

          // 로그 기록
          await (supabase.from('push_notification_logs') as any).insert({
            user_id: userId,
            type: 'deadline',
            title: payload.title,
            body: payload.body,
            url: payload.url,
            status: result.success ? 'sent' : 'failed',
            error_message: result.error,
            sent_at: result.success ? new Date().toISOString() : null,
          })

          if (result.success) {
            totalSent++
          } else {
            totalFailed++

            // 구독이 만료된 경우 삭제
            if (result.error?.includes('expired') || result.error?.includes('410')) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', sub.endpoint)
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent: totalSent,
      failed: totalFailed,
      message: `${totalSent}개의 알림을 발송했습니다`,
    })
  } catch (error) {
    console.error('Send deadline notifications error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
