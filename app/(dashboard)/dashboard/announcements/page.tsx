import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { AnnouncementFilters } from "@/components/announcements/announcement-filters"
import { AnnouncementList } from "@/components/announcements/announcement-list"
import { Pagination } from "@/components/announcements/pagination"
import { AnnouncementsTabs } from "@/components/announcements/announcements-tabs"

// 공고 타입 정의
interface Announcement {
  id: string
  title: string
  organization: string | null
  category: string | null
  support_type: string | null
  support_amount: string | null
  application_start: string | null
  application_end: string | null
  source: string
  status: string
  created_at: string
  eligibility_criteria: {
    employeeCount?: { max?: number; min?: number }
    businessAge?: { max?: number; description?: string }
    summary?: string
  } | null
}

interface SearchParams {
  search?: string
  category?: string
  supportType?: string
  source?: string
  page?: string
  // 새로운 필터 파라미터
  amount?: string
  employees?: string
  deadline?: string
}

// 지원금액 범위 파싱
function parseAmountRange(amount: string): { min: number | null; max: number | null } {
  if (!amount || amount === 'all') return { min: null, max: null }

  const parts = amount.split('-')
  const min = parts[0] ? parseInt(parts[0], 10) : null
  const max = parts[1] ? parseInt(parts[1], 10) : null

  return { min, max }
}

// 직원수 범위 파싱
function parseEmployeeRange(employees: string): { min: number | null; max: number | null } {
  if (!employees || employees === 'all') return { min: null, max: null }

  const parts = employees.split('-')
  const min = parts[0] ? parseInt(parts[0], 10) : null
  const max = parts[1] ? parseInt(parts[1], 10) : null

  return { min, max }
}

// 마감일 계산
function getDeadlineDate(deadline: string): Date | null {
  if (!deadline || deadline === 'all' || deadline === 'ongoing') return null

  const days = parseInt(deadline, 10)
  if (isNaN(days)) return null

  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
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
  const amount = params.amount || ''
  const employees = params.employees || ''
  const deadline = params.deadline || ''

  // 쿼리 빌드 - eligibility_criteria, created_at 포함
  let query = supabase
    .from('announcements')
    .select('id, title, organization, category, support_type, support_amount, application_start, application_end, source, status, created_at, eligibility_criteria', { count: 'exact' })
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

  // 마감일 필터
  if (deadline) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (deadline === 'ongoing') {
      // 상시 모집 - application_end가 null이거나 매우 먼 미래
      query = query.or('application_end.is.null,application_end.gte.2099-01-01')
    } else {
      const deadlineDate = getDeadlineDate(deadline)
      if (deadlineDate) {
        // 오늘 이후 ~ 마감일 이내
        query = query
          .gte('application_end', today.toISOString().split('T')[0])
          .lte('application_end', deadlineDate.toISOString().split('T')[0])
      }
    }
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

  // 클라이언트 측 필터링 (지원금액, 직원수 - JSONB 필터링은 복잡하므로)
  let filteredAnnouncements: Announcement[] = (announcements || []) as Announcement[]

  // 지원금액 필터 (클라이언트 측)
  if (amount && amount !== 'all') {
    const { min: amountMin, max: amountMax } = parseAmountRange(amount)

    filteredAnnouncements = filteredAnnouncements.filter((ann) => {
      if (!ann.support_amount) return false

      // 숫자만 추출
      const numericStr = ann.support_amount.replace(/[^0-9]/g, '')
      if (!numericStr) return false

      const value = parseInt(numericStr, 10)
      if (isNaN(value)) return false

      // 범위 체크
      if (amountMin !== null && value < amountMin) return false
      if (amountMax !== null && value > amountMax) return false

      return true
    })
  }

  // 직원수 필터 (클라이언트 측 - eligibility_criteria.employeeCount 기반)
  if (employees && employees !== 'all') {
    const { max: empMax } = parseEmployeeRange(employees)

    filteredAnnouncements = filteredAnnouncements.filter((ann) => {
      // eligibility_criteria가 없으면 통과 (모든 기업 대상으로 가정)
      if (!ann.eligibility_criteria) return true

      // employeeCount 조건이 없으면 통과
      if (!ann.eligibility_criteria.employeeCount) return true

      // 공고의 최대 직원수 조건 확인
      const announcementMaxEmployees = ann.eligibility_criteria.employeeCount.max

      // 사용자가 선택한 직원수 범위와 공고 조건 비교
      // 예: 사용자가 "50인 이하" 선택 → 공고가 "100인 이하"면 통과 (50인도 지원 가능)
      if (empMax && announcementMaxEmployees) {
        // 사용자의 직원수가 공고의 최대 조건 이하면 통과
        return empMax <= announcementMaxEmployees
      }

      return true
    })
  }

  const totalPages = Math.ceil((count || 0) / limit)
  const filteredCount = filteredAnnouncements.length

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
        <AnnouncementList announcements={filteredAnnouncements} />

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
