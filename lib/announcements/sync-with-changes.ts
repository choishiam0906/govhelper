import { SupabaseClient } from '@supabase/supabase-js'
import { detectChanges, saveChanges, queueChangeNotifications } from './change-detector'

interface AnnouncementToUpsert {
  source: string
  source_id: string
  title: string
  organization?: string
  category?: string
  support_type?: string
  target_company?: string
  support_amount?: string
  application_start?: string | null
  application_end?: string | null
  content?: string
  attachment_urls?: string[] | null
  status: string
  updated_at: string
}

interface SyncResult {
  upserted: number
  changesDetected: number
  notificationsQueued: number
}

/**
 * 공고 동기화 시 변경 사항 감지 및 알림 큐 추가
 */
export async function syncWithChangeDetection(
  supabase: SupabaseClient,
  announcements: AnnouncementToUpsert[]
): Promise<SyncResult> {
  if (announcements.length === 0) {
    return { upserted: 0, changesDetected: 0, notificationsQueued: 0 }
  }

  const source = announcements[0].source
  const sourceIds = announcements.map(a => a.source_id)

  // 기존 공고 조회
  const { data: existingAnnouncements } = await (supabase
    .from('announcements') as any)
    .select('id, source_id, title, support_amount, application_end, status, content')
    .eq('source', source)
    .in('source_id', sourceIds)

  // source_id를 키로 하는 맵 생성
  const existingMap = new Map<string, any>()
  if (existingAnnouncements) {
    for (const ann of existingAnnouncements) {
      existingMap.set(ann.source_id, ann)
    }
  }

  // 변경 감지
  let totalChanges = 0
  let totalNotifications = 0

  for (const newAnn of announcements) {
    const existing = existingMap.get(newAnn.source_id)
    if (!existing) continue // 신규 공고는 변경 감지 불필요

    // 변경 사항 감지
    const changes = detectChanges(
      {
        id: existing.id,
        title: existing.title,
        support_amount: existing.support_amount,
        application_end: existing.application_end,
        content: existing.content,
        status: existing.status,
      },
      {
        title: newAnn.title,
        support_amount: newAnn.support_amount || null,
        application_end: newAnn.application_end,
        status: newAnn.status,
      }
    )

    if (changes.length > 0) {
      console.log(`📝 변경 감지: ${newAnn.title} (${changes.length}건)`)

      // 변경 사항 저장
      const { saved } = await saveChanges(supabase, changes)
      totalChanges += saved

      // 저장된 변경 ID 조회
      if (saved > 0) {
        const { data: savedChanges } = await (supabase
          .from('announcement_changes') as any)
          .select('id')
          .eq('announcement_id', existing.id)
          .order('detected_at', { ascending: false })
          .limit(saved)

        // 알림 큐 추가
        if (savedChanges) {
          for (const change of savedChanges) {
            const queued = await queueChangeNotifications(supabase, existing.id, change.id)
            totalNotifications += queued
          }
        }
      }
    }
  }

  // 배치 upsert
  const { count, error: upsertError } = await supabase
    .from('announcements')
    .upsert(announcements, {
      onConflict: 'source,source_id',
      count: 'exact'
    })

  if (upsertError) {
    console.error('Batch upsert error:', upsertError.message)
    throw new Error(upsertError.message)
  }

  return {
    upserted: count || 0,
    changesDetected: totalChanges,
    notificationsQueued: totalNotifications,
  }
}
