import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushNotification, createNotificationPayload } from '@/lib/push'
import { getChangeDescription } from '@/lib/announcements/change-detector'

// Vercel Cron 인증
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST: 공고 변경 알림 발송 (Cron job)
 * 매시간 실행하여 대기 중인 변경 알림 발송
 */
export async function POST() {
  try {
    const supabase = createAdminClient()

    // 대기 중인 변경 알림 조회 (최근 24시간 내)
    const { data: pendingNotifications, error: fetchError } = await (supabase
      .from('announcement_change_notifications') as any)
      .select(`
        id,
        change_id,
        user_id,
        notification_type,
        announcement_changes (
          id,
          announcement_id,
          change_type,
          field_name,
          old_value,
          new_value,
          detected_at,
          announcements (
            id,
            title,
            organization
          )
        )
      `)
      .eq('status', 'pending')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(100)

    if (fetchError) {
      console.error('Fetch pending notifications error:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pending notifications' },
        { status: 500 }
      )
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending notifications',
        stats: { processed: 0, sent: 0, failed: 0 },
      })
    }

    let sent = 0
    let failed = 0

    for (const notification of pendingNotifications) {
      const change = notification.announcement_changes
      const announcement = change?.announcements

      if (!change || !announcement) {
        // 관련 데이터가 없으면 실패 처리
        await (supabase
          .from('announcement_change_notifications') as any)
          .update({ status: 'failed' })
          .eq('id', notification.id)
        failed++
        continue
      }

      try {
        // 푸시 알림 발송
        if (notification.notification_type === 'push' || notification.notification_type === 'both') {
          // 사용자의 푸시 구독 정보 조회
          const { data: subscriptions } = await (supabase
            .from('push_subscriptions') as any)
            .select('endpoint, p256dh, auth')
            .eq('user_id', notification.user_id)

          if (subscriptions && subscriptions.length > 0) {
            const description = getChangeDescription(change)
            const payload = createNotificationPayload('update', {
              announcementTitle: announcement.title,
              url: `/dashboard/announcements/${announcement.id}`,
            })
            payload.body = description

            for (const sub of subscriptions) {
              await sendPushNotification(
                {
                  endpoint: sub.endpoint,
                  keys: { p256dh: sub.p256dh, auth: sub.auth },
                },
                payload
              )
            }
          }
        }

        // 이메일 알림 (TODO: 구현 필요)
        // if (notification.notification_type === 'email' || notification.notification_type === 'both') {
        //   await sendChangeEmail(notification.user_id, change, announcement)
        // }

        // 발송 완료 처리
        await (supabase
          .from('announcement_change_notifications') as any)
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', notification.id)

        sent++
      } catch (error) {
        console.error('Send notification error:', error)
        await (supabase
          .from('announcement_change_notifications') as any)
          .update({ status: 'failed' })
          .eq('id', notification.id)
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        processed: pendingNotifications.length,
        sent,
        failed,
      },
    })
  } catch (error) {
    console.error('Send changes notification error:', error)
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}

// GET: 변경 알림 상태 조회
export async function GET() {
  try {
    const supabase = createAdminClient()

    // 최근 24시간 알림 통계
    const { data: stats, error } = await (supabase
      .from('announcement_change_notifications') as any)
      .select('status')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch stats' },
        { status: 500 }
      )
    }

    const pending = stats?.filter((s: { status: string }) => s.status === 'pending').length || 0
    const sent = stats?.filter((s: { status: string }) => s.status === 'sent').length || 0
    const failed = stats?.filter((s: { status: string }) => s.status === 'failed').length || 0

    return NextResponse.json({
      success: true,
      stats: { pending, sent, failed, total: stats?.length || 0 },
    })
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}
