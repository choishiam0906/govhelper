import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AnnouncementDetail } from './announcement-detail'
import { AnnouncementJsonLd } from '@/components/seo/announcement-json-ld'

interface PageProps {
  params: Promise<{ id: string }>
}

// 메타데이터용 공고 타입
interface AnnouncementMeta {
  title: string | null
  organization: string | null
  category: string | null
  support_amount: string | null
  application_end: string | null
  description: string | null
}

// 동적 메타데이터 생성
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('announcements')
    .select('title, organization, category, support_amount, application_end, description')
    .eq('id', id)
    .single()

  const announcement = data as AnnouncementMeta | null

  if (!announcement) {
    return {
      title: '공고를 찾을 수 없습니다',
    }
  }

  const title = announcement.title || '정부지원사업 공고'
  const organization = announcement.organization || ''
  const category = announcement.category || ''
  const supportAmount = announcement.support_amount || ''
  const applicationEnd = announcement.application_end
    ? new Date(announcement.application_end).toLocaleDateString('ko-KR')
    : ''

  // 설명 생성 (150자 제한)
  let description = `${organization} | ${category}`
  if (supportAmount) description += ` | 지원금: ${supportAmount}`
  if (applicationEnd) description += ` | 마감: ${applicationEnd}`
  if (announcement.description) {
    const cleanDesc = announcement.description.replace(/<[^>]*>/g, '').slice(0, 100)
    description += ` - ${cleanDesc}`
  }
  description = description.slice(0, 150)

  // 키워드 생성
  const keywords = [
    '정부지원사업',
    '지원금',
    category,
    organization,
    '중소기업 지원',
    '스타트업 지원',
  ].filter(Boolean)

  return {
    title: `${title} | GovHelper`,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://govhelpers.com/dashboard/announcements/${id}`,
      siteName: 'GovHelper',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `https://govhelpers.com/dashboard/announcements/${id}`,
    },
  }
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
    <>
      <AnnouncementJsonLd announcement={ann} />
      <AnnouncementDetail
        announcement={ann}
        isSaved={!!saved}
        relatedAnnouncements={relatedAnnouncements || []}
      />
    </>
  )
}
