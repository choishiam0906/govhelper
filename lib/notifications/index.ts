import { SupabaseClient } from '@supabase/supabase-js'

export type NotificationType = 'deadline' | 'matching' | 'recommendation' | 'system' | 'announcement'

export interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  message?: string
  announcementId?: string
  matchId?: string
  metadata?: Record<string, unknown>
  actionUrl?: string
  expiresAt?: Date
}

/**
 * 사용자에게 인앱 알림을 생성합니다.
 */
export async function createNotification(
  supabase: SupabaseClient,
  input: CreateNotificationInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await supabase.from('notifications').insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      message: input.message || null,
      announcement_id: input.announcementId || null,
      match_id: input.matchId || null,
      metadata: input.metadata || {},
      action_url: input.actionUrl || null,
      expires_at: input.expiresAt?.toISOString() || null,
    }).select('id').single()

    if (error) {
      console.error('알림 생성 오류:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data.id }
  } catch (error) {
    console.error('알림 생성 실패:', error)
    return { success: false, error: '알림 생성에 실패했어요' }
  }
}

/**
 * 여러 사용자에게 알림을 일괄 생성합니다.
 */
export async function createBulkNotifications(
  supabase: SupabaseClient,
  inputs: CreateNotificationInput[]
): Promise<{ success: boolean; created: number; error?: string }> {
  try {
    const records = inputs.map((input) => ({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      message: input.message || null,
      announcement_id: input.announcementId || null,
      match_id: input.matchId || null,
      metadata: input.metadata || {},
      action_url: input.actionUrl || null,
      expires_at: input.expiresAt?.toISOString() || null,
    }))

    const { data, error } = await supabase.from('notifications').insert(records)

    if (error) {
      console.error('일괄 알림 생성 오류:', error)
      return { success: false, created: 0, error: error.message }
    }

    return { success: true, created: inputs.length }
  } catch (error) {
    console.error('일괄 알림 생성 실패:', error)
    return { success: false, created: 0, error: '알림 생성에 실패했어요' }
  }
}

/**
 * 마감 임박 알림을 생성합니다.
 */
export async function createDeadlineNotification(
  supabase: SupabaseClient,
  userId: string,
  announcement: { id: string; title: string; daysLeft: number }
): Promise<{ success: boolean; error?: string }> {
  const daysText = announcement.daysLeft === 0 ? '오늘' : `${announcement.daysLeft}일 후`

  return createNotification(supabase, {
    userId,
    type: 'deadline',
    title: `마감 ${daysText}! ${announcement.title}`,
    message: `관심 등록한 공고의 마감일이 ${daysText}예요. 지원을 서둘러주세요.`,
    announcementId: announcement.id,
    actionUrl: `/dashboard/announcements/${announcement.id}`,
    metadata: { daysLeft: announcement.daysLeft },
  })
}

/**
 * 매칭 완료 알림을 생성합니다.
 */
export async function createMatchingNotification(
  supabase: SupabaseClient,
  userId: string,
  match: { id: string; announcementTitle: string; score: number }
): Promise<{ success: boolean; error?: string }> {
  return createNotification(supabase, {
    userId,
    type: 'matching',
    title: `AI 매칭 분석 완료: ${match.score}점`,
    message: `'${match.announcementTitle}' 공고에 대한 매칭 분석이 완료되었어요.`,
    matchId: match.id,
    actionUrl: `/dashboard/matching/${match.id}`,
    metadata: { score: match.score },
  })
}

/**
 * 맞춤 추천 알림을 생성합니다.
 */
export async function createRecommendationNotification(
  supabase: SupabaseClient,
  userId: string,
  recommendation: { count: number }
): Promise<{ success: boolean; error?: string }> {
  return createNotification(supabase, {
    userId,
    type: 'recommendation',
    title: `새로운 맞춤 공고 ${recommendation.count}건`,
    message: '기업 프로필에 맞는 새로운 공고가 등록되었어요.',
    actionUrl: '/dashboard/matching',
    metadata: { count: recommendation.count },
  })
}

/**
 * 시스템 알림을 생성합니다.
 */
export async function createSystemNotification(
  supabase: SupabaseClient,
  userId: string,
  notification: { title: string; message: string; actionUrl?: string }
): Promise<{ success: boolean; error?: string }> {
  return createNotification(supabase, {
    userId,
    type: 'system',
    title: notification.title,
    message: notification.message,
    actionUrl: notification.actionUrl,
  })
}
