import webpush from 'web-push'

// VAPID 키 설정
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:support@govhelpers.com',
    vapidPublicKey,
    vapidPrivateKey
  )
}

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface PushPayload {
  title: string
  body?: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
  data?: Record<string, unknown>
}

/**
 * 푸시 알림 발송
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body || '',
      icon: payload.icon || '/icons/icon-192x192.svg',
      badge: payload.badge || '/icons/icon-96x96.svg',
      url: payload.url || '/',
      tag: payload.tag,
      data: payload.data,
    })

    await webpush.sendNotification(pushSubscription, notificationPayload)
    return { success: true }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Push notification error:', errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * 여러 구독자에게 푸시 알림 발송
 */
export async function sendPushNotificationToMany(
  subscriptions: PushSubscription[],
  payload: PushPayload
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPushNotification(sub, payload))
  )

  let sent = 0
  let failed = 0
  const errors: string[] = []

  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.success) {
      sent++
    } else {
      failed++
      if (result.status === 'rejected') {
        errors.push(result.reason?.message || 'Unknown error')
      } else if (result.value.error) {
        errors.push(result.value.error)
      }
    }
  })

  return { sent, failed, errors }
}

/**
 * VAPID 공개 키 반환 (클라이언트용)
 */
export function getVapidPublicKey(): string {
  return vapidPublicKey
}

/**
 * 알림 유형별 메시지 생성
 */
export function createNotificationPayload(
  type: 'deadline' | 'recommendation' | 'update' | 'system',
  data: {
    title?: string
    announcementTitle?: string
    daysLeft?: number
    url?: string
  }
): PushPayload {
  switch (type) {
    case 'deadline':
      return {
        title: '마감 임박 알림',
        body: `${data.announcementTitle}이(가) ${data.daysLeft}일 후 마감돼요!`,
        url: data.url || '/dashboard/saved',
        tag: 'deadline',
      }
    case 'recommendation':
      return {
        title: '새로운 맞춤 공고',
        body: `${data.announcementTitle} - 회사에 딱 맞는 공고가 등록됐어요!`,
        url: data.url || '/dashboard/matching',
        tag: 'recommendation',
      }
    case 'update':
      return {
        title: '공고 변경 알림',
        body: `${data.announcementTitle}의 내용이 변경됐어요.`,
        url: data.url || '/dashboard/announcements',
        tag: 'update',
      }
    case 'system':
    default:
      return {
        title: data.title || 'GovHelper 알림',
        body: data.announcementTitle || '새로운 알림이 있어요.',
        url: data.url || '/dashboard',
        tag: 'system',
      }
  }
}
