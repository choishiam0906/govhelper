/**
 * 경쟁률 예측 로직
 *
 * 유사 공고 분석 + 휴리스틱 기반 예측
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  CompetitionPrediction,
  CompetitionLevel,
  CompetitionFactor,
  SimilarAnnouncementAnalysis,
} from '@/types/competition'

// 인기 기관 (경쟁률 높음)
const POPULAR_ORGANIZATIONS = [
  '중소벤처기업부', '중소기업청', '과학기술정보통신부', '산업통상자원부',
  '고용노동부', '문화체육관광부', '창업진흥원', '중소벤처기업진흥공단',
  '한국산업기술진흥원', '정보통신산업진흥원', '한국콘텐츠진흥원',
]

// 인기 카테고리 (경쟁률 높음)
const POPULAR_CATEGORIES = [
  'R&D', '연구개발', '창업', '스타트업', '기술개발', '사업화',
  '수출', '해외진출', '고용', '일자리',
]

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

// 자격조건 느슨함 점수 (높을수록 경쟁률 높음)
function getEligibilityOpenness(eligibility: any): number {
  if (!eligibility) return 50 // 정보 없으면 중간

  let score = 50

  // 기업 유형이 넓으면 점수 증가
  if (eligibility.companyTypes?.length > 2) score += 10

  // 직원수 제한이 없거나 넓으면 점수 증가
  if (!eligibility.employeeCount || !eligibility.employeeCount.max) score += 10
  else if (eligibility.employeeCount.max >= 300) score += 5

  // 매출 제한이 없거나 넓으면 점수 증가
  if (!eligibility.revenue || !eligibility.revenue.max) score += 10

  // 업력 제한이 없거나 넓으면 점수 증가
  if (!eligibility.businessAge || !eligibility.businessAge.max) score += 5
  else if (eligibility.businessAge.max >= 7) score += 3

  // 지역 제한이 없으면 점수 증가
  if (!eligibility.regions?.included?.length ||
      eligibility.regions.included.includes('전국')) {
    score += 10
  }

  // 필수 인증이 없으면 점수 증가
  if (!eligibility.requiredCertifications?.length) score += 5

  return Math.min(100, score)
}

// 경쟁률 등급 결정
function determineLevel(score: number): CompetitionLevel {
  if (score >= 80) return 'very_high'
  if (score >= 65) return 'high'
  if (score >= 45) return 'medium'
  if (score >= 25) return 'low'
  return 'very_low'
}

// 예상 경쟁률 계산
function estimateRatio(score: number): number {
  if (score >= 80) return 12 + (score - 80) * 0.3 // 12~18:1
  if (score >= 65) return 7 + (score - 65) * 0.33 // 7~12:1
  if (score >= 45) return 4 + (score - 45) * 0.15 // 4~7:1
  if (score >= 25) return 2 + (score - 25) * 0.1 // 2~4:1
  return 1 + score * 0.04 // 1~2:1
}

// 조언 생성
function generateTips(factors: CompetitionFactor[], level: CompetitionLevel): string[] {
  const tips: string[] = []

  // 경쟁률 등급별 기본 조언
  if (level === 'very_high' || level === 'high') {
    tips.push('지원서에서 회사만의 차별화된 강점을 부각하세요')
    tips.push('평가기준에 맞춰 구체적인 수치와 성과를 제시하세요')
  }

  if (level === 'medium') {
    tips.push('기본적인 자격요건을 꼼꼼히 확인하세요')
    tips.push('제출 서류를 마감 전 미리 준비하세요')
  }

  if (level === 'very_low' || level === 'low') {
    tips.push('경쟁이 낮아도 기본 요건은 충족해야 해요')
    tips.push('이 기회를 놓치지 말고 빠르게 지원하세요')
  }

  // 요인별 조언
  factors.forEach(factor => {
    if (factor.name === '지원금액' && factor.impact === 'negative') {
      tips.push('지원금액이 높아 관심도가 높을 거예요. 사업 타당성을 충분히 설명하세요')
    }
    if (factor.name === '마감 임박' && factor.impact === 'positive') {
      tips.push('마감이 임박해 경쟁이 낮을 수 있어요. 서둘러 지원하세요')
    }
    if (factor.name === '자격조건') {
      if (factor.impact === 'negative') {
        tips.push('자격조건이 넓어 많은 기업이 지원할 수 있어요')
      } else {
        tips.push('자격조건이 까다로워 경쟁자가 적을 수 있어요')
      }
    }
  })

  // 중복 제거 후 최대 5개
  return [...new Set(tips)].slice(0, 5)
}

/**
 * 경쟁률 예측
 */
export async function predictCompetition(
  supabase: SupabaseClient,
  announcementId: string
): Promise<CompetitionPrediction> {
  // 공고 정보 조회
  const { data: announcement, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', announcementId)
    .single()

  if (error || !announcement) {
    throw new Error('공고를 찾을 수 없어요')
  }

  const factors: CompetitionFactor[] = []
  let totalScore = 50 // 기본 점수

  // 1. 기관 인기도
  const isPopularOrg = POPULAR_ORGANIZATIONS.some(org =>
    announcement.organization?.includes(org)
  )
  if (isPopularOrg) {
    factors.push({
      name: '인기 기관',
      impact: 'negative',
      weight: 15,
      description: `${announcement.organization}은(는) 인기 있는 지원기관이에요`,
    })
    totalScore += 15
  } else if (announcement.organization) {
    factors.push({
      name: '기관',
      impact: 'neutral',
      weight: 5,
      description: '일반적인 지원기관이에요',
    })
  }

  // 2. 카테고리 인기도
  const isPopularCategory = POPULAR_CATEGORIES.some(cat =>
    announcement.category?.includes(cat) || announcement.title?.includes(cat)
  )
  if (isPopularCategory) {
    factors.push({
      name: '인기 분야',
      impact: 'negative',
      weight: 10,
      description: 'R&D, 창업 등 인기 분야에요',
    })
    totalScore += 10
  }

  // 3. 지원금액
  const amount = parseAmount(announcement.support_amount)
  if (amount >= 500000000) { // 5억 이상
    factors.push({
      name: '지원금액',
      impact: 'negative',
      weight: 20,
      description: '지원금액이 높아 관심도가 높아요',
    })
    totalScore += 20
  } else if (amount >= 100000000) { // 1억 이상
    factors.push({
      name: '지원금액',
      impact: 'negative',
      weight: 12,
      description: '지원금액이 적지 않아요',
    })
    totalScore += 12
  } else if (amount >= 30000000) { // 3천만원 이상
    factors.push({
      name: '지원금액',
      impact: 'neutral',
      weight: 5,
      description: '적정 수준의 지원금액이에요',
    })
    totalScore += 5
  } else if (amount > 0) {
    factors.push({
      name: '지원금액',
      impact: 'positive',
      weight: -5,
      description: '지원금액이 적은 편이에요',
    })
    totalScore -= 5
  }

  // 4. 마감일
  if (announcement.application_end) {
    const daysLeft = Math.ceil(
      (new Date(announcement.application_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    if (daysLeft <= 3) {
      factors.push({
        name: '마감 임박',
        impact: 'positive',
        weight: -15,
        description: '마감이 임박해 경쟁이 줄어들 수 있어요',
      })
      totalScore -= 15
    } else if (daysLeft <= 7) {
      factors.push({
        name: '마감 임박',
        impact: 'positive',
        weight: -8,
        description: '마감이 얼마 남지 않았어요',
      })
      totalScore -= 8
    } else if (daysLeft >= 30) {
      factors.push({
        name: '충분한 기간',
        impact: 'negative',
        weight: 5,
        description: '접수 기간이 충분해 많은 기업이 준비할 수 있어요',
      })
      totalScore += 5
    }
  }

  // 5. 자격조건 (eligibility_criteria)
  const eligibility = announcement.eligibility_criteria
  const opennessScore = getEligibilityOpenness(eligibility)
  if (opennessScore >= 70) {
    factors.push({
      name: '자격조건',
      impact: 'negative',
      weight: 15,
      description: '자격조건이 넓어 많은 기업이 지원 가능해요',
    })
    totalScore += 15
  } else if (opennessScore <= 40) {
    factors.push({
      name: '자격조건',
      impact: 'positive',
      weight: -10,
      description: '자격조건이 까다로워요',
    })
    totalScore -= 10
  } else {
    factors.push({
      name: '자격조건',
      impact: 'neutral',
      weight: 0,
      description: '일반적인 자격조건이에요',
    })
  }

  // 유사 공고 분석
  const { data: similarAnnouncements } = await supabase
    .from('announcements')
    .select('id, organization, category, support_amount')
    .neq('id', announcementId)
    .or(`organization.eq.${announcement.organization},category.eq.${announcement.category}`)
    .limit(20)

  const similarAnalysis: SimilarAnnouncementAnalysis = {
    count: similarAnnouncements?.length || 0,
    announcementIds: similarAnnouncements?.map(a => a.id) || [],
    sameOrgCount: similarAnnouncements?.filter(a => a.organization === announcement.organization).length || 0,
    sameCategoryCount: similarAnnouncements?.filter(a => a.category === announcement.category).length || 0,
  }

  // 유사 공고 평균 지원금액
  if (similarAnnouncements?.length) {
    const amounts = similarAnnouncements
      .map(a => parseAmount(a.support_amount))
      .filter(a => a > 0)
    if (amounts.length > 0) {
      similarAnalysis.avgSupportAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
    }
  }

  // 점수 보정 (0-100 범위)
  totalScore = Math.max(0, Math.min(100, totalScore))

  // 등급 및 예상 경쟁률 결정
  const level = determineLevel(totalScore)
  const estimatedRatio = estimateRatio(totalScore)

  // 신뢰도 계산 (요인 수, 유사 공고 수 기반)
  let confidence = 50
  if (factors.length >= 4) confidence += 15
  if (similarAnalysis.count >= 5) confidence += 10
  if (eligibility) confidence += 15
  if (announcement.organization) confidence += 5
  if (announcement.category) confidence += 5
  confidence = Math.min(95, confidence)

  // 조언 생성
  const tips = generateTips(factors, level)

  return {
    level,
    estimatedRatio: Math.round(estimatedRatio * 10) / 10,
    confidence,
    score: totalScore,
    factors,
    similarAnalysis,
    tips,
  }
}
