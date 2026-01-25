import { SupabaseClient } from '@supabase/supabase-js'

export interface AnnouncementChange {
  announcementId: string
  changeType: 'amount' | 'deadline' | 'content' | 'status' | 'other'
  fieldName: string
  oldValue: string | null
  newValue: string | null
}

interface AnnouncementData {
  id: string
  title: string
  support_amount: string | null
  application_end: string | null
  content: string | null
  status: string
  [key: string]: unknown
}

/**
 * 두 공고 데이터를 비교하여 변경 사항을 감지
 */
export function detectChanges(
  oldData: AnnouncementData,
  newData: Partial<AnnouncementData>
): AnnouncementChange[] {
  const changes: AnnouncementChange[] = []

  // 지원금액 변경 감지
  if (newData.support_amount !== undefined && oldData.support_amount !== newData.support_amount) {
    changes.push({
      announcementId: oldData.id,
      changeType: 'amount',
      fieldName: 'support_amount',
      oldValue: oldData.support_amount,
      newValue: newData.support_amount,
    })
  }

  // 마감일 변경 감지
  if (newData.application_end !== undefined) {
    const oldEnd = oldData.application_end ? new Date(oldData.application_end).toISOString().split('T')[0] : null
    const newEnd = newData.application_end ? new Date(newData.application_end).toISOString().split('T')[0] : null

    if (oldEnd !== newEnd) {
      changes.push({
        announcementId: oldData.id,
        changeType: 'deadline',
        fieldName: 'application_end',
        oldValue: oldEnd,
        newValue: newEnd,
      })
    }
  }

  // 상태 변경 감지
  if (newData.status !== undefined && oldData.status !== newData.status) {
    changes.push({
      announcementId: oldData.id,
      changeType: 'status',
      fieldName: 'status',
      oldValue: oldData.status,
      newValue: newData.status,
    })
  }

  // 제목 변경 감지
  if (newData.title !== undefined && oldData.title !== newData.title) {
    changes.push({
      announcementId: oldData.id,
      changeType: 'other',
      fieldName: 'title',
      oldValue: oldData.title,
      newValue: newData.title,
    })
  }

  return changes
}

/**
 * 변경 사항을 DB에 저장
 */
export async function saveChanges(
  supabase: SupabaseClient,
  changes: AnnouncementChange[]
): Promise<{ saved: number; failed: number }> {
  if (changes.length === 0) {
    return { saved: 0, failed: 0 }
  }

  let saved = 0
  let failed = 0

  for (const change of changes) {
    try {
      const { error } = await (supabase
        .from('announcement_changes') as any)
        .insert({
          announcement_id: change.announcementId,
          change_type: change.changeType,
          field_name: change.fieldName,
          old_value: change.oldValue,
          new_value: change.newValue,
        })

      if (error) {
        console.error('Save change error:', error)
        failed++
      } else {
        saved++
      }
    } catch (error) {
      console.error('Save change error:', error)
      failed++
    }
  }

  return { saved, failed }
}

/**
 * 변경된 공고를 저장한 사용자들에게 알림 큐 추가
 */
export async function queueChangeNotifications(
  supabase: SupabaseClient,
  announcementId: string,
  changeId: string
): Promise<number> {
  try {
    // 해당 공고를 저장하고 변경 알림을 받기로 한 사용자들 조회
    const { data: savedByUsers, error: fetchError } = await (supabase
      .from('saved_announcements') as any)
      .select('user_id')
      .eq('announcement_id', announcementId)
      .eq('notify_changes', true)

    if (fetchError || !savedByUsers || savedByUsers.length === 0) {
      return 0
    }

    // 알림 큐에 추가
    const notifications = savedByUsers.map((s: { user_id: string }) => ({
      change_id: changeId,
      user_id: s.user_id,
      notification_type: 'both',
      status: 'pending',
    }))

    const { error: insertError } = await (supabase
      .from('announcement_change_notifications') as any)
      .upsert(notifications, { onConflict: 'change_id,user_id' })

    if (insertError) {
      console.error('Queue notifications error:', insertError)
      return 0
    }

    return notifications.length
  } catch (error) {
    console.error('Queue notifications error:', error)
    return 0
  }
}

/**
 * 변경 유형에 따른 한글 설명
 */
export function getChangeDescription(change: {
  change_type: string
  field_name: string
  old_value: string | null
  new_value: string | null
}): string {
  switch (change.change_type) {
    case 'amount':
      return `지원금액이 ${change.old_value || '미정'}에서 ${change.new_value || '미정'}(으)로 변경됐어요`
    case 'deadline':
      const oldDate = change.old_value ? formatDate(change.old_value) : '미정'
      const newDate = change.new_value ? formatDate(change.new_value) : '미정'
      return `마감일이 ${oldDate}에서 ${newDate}(으)로 변경됐어요`
    case 'status':
      const statusMap: Record<string, string> = {
        active: '모집중',
        closed: '마감',
      }
      return `상태가 ${statusMap[change.old_value || ''] || change.old_value}에서 ${statusMap[change.new_value || ''] || change.new_value}(으)로 변경됐어요`
    case 'content':
      return '공고 내용이 수정됐어요'
    default:
      return `${change.field_name}이(가) 변경됐어요`
  }
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}월 ${date.getDate()}일`
  } catch {
    return dateStr
  }
}
