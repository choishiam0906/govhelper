import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  TrendsAnalysis,
  TrendsResponse,
  MonthlyTrend,
  CategoryTrend,
  RegionTrend,
  OrganizationTrend,
  SupportTypeTrend,
} from '@/types/trends'

// 공고 데이터 타입
interface AnnouncementRow {
  id: string
  title: string
  organization: string | null
  category: string | null
  support_type: string | null
  support_amount: string | null
  application_start: string | null
  application_end: string | null
  status: string
  created_at: string
  eligibility_criteria: { regions?: { included?: string[] } } | null
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

// 지역 추출 (주소에서 시/도 추출)
function extractRegion(location: string | null): string {
  if (!location) return '기타'

  const regions = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
  ]

  for (const region of regions) {
    if (location.includes(region)) return region
  }

  if (location.includes('전국')) return '전국'
  return '기타'
}

/**
 * 지원사업 트렌드 분석 API
 * GET /api/statistics/trends
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
      .select('id, title, organization, category, support_type, support_amount, application_start, application_end, status, created_at, eligibility_criteria')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: false })

    const announcements = data as AnnouncementRow[] | null

    if (error) {
      throw new Error('공고 데이터 조회 실패')
    }

    if (!announcements || announcements.length === 0) {
      return NextResponse.json<TrendsResponse>({
        success: true,
        data: {
          monthlyTrends: [],
          topCategories: [],
          topRegions: [],
          topOrganizations: [],
          supportTypes: [],
          summary: {
            totalAnnouncements: 0,
            activeAnnouncements: 0,
            avgSupportAmount: 0,
            medianSupportAmount: 0,
            mostPopularCategory: '-',
            mostActiveOrganization: '-',
          },
          analyzedAt: new Date().toISOString(),
        },
      })
    }

    // 1. 월별 추이 분석
    const monthlyMap = new Map<string, { count: number; amounts: number[] }>()

    announcements.forEach(ann => {
      const date = new Date(ann.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      const existing = monthlyMap.get(monthKey) || { count: 0, amounts: [] }
      existing.count++
      const amount = parseAmount(ann.support_amount)
      if (amount > 0) existing.amounts.push(amount)
      monthlyMap.set(monthKey, existing)
    })

    const monthlyTrends: MonthlyTrend[] = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        count: data.count,
        totalAmount: data.amounts.reduce((a, b) => a + b, 0),
        avgAmount: data.amounts.length > 0
          ? Math.round(data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length)
          : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // 2. 카테고리별 분석
    const categoryMap = new Map<string, number>()
    announcements.forEach(ann => {
      const category = ann.category || '미분류'
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
    })

    const totalCount = announcements.length
    const topCategories: CategoryTrend[] = Array.from(categoryMap.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / totalCount) * 100),
        growth: 0, // 이전 데이터 없으면 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // 3. 지역별 분석
    const regionMap = new Map<string, number>()
    announcements.forEach(ann => {
      const eligibility = ann.eligibility_criteria as { regions?: { included?: string[] } } | null
      const regions = eligibility?.regions?.included || []

      if (regions.length === 0 || regions.includes('전국')) {
        regionMap.set('전국', (regionMap.get('전국') || 0) + 1)
      } else {
        regions.forEach(region => {
          const normalized = extractRegion(region)
          regionMap.set(normalized, (regionMap.get(normalized) || 0) + 1)
        })
      }
    })

    const topRegions: RegionTrend[] = Array.from(regionMap.entries())
      .map(([region, count]) => ({
        region,
        count,
        percentage: Math.round((count / totalCount) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // 4. 기관별 분석
    const orgMap = new Map<string, { count: number; amounts: number[] }>()
    announcements.forEach(ann => {
      const org = ann.organization || '미상'
      const existing = orgMap.get(org) || { count: 0, amounts: [] }
      existing.count++
      const amount = parseAmount(ann.support_amount)
      if (amount > 0) existing.amounts.push(amount)
      orgMap.set(org, existing)
    })

    const topOrganizations: OrganizationTrend[] = Array.from(orgMap.entries())
      .map(([organization, data]) => ({
        organization,
        count: data.count,
        avgAmount: data.amounts.length > 0
          ? Math.round(data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length)
          : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // 5. 지원유형별 분석
    const typeMap = new Map<string, number>()
    announcements.forEach(ann => {
      const type = ann.support_type || '미분류'
      typeMap.set(type, (typeMap.get(type) || 0) + 1)
    })

    const supportTypes: SupportTypeTrend[] = Array.from(typeMap.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / totalCount) * 100),
      }))
      .sort((a, b) => b.count - a.count)

    // 6. 요약 통계
    const amounts = announcements
      .map(a => parseAmount(a.support_amount))
      .filter(a => a > 0)
      .sort((a, b) => a - b)

    const activeCount = announcements.filter(a => {
      if (!a.application_end) return true
      return new Date(a.application_end) >= new Date()
    }).length

    const summary = {
      totalAnnouncements: totalCount,
      activeAnnouncements: activeCount,
      avgSupportAmount: amounts.length > 0
        ? Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length)
        : 0,
      medianSupportAmount: amounts.length > 0
        ? amounts[Math.floor(amounts.length / 2)]
        : 0,
      mostPopularCategory: topCategories[0]?.category || '-',
      mostActiveOrganization: topOrganizations[0]?.organization || '-',
    }

    const analysis: TrendsAnalysis = {
      monthlyTrends,
      topCategories,
      topRegions,
      topOrganizations,
      supportTypes,
      summary,
      analyzedAt: new Date().toISOString(),
    }

    return NextResponse.json<TrendsResponse>({
      success: true,
      data: analysis,
    })
  } catch (error) {
    console.error('트렌드 분석 오류:', error)
    return NextResponse.json<TrendsResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : '트렌드 분석에 실패했어요',
      },
      { status: 500 }
    )
  }
}
