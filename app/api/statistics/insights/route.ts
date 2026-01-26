import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 매칭 데이터 타입
interface MatchRow {
  id: string
  score: number | null
  analysis: {
    eligibilityMatch?: number
    categoryMatch?: number
    scoreDetails?: {
      companyType?: { score: number }
      employeeCount?: { score: number }
      revenue?: { score: number }
      businessAge?: { score: number }
      location?: { score: number }
    }
  } | null
  announcement_id: string
  created_at: string
}

// 공고 데이터 타입
interface AnnouncementRow {
  id: string
  category: string | null
  organization: string | null
  support_amount: string | null
  eligibility_criteria: {
    companyTypes?: string[]
    industries?: { included?: string[] }
  } | null
}

// 인사이트 결과
interface SuccessInsight {
  // 점수 분포
  scoreDistribution: {
    range: string
    count: number
    percentage: number
  }[]
  // 높은 점수 요인 분석
  topSuccessFactors: {
    factor: string
    avgContribution: number
    description: string
  }[]
  // 카테고리별 평균 점수
  categoryScores: {
    category: string
    avgScore: number
    matchCount: number
  }[]
  // 기관별 평균 점수
  organizationScores: {
    organization: string
    avgScore: number
    matchCount: number
  }[]
  // 시간대별 매칭 패턴
  hourlyPattern: {
    hour: number
    count: number
  }[]
  // 요약
  summary: {
    totalMatches: number
    avgScore: number
    highScoreRate: number // 70점 이상 비율
    topCategory: string
    topOrganization: string
  }
  // 개선 제안
  recommendations: string[]
}

interface InsightsResponse {
  success: boolean
  data?: SuccessInsight
  error?: string
}

/**
 * 성공률 인사이트 API
 * GET /api/statistics/insights
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser()

    // 매칭 데이터 조회 (최근 3개월)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    let matchQuery = supabase
      .from('matches')
      .select('id, score, analysis, announcement_id, created_at')
      .gte('created_at', threeMonthsAgo.toISOString())
      .order('created_at', { ascending: false })

    // 로그인한 사용자는 자신의 매칭만 조회
    if (user) {
      // 회사 ID 조회
      const { data: companyData } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single()

      const company = companyData as { id: string } | null
      if (company) {
        matchQuery = matchQuery.eq('company_id', company.id)
      }
    }

    const { data: matchData, error: matchError } = await matchQuery.limit(500)

    const matches = matchData as MatchRow[] | null

    if (matchError) {
      throw new Error('매칭 데이터 조회 실패')
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json<InsightsResponse>({
        success: true,
        data: {
          scoreDistribution: [],
          topSuccessFactors: [],
          categoryScores: [],
          organizationScores: [],
          hourlyPattern: [],
          summary: {
            totalMatches: 0,
            avgScore: 0,
            highScoreRate: 0,
            topCategory: '-',
            topOrganization: '-',
          },
          recommendations: ['매칭 데이터가 없어요. AI 매칭을 진행해 보세요!'],
        },
      })
    }

    // 공고 정보 조회
    const announcementIds = [...new Set(matches.map(m => m.announcement_id))]
    const { data: announcementData } = await supabase
      .from('announcements')
      .select('id, category, organization, support_amount, eligibility_criteria')
      .in('id', announcementIds)

    const announcements = announcementData as AnnouncementRow[] | null
    const announcementMap = new Map<string, AnnouncementRow>()
    announcements?.forEach(a => announcementMap.set(a.id, a))

    // 1. 점수 분포
    const scoreRanges = [
      { min: 0, max: 29, label: '0-29점' },
      { min: 30, max: 49, label: '30-49점' },
      { min: 50, max: 69, label: '50-69점' },
      { min: 70, max: 84, label: '70-84점' },
      { min: 85, max: 100, label: '85-100점' },
    ]

    const scoreDistribution = scoreRanges.map(range => {
      const count = matches.filter(m => {
        const score = m.score || 0
        return score >= range.min && score <= range.max
      }).length

      return {
        range: range.label,
        count,
        percentage: Math.round((count / matches.length) * 100),
      }
    })

    // 2. 성공 요인 분석
    const factorScores = {
      companyType: { total: 0, count: 0 },
      employeeCount: { total: 0, count: 0 },
      revenue: { total: 0, count: 0 },
      businessAge: { total: 0, count: 0 },
      location: { total: 0, count: 0 },
    }

    matches.forEach(m => {
      const details = m.analysis?.scoreDetails
      if (details) {
        if (details.companyType?.score) {
          factorScores.companyType.total += details.companyType.score
          factorScores.companyType.count++
        }
        if (details.employeeCount?.score) {
          factorScores.employeeCount.total += details.employeeCount.score
          factorScores.employeeCount.count++
        }
        if (details.revenue?.score) {
          factorScores.revenue.total += details.revenue.score
          factorScores.revenue.count++
        }
        if (details.businessAge?.score) {
          factorScores.businessAge.total += details.businessAge.score
          factorScores.businessAge.count++
        }
        if (details.location?.score) {
          factorScores.location.total += details.location.score
          factorScores.location.count++
        }
      }
    })

    const factorLabels: Record<string, { name: string; desc: string }> = {
      companyType: { name: '기업 유형', desc: '기업 유형 적합도가 점수에 크게 기여해요' },
      employeeCount: { name: '직원 수', desc: '직원 수 조건 충족이 중요해요' },
      revenue: { name: '매출', desc: '매출 조건이 잘 맞는 공고를 선택하세요' },
      businessAge: { name: '업력', desc: '창업 연수 조건을 확인하세요' },
      location: { name: '지역', desc: '지역 조건이 맞는 공고가 유리해요' },
    }

    const topSuccessFactors = Object.entries(factorScores)
      .filter(([_, data]) => data.count > 0)
      .map(([key, data]) => ({
        factor: factorLabels[key].name,
        avgContribution: Math.round(data.total / data.count),
        description: factorLabels[key].desc,
      }))
      .sort((a, b) => b.avgContribution - a.avgContribution)

    // 3. 카테고리별 평균 점수
    const categoryMap = new Map<string, { total: number; count: number }>()
    matches.forEach(m => {
      const ann = announcementMap.get(m.announcement_id)
      const category = ann?.category || '미분류'
      const existing = categoryMap.get(category) || { total: 0, count: 0 }
      existing.total += m.score || 0
      existing.count++
      categoryMap.set(category, existing)
    })

    const categoryScores = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        avgScore: Math.round(data.total / data.count),
        matchCount: data.count,
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10)

    // 4. 기관별 평균 점수
    const orgMap = new Map<string, { total: number; count: number }>()
    matches.forEach(m => {
      const ann = announcementMap.get(m.announcement_id)
      const org = ann?.organization || '미상'
      const existing = orgMap.get(org) || { total: 0, count: 0 }
      existing.total += m.score || 0
      existing.count++
      orgMap.set(org, existing)
    })

    const organizationScores = Array.from(orgMap.entries())
      .map(([organization, data]) => ({
        organization,
        avgScore: Math.round(data.total / data.count),
        matchCount: data.count,
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10)

    // 5. 시간대별 매칭 패턴
    const hourMap = new Map<number, number>()
    matches.forEach(m => {
      const hour = new Date(m.created_at).getHours()
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
    })

    const hourlyPattern = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hourMap.get(i) || 0,
    }))

    // 6. 요약 통계
    const scores = matches.map(m => m.score || 0)
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    const highScoreCount = scores.filter(s => s >= 70).length
    const highScoreRate = Math.round((highScoreCount / scores.length) * 100)

    // 7. 개선 제안
    const recommendations: string[] = []

    if (avgScore < 50) {
      recommendations.push('프로필 정보를 더 상세하게 작성하면 매칭 점수가 올라갈 수 있어요')
    }
    if (highScoreRate < 30) {
      recommendations.push('자격조건이 맞는 공고 위주로 지원하면 선정 확률이 높아져요')
    }
    if (categoryScores.length > 0 && categoryScores[0].avgScore > avgScore + 10) {
      recommendations.push(`"${categoryScores[0].category}" 분야 공고가 회사와 잘 맞아요`)
    }
    if (topSuccessFactors.length > 0 && topSuccessFactors[0].avgContribution < 50) {
      recommendations.push(`${topSuccessFactors[topSuccessFactors.length - 1].factor} 조건을 개선해 보세요`)
    }

    if (recommendations.length === 0) {
      recommendations.push('좋은 매칭률을 유지하고 있어요! 계속해서 적합한 공고를 찾아보세요')
    }

    const insight: SuccessInsight = {
      scoreDistribution,
      topSuccessFactors,
      categoryScores,
      organizationScores,
      hourlyPattern,
      summary: {
        totalMatches: matches.length,
        avgScore,
        highScoreRate,
        topCategory: categoryScores[0]?.category || '-',
        topOrganization: organizationScores[0]?.organization || '-',
      },
      recommendations,
    }

    return NextResponse.json<InsightsResponse>({
      success: true,
      data: insight,
    })
  } catch (error) {
    console.error('인사이트 분석 오류:', error)
    return NextResponse.json<InsightsResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : '인사이트 분석에 실패했어요',
      },
      { status: 500 }
    )
  }
}
