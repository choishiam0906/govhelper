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

  // 저장 여부 확인
  const { data: saved } = await supabase
    .from('saved_announcements')
    .select('id')
    .eq('user_id', user!.id)
    .eq('announcement_id', id)
    .single()

  return (
    <AnnouncementDetail
      announcement={announcement}
      isSaved={!!saved}
    />
  )
}
