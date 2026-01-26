import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 공고 데이터 타입
interface AnnouncementRow {
  id: string
  category: string | null
  support_amount: string | null
  application_end: string | null
  created_at: string
  eligibility_criteria: {
    industries?: { included?: string[] }
    companyTypes?: string[]
  } | null
}

// 지원금액 파싱
function parseAmount(amount: string | null): number {
  if (!amount) return 0
  const numStr = amount.replace(/[^0-9]/g, '')
  if (!numStr) return 0
  let value = parseInt(numStr, 10)
  if (amount.includes('억')) value *= 100000000
  else if (amount.includes('천만')) value *= 10000000
  else if (amount.includes('만')) value *= 10000
  return value
}

// 업종 그룹화
const INDUSTRY_GROUPS: Record<string, string[]> = {
  'IT/소프트웨어': ['정보통신', 'ICT', 'SW', '소프트웨어', '정보기술', 'IT', '인공지능', 'AI', '빅데이터', '클라우드'],
  '제조업': ['제조', '생산', '가공', '부품', '소재'],
  '바이오/헬스케어': ['바이오', '헬스케어', '의료', '제약', '생명', '건강'],
  '에너지/환경': ['에너지', '환경', '신재생', '그린', '탄소', 'ESG'],
  '콘텐츠/미디어': ['콘텐츠', '미디어', '문화', '게임', '영상', '방송'],
  '유통/서비스': ['유통', '서비스', '물류', '커머스'],
  '금융/핀테크': ['금융', '핀테크', '결제', '보험', '투자'],
  '건설/부동산': ['건설', '부동산', '건축', '인테리어'],
  '농림수산': ['농업', '축산', '수산', '임업', '식품'],
  '기타': [],
}

function categorizeIndustry(category: string | null, industries: string[] = []): string {
  const searchText = [category || '', ...industries].join(' ').toLowerCase()

  for (const [group, keywords] of Object.entries(INDUSTRY_GROUPS)) {
    if (group === '기타') continue
    if (keywords.some(kw => searchText.includes(kw.toLowerCase()))) {
      return group
    }
  }

  return '기타'
}

// 업종별 분석 결과
interface IndustryAnalysis {
  industry: string
  totalCount: number
  activeCount: number
  avgSupportAmount: number
  maxSupportAmount: number
  minSupportAmount: number
  topCategories: { category: string; count: number }[]
  targetCompanyTypes: { type: string; count: number }[]
  monthlyTrend: { month: string; count: number }[]
}

interface IndustryAnalysisResponse {
  success: boolean
  data?: {
    industries: IndustryAnalysis[]
    summary: {
      totalIndustries: number
      mostActiveIndustry: string
      highestAvgAmount: string
      growingIndustries: string[]
    }
    analyzedAt: string
  }
  error?: string
}

/**
 * 업종별 분석 API
 * GET /api/statistics/industry
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 최근 6개월 날짜 범위
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // 공고 데이터 조회
    const { data, error } = await supabase
      .from('announcements')
      .select('id, category, support_amount, application_end, created_at, eligibility_criteria')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: false })

    const announcements = data as AnnouncementRow[] | null

    if (error) {
      throw new Error('공고 데이터 조회 실패')
    }

    if (!announcements || announcements.length === 0) {
      return NextResponse.json<IndustryAnalysisResponse>({
        success: true,
        data: {
          industries: [],
          summary: {
            totalIndustries: 0,
            mostActiveIndustry: '-',
            highestAvgAmount: '-',
            growingIndustries: [],
          },
          analyzedAt: new Date().toISOString(),
        },
      })
    }

    // 업종별로 그룹화
    const industryMap = new Map<string, {
      announcements: AnnouncementRow[]
      categories: Map<string, number>
      companyTypes: Map<string, number>
      months: Map<string, number>
    }>()

    announcements.forEach(ann => {
      const industries = ann.eligibility_criteria?.industries?.included || []
      const industry = categorizeIndustry(ann.category, industries)

      if (!industryMap.has(industry)) {
        industryMap.set(industry, {
          announcements: [],
          categories: new Map(),
          companyTypes: new Map(),
          months: new Map(),
        })
      }

      const data = industryMap.get(industry)!
      data.announcements.push(ann)

      // 카테고리 집계
      const cat = ann.category || '미분류'
      data.categories.set(cat, (data.categories.get(cat) || 0) + 1)

      // 기업 유형 집계
      const types = ann.eligibility_criteria?.companyTypes || []
      types.forEach(type => {
        data.companyTypes.set(type, (data.companyTypes.get(type) || 0) + 1)
      })

      // 월별 집계
      const date = new Date(ann.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      data.months.set(monthKey, (data.months.get(monthKey) || 0) + 1)
    })

    // 업종별 분석 결과 생성
    const industries: IndustryAnalysis[] = Array.from(industryMap.entries())
      .map(([industry, data]) => {
        const amounts = data.announcements
          .map(a => parseAmount(a.support_amount))
          .filter(a => a > 0)
          .sort((a, b) => a - b)

        const activeCount = data.announcements.filter(a => {
          if (!a.application_end) return true
          return new Date(a.application_end) >= new Date()
        }).length

        const topCategories = Array.from(data.categories.entries())
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        const targetCompanyTypes = Array.from(data.companyTypes.entries())
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        const monthlyTrend = Array.from(data.months.entries())
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => a.month.localeCompare(b.month))

        return {
          industry,
          totalCount: data.announcements.length,
          activeCount,
          avgSupportAmount: amounts.length > 0
            ? Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length)
            : 0,
          maxSupportAmount: amounts.length > 0 ? amounts[amounts.length - 1] : 0,
          minSupportAmount: amounts.length > 0 ? amounts[0] : 0,
          topCategories,
          targetCompanyTypes,
          monthlyTrend,
        }
      })
      .sort((a, b) => b.totalCount - a.totalCount)

    // 성장 중인 업종 식별 (최근 월 vs 이전 월 비교)
    const growingIndustries = industries
      .filter(ind => {
        if (ind.monthlyTrend.length < 2) return false
        const recent = ind.monthlyTrend[ind.monthlyTrend.length - 1]?.count || 0
        const previous = ind.monthlyTrend[ind.monthlyTrend.length - 2]?.count || 0
        return recent > previous
      })
      .slice(0, 3)
      .map(ind => ind.industry)

    // 최고 평균 지원금 업종
    const highestAvgIndustry = industries
      .filter(ind => ind.avgSupportAmount > 0)
      .sort((a, b) => b.avgSupportAmount - a.avgSupportAmount)[0]

    const summary = {
      totalIndustries: industries.length,
      mostActiveIndustry: industries[0]?.industry || '-',
      highestAvgAmount: highestAvgIndustry?.industry || '-',
      growingIndustries,
    }

    return NextResponse.json<IndustryAnalysisResponse>({
      success: true,
      data: {
        industries,
        summary,
        analyzedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('업종별 분석 오류:', error)
    return NextResponse.json<IndustryAnalysisResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : '업종별 분석에 실패했어요',
      },
      { status: 500 }
    )
  }
}
