import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = 'https://govhelpers.com'

interface AnnouncementSitemap {
  id: string
  updated_at: string
  application_end: string | null
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/try`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // 활성 공고 페이지 (최근 업데이트 기준 상위 1000개)
  const { data } = await supabase
    .from('announcements')
    .select('id, updated_at, application_end')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1000)

  const announcements = (data || []) as AnnouncementSitemap[]

  const announcementPages: MetadataRoute.Sitemap = announcements.map((announcement) => {
    // 마감일이 가까울수록 우선순위 높게
    const endDate = announcement.application_end ? new Date(announcement.application_end) : null
    const now = new Date()
    const daysUntilEnd = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 30

    let priority = 0.5
    if (daysUntilEnd <= 7) priority = 0.8
    else if (daysUntilEnd <= 14) priority = 0.7
    else if (daysUntilEnd <= 30) priority = 0.6

    return {
      url: `${BASE_URL}/dashboard/announcements/${announcement.id}`,
      lastModified: new Date(announcement.updated_at),
      changeFrequency: 'daily' as const,
      priority,
    }
  })

  // 트렌드 페이지
  const trendPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/dashboard/trends`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
  ]

  return [...staticPages, ...trendPages, ...announcementPages]
}
