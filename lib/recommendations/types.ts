/**
 * 추천 공고 시스템 타입 정의
 */

// 회사 정보 (필터링에 사용)
export interface CompanyInfo {
  industry: string | null
  location: string | null
  employeeCount: number | null
  annualRevenue: number | null
  foundedDate: string | null
  certifications: string[] | null
}

// 공고 정보 (DB에서 조회)
export interface AnnouncementForRecommendation {
  id: string
  title: string
  organization: string | null
  category: string | null
  support_type: string | null
  support_amount: string | null
  application_end: string | null
  eligibility_criteria: EligibilityCriteriaDB | null
}

// DB에서 조회한 eligibility_criteria 구조
export interface EligibilityCriteriaDB {
  companyTypes?: string[]
  employeeCount?: {
    min: number | null
    max: number | null
    description?: string
  } | null
  revenue?: {
    min: number | null
    max: number | null
    description?: string
  } | null
  businessAge?: {
    min: number | null
    max: number | null
    description?: string
  } | null
  industries?: {
    included: string[]
    excluded: string[]
    description?: string
  }
  regions?: {
    included: string[]
    excluded: string[]
    description?: string
  }
  requiredCertifications?: string[]
  additionalRequirements?: string[]
  exclusions?: string[]
  summary?: string
  confidence?: number
  parsedAt?: string
}

// 추천 결과
export interface RecommendationResult {
  announcement: {
    id: string
    title: string
    organization: string | null
    category: string | null
    supportType: string | null
    supportAmount: string | null
    applicationEnd: string | null
  }
  matchedCriteria: MatchedCriterion[]
  score: number
  scoreBreakdown: ScoreBreakdown
}

// 일치한 조건
export interface MatchedCriterion {
  name: string
  matched: boolean
  points: number
  maxPoints: number
  reason: string
}

// 점수 상세 내역
export interface ScoreBreakdown {
  industry: number      // 0-30점
  region: number        // 0-20점
  employeeCount: number // 0-15점
  revenue: number       // 0-15점
  businessAge: number   // 0-10점
  certification: number // 0-10점
  bonus: number         // 가산점 (마감 임박 등)
  behavior: number      // 0-30점 (행동 기반)
  total: number         // 총점
}

// API 응답
export interface RecommendationsResponse {
  success: boolean
  data?: {
    recommendations: RecommendationResult[]
    companyInfo: {
      name: string
      industry: string | null
      location: string | null
    }
    totalMatched: number
  }
  error?: string
  requiredPlan?: string
}
