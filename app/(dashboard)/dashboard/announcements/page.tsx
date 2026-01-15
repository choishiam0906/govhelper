import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { AnnouncementFilters } from "@/components/announcements/announcement-filters"
import { AnnouncementList } from "@/components/announcements/announcement-list"
import { Pagination } from "@/components/announcements/pagination"
import { AnnouncementsTabs } from "@/components/announcements/announcements-tabs"

interface SearchParams {
  search?: string
  category?: string
  supportType?: string
  source?: string
  page?: string
}

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const page = parseInt(params.page || '1')
  const limit = 10
  const search = params.search || ''
  const category = params.category || ''
  const supportType = params.supportType || ''
  const source = params.source || ''

  // 쿼리 빌드
  let query = supabase
    .from('announcements')
    .select('*', { count: 'exact' })
    .eq('status', 'active')

  // 검색어 필터
  if (search) {
    query = query.or(`title.ilike.%${search}%,organization.ilike.%${search}%`)
  }

  // 분야 필터
  if (category) {
    query = query.ilike('category', `%${category}%`)
  }

  // 지원유형 필터
  if (supportType) {
    query = query.ilike('support_type', `%${supportType}%`)
  }

  // 출처 필터
  if (source) {
    query = query.eq('source', source)
  }

  // 페이지네이션
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data: announcements, count, error } = await query
    .range(from, to)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Announcements fetch error:', error)
  }

  const totalPages = Math.ceil((count || 0) / limit)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">공고 검색</h1>
        <p className="text-muted-foreground mt-1">
          정부지원사업 공고를 검색해 보세요
        </p>
      </div>

      <AnnouncementsTabs>
        {/* 검색 및 필터 */}
        <Card>
          <CardContent className="pt-6">
            <AnnouncementFilters />
          </CardContent>
        </Card>

        {/* 결과 목록 */}
        <AnnouncementList announcements={announcements || []} />

        {/* 페이지네이션 */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          total={count || 0}
        />
      </AnnouncementsTabs>
    </div>
  )
}
