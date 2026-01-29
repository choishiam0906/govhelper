/**
 * 추천 공고 필터링 및 점수 계산 로직
 *
 * 점수 배분 (총 100점):
 * - 업종 일치: 30점 (핵심 조건)
 * - 지역 일치: 20점 (전국이면 자동 통과)
 * - 직원수 범위: 15점
 * - 매출 범위: 15점
 * - 업력 범위: 10점
 * - 인증 보유: 10점
 *
 * 가산점:
 * - 마감 7일 이내: +5점
 */

import {
  CompanyInfo,
  AnnouncementForRecommendation,
  RecommendationResult,
  MatchedCriterion,
  ScoreBreakdown,
  EligibilityCriteriaDB
} from './types'
import {
  isIndustryMatch,
  isRegionMatch,
  isIndustryExcluded,
  isRegionExcluded,
  hasCertificationMatch,
  nationwideKeywords
} from './mappings'
import { BehaviorSignals, calculateBehaviorScore } from './behavior-score'

// 점수 가중치
const WEIGHTS = {
  industry: 30,
  region: 20,
  employeeCount: 15,
  revenue: 15,
  businessAge: 10,
  certification: 10
}

/**
 * 회사 업력 계산 (년)
 */
function calculateBusinessAge(foundedDate: string | null): number | null {
  if (!foundedDate) return null

  const founded = new Date(foundedDate)
  const now = new Date()
  const diffYears = (now.getTime() - founded.getTime()) / (1000 * 60 * 60 * 24 * 365)
  return Math.floor(diffYears)
}

/**
 * 마감일까지 남은 일수 계산
 */
function getDaysUntilDeadline(applicationEnd: string | null): number | null {
  if (!applicationEnd) return null

  const deadline = new Date(applicationEnd)
  const now = new Date()
  const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * 숫자 범위 체크
 */
function isInRange(
  value: number | null,
  min: number | null,
  max: number | null
): { inRange: boolean; reason: string } {
  if (value === null) {
    return { inRange: true, reason: '정보 없음 (통과 처리)' }
  }

  if (min === null && max === null) {
    return { inRange: true, reason: '제한 없음' }
  }

  if (min !== null && value < min) {
    return { inRange: false, reason: `최소 ${min} 이상 필요` }
  }

  if (max !== null && value > max) {
    return { inRange: false, reason: `최대 ${max} 이하 필요` }
  }

  return { inRange: true, reason: '조건 충족' }
}

/**
 * 단일 공고에 대한 점수 계산
 */
function calculateScore(
  announcement: AnnouncementForRecommendation,
  company: CompanyInfo
): { result: RecommendationResult; excluded: boolean } | null {
  const criteria = announcement.eligibility_criteria
  if (!criteria) {
    return null // eligibility_criteria가 없으면 제외
  }

  const matchedCriteria: MatchedCriterion[] = []
  const breakdown: ScoreBreakdown = {
    industry: 0,
    region: 0,
    employeeCount: 0,
    revenue: 0,
    businessAge: 0,
    certification: 0,
    bonus: 0,
    behavior: 0,
    total: 0
  }

  // 1. 업종 체크 (30점)
  const industryIncluded = criteria.industries?.included || []
  const industryExcluded = criteria.industries?.excluded || []

  // 제외 업종에 해당하면 완전 제외
  if (isIndustryExcluded(company.industry, industryExcluded)) {
    return { result: null as unknown as RecommendationResult, excluded: true }
  }

  const industryMatched = industryIncluded.length === 0 ||
    isIndustryMatch(company.industry, industryIncluded)

  if (industryMatched) {
    breakdown.industry = WEIGHTS.industry
    matchedCriteria.push({
      name: '업종',
      matched: true,
      points: WEIGHTS.industry,
      maxPoints: WEIGHTS.industry,
      reason: industryIncluded.length === 0 ? '제한 없음' : '업종 조건 충족'
    })
  } else {
    matchedCriteria.push({
      name: '업종',
      matched: false,
      points: 0,
      maxPoints: WEIGHTS.industry,
      reason: `대상 업종: ${industryIncluded.slice(0, 3).join(', ')}...`
    })
  }

  // 2. 지역 체크 (20점)
  const regionIncluded = criteria.regions?.included || []
  const regionExcluded = criteria.regions?.excluded || []

  // 제외 지역에 해당하면 완전 제외
  if (isRegionExcluded(company.location, regionExcluded)) {
    return { result: null as unknown as RecommendationResult, excluded: true }
  }

  // 전국이면 자동 통과
  const isNationwide = regionIncluded.some(r =>
    nationwideKeywords.some(kw => r.includes(kw))
  )

  const regionMatched = regionIncluded.length === 0 ||
    isNationwide ||
    isRegionMatch(company.location, regionIncluded)

  if (regionMatched) {
    breakdown.region = WEIGHTS.region
    matchedCriteria.push({
      name: '지역',
      matched: true,
      points: WEIGHTS.region,
      maxPoints: WEIGHTS.region,
      reason: isNationwide ? '전국 대상' : (regionIncluded.length === 0 ? '제한 없음' : '지역 조건 충족')
    })
  } else {
    matchedCriteria.push({
      name: '지역',
      matched: false,
      points: 0,
      maxPoints: WEIGHTS.region,
      reason: `대상 지역: ${regionIncluded.slice(0, 3).join(', ')}`
    })
  }

  // 3. 직원수 체크 (15점)
  const empCriteria = criteria.employeeCount
  const empCheck = isInRange(
    company.employeeCount,
    empCriteria?.min ?? null,
    empCriteria?.max ?? null
  )

  if (empCheck.inRange) {
    breakdown.employeeCount = WEIGHTS.employeeCount
    matchedCriteria.push({
      name: '직원수',
      matched: true,
      points: WEIGHTS.employeeCount,
      maxPoints: WEIGHTS.employeeCount,
      reason: empCheck.reason
    })
  } else {
    matchedCriteria.push({
      name: '직원수',
      matched: false,
      points: 0,
      maxPoints: WEIGHTS.employeeCount,
      reason: empCheck.reason
    })
  }

  // 4. 매출 체크 (15점)
  const revCriteria = criteria.revenue
  // 매출은 만원 단위로 저장되어 있고, eligibility_criteria는 원 단위일 수 있음
  const companyRevenueInWon = company.annualRevenue ? company.annualRevenue * 10000 : null
  const revCheck = isInRange(
    companyRevenueInWon,
    revCriteria?.min ?? null,
    revCriteria?.max ?? null
  )

  if (revCheck.inRange) {
    breakdown.revenue = WEIGHTS.revenue
    matchedCriteria.push({
      name: '매출',
      matched: true,
      points: WEIGHTS.revenue,
      maxPoints: WEIGHTS.revenue,
      reason: revCheck.reason
    })
  } else {
    matchedCriteria.push({
      name: '매출',
      matched: false,
      points: 0,
      maxPoints: WEIGHTS.revenue,
      reason: revCheck.reason
    })
  }

  // 5. 업력 체크 (10점)
  const ageCriteria = criteria.businessAge
  const companyAge = calculateBusinessAge(company.foundedDate)
  const ageCheck = isInRange(
    companyAge,
    ageCriteria?.min ?? null,
    ageCriteria?.max ?? null
  )

  if (ageCheck.inRange) {
    breakdown.businessAge = WEIGHTS.businessAge
    matchedCriteria.push({
      name: '업력',
      matched: true,
      points: WEIGHTS.businessAge,
      maxPoints: WEIGHTS.businessAge,
      reason: ageCheck.reason
    })
  } else {
    matchedCriteria.push({
      name: '업력',
      matched: false,
      points: 0,
      maxPoints: WEIGHTS.businessAge,
      reason: ageCheck.reason
    })
  }

  // 6. 인증 체크 (10점)
  const requiredCerts = criteria.requiredCertifications || []
  const certMatched = hasCertificationMatch(company.certifications, requiredCerts)

  if (certMatched) {
    breakdown.certification = WEIGHTS.certification
    matchedCriteria.push({
      name: '인증',
      matched: true,
      points: WEIGHTS.certification,
      maxPoints: WEIGHTS.certification,
      reason: requiredCerts.length === 0 ? '필수 인증 없음' : '필수 인증 보유'
    })
  } else {
    matchedCriteria.push({
      name: '인증',
      matched: false,
      points: 0,
      maxPoints: WEIGHTS.certification,
      reason: `필수 인증: ${requiredCerts.slice(0, 2).join(', ')}`
    })
  }

  // 7. 가산점: 마감 임박 (7일 이내 +5점)
  const daysLeft = getDaysUntilDeadline(announcement.application_end)
  if (daysLeft !== null && daysLeft > 0 && daysLeft <= 7) {
    breakdown.bonus = 5
    matchedCriteria.push({
      name: '마감임박',
      matched: true,
      points: 5,
      maxPoints: 5,
      reason: `D-${daysLeft}`
    })
  }

  // 총점 계산
  breakdown.total =
    breakdown.industry +
    breakdown.region +
    breakdown.employeeCount +
    breakdown.revenue +
    breakdown.businessAge +
    breakdown.certification +
    breakdown.behavior +
    breakdown.bonus

  // 결과 생성
  const result: RecommendationResult = {
    announcement: {
      id: announcement.id,
      title: announcement.title,
      organization: announcement.organization,
      category: announcement.category,
      supportType: announcement.support_type,
      supportAmount: announcement.support_amount,
      applicationEnd: announcement.application_end
    },
    matchedCriteria,
    score: breakdown.total,
    scoreBreakdown: breakdown
  }

  return { result, excluded: false }
}

/**
 * 공고 목록을 회사 정보 기반으로 필터링하고 점수순 정렬
 */
export function filterAndScoreAnnouncements(
  announcements: AnnouncementForRecommendation[],
  company: CompanyInfo,
  options?: {
    minScore?: number    // 최소 점수 (기본: 50)
    limit?: number       // 최대 개수 (기본: 10)
    behaviorSignals?: BehaviorSignals  // 행동 기반 신호
  }
): RecommendationResult[] {
  const minScore = options?.minScore ?? 50
  const limit = options?.limit ?? 10

  const results: RecommendationResult[] = []

  for (const announcement of announcements) {
    const calculated = calculateScore(announcement, company)

    // null이면 eligibility_criteria 없음
    if (!calculated) continue

    // excluded면 제외 업종/지역에 해당
    if (calculated.excluded) continue

    // 행동 기반 점수 적용
    if (options?.behaviorSignals) {
      const behaviorScore = calculateBehaviorScore(
        { category: announcement.category, organization: announcement.organization, id: announcement.id },
        options.behaviorSignals
      )
      // 이미 상호작용한 공고는 건너뛰기
      if (behaviorScore < 0) continue
      calculated.result.scoreBreakdown.behavior = behaviorScore
      calculated.result.scoreBreakdown.total += behaviorScore
      calculated.result.score += behaviorScore
    }

    // 최소 점수 미만이면 제외
    if (calculated.result.score < minScore) continue

    results.push(calculated.result)
  }

  // 점수순 정렬 (높은 순)
  results.sort((a, b) => b.score - a.score)

  // 개수 제한
  return results.slice(0, limit)
}

/**
 * 점수 등급 반환
 */
export function getScoreGrade(score: number): {
  grade: string
  color: string
  description: string
} {
  if (score >= 90) {
    return { grade: '최적합', color: 'green', description: '거의 모든 조건이 일치해요' }
  }
  if (score >= 75) {
    return { grade: '적합', color: 'blue', description: '대부분의 조건이 일치해요' }
  }
  if (score >= 60) {
    return { grade: '양호', color: 'yellow', description: '주요 조건이 일치해요' }
  }
  return { grade: '보통', color: 'gray', description: '일부 조건이 일치해요' }
}
