import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AnnouncementDetail } from './announcement-detail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AnnouncementDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // 공고 정보 조회
  const { data: announcement, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !announcement) {
    notFound()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ann = announcement as any

  // 저장 여부 확인
  const { data: saved } = await supabase
    .from('saved_announcements')
    .select('id')
    .eq('user_id', user!.id)
    .eq('announcement_id', id)
    .single()

  // 관련 공고 조회 (같은 카테고리 또는 출처, 최근 5개)
  const { data: relatedAnnouncements } = await supabase
    .from('announcements')
    .select('id, title, organization, category, support_type, support_amount, application_end, source')
    .eq('status', 'active')
    .neq('id', id)
    .or(`category.eq.${ann.category || ''},source.eq.${ann.source}`)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <AnnouncementDetail
      announcement={ann}
      isSaved={!!saved}
      relatedAnnouncements={relatedAnnouncements || []}
    />
  )
}
