export * from './database'

// Announcement types
export interface Announcement {
  id: string
  source: 'narajangteo' | 'bizinfo' | 'kstartup' | 'datagoKr'
  sourceId: string
  title: string
  organization: string | null
  category: string | null
  supportType: string | null
  targetCompany: string | null
  supportAmount: string | null
  applicationStart: Date | null
  applicationEnd: Date | null
  content: string | null
  attachmentUrls: string[]
  parsedContent: string | null
  status: 'active' | 'closed'
  createdAt: Date
}

// Company types
export interface Company {
  id: string
  userId: string
  name: string
  businessNumber: string | null
  industry: string | null
  employeeCount: number | null
  foundedDate: Date | null
  location: string | null
  certifications: Certification[]
  annualRevenue: number | null
  description: string | null
}

export type Certification =
  | 'venture'
  | 'innobiz'
  | 'mainbiz'
  | 'womanEnterprise'
  | 'socialEnterprise'
  | 'researchInstitute'

// Matching types
export interface MatchResult {
  id: string
  announcementId: string
  announcement: Announcement
  matchScore: number
  analysis: MatchAnalysis
}

// 1단계: 자격 조건 체크
export interface EligibilityCheck {
  isEligible: boolean           // 최종 자격 여부
  checks: {
    industry: {                 // 업종 조건
      passed: boolean
      requirement: string       // 공고 요구사항
      companyValue: string      // 기업 현황
      reason: string
    }
    region: {                   // 지역 조건
      passed: boolean
      requirement: string
      companyValue: string
      reason: string
    }
    companyAge: {               // 업력 조건
      passed: boolean
      requirement: string
      companyValue: string
      reason: string
    }
    revenue: {                  // 매출 조건
      passed: boolean
      requirement: string
      companyValue: string
      reason: string
    }
    employeeCount: {            // 직원수 조건
      passed: boolean
      requirement: string
      companyValue: string
      reason: string
    }
  }
  failedReasons: string[]       // 불합격 사유 목록
}

// 2단계: 적합도 점수
export interface MatchAnalysis {
  // 1단계: 자격 조건
  eligibility: EligibilityCheck

  // 2단계: 적합도 점수 (자격 조건 통과 시에만 유효)
  overallScore: number          // 0-100 종합 점수
  technicalScore: number        // 0-25 기술성 (기존 30 → 25)
  marketScore: number           // 0-20 시장성 (기존 25 → 20)
  businessScore: number         // 0-20 사업성 (기존 25 → 20)
  fitScore: number              // 0-25 공고부합도 (신규)
  bonusPoints: number           // 0-10 가점 (기존 20 → 10)

  // 분석 내용
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
}

// Payment types
export type PaymentMethod = 'toss' | 'kakao' | 'naver'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled'

export interface Payment {
  id: string
  userId: string
  amount: number
  paymentMethod: PaymentMethod
  paymentKey: string | null
  orderId: string
  status: PaymentStatus
  createdAt: Date
}

// Subscription types
export type SubscriptionPlan = 'free' | 'pro'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired'

export interface Subscription {
  id: string
  userId: string
  plan: SubscriptionPlan
  billingKey: string | null
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Filter types for announcements
export interface AnnouncementFilters {
  source?: string[]
  category?: string[]
  supportType?: string[]
  status?: string
  search?: string
  page?: number
  limit?: number
}

// 지원자격 상세 파싱 결과
export interface EligibilityCriteria {
  // 기업 유형
  companyTypes: string[]          // 중소기업, 스타트업, 소상공인, 중견기업 등

  // 규모 조건
  employeeCount: {
    min: number | null            // 최소 직원수
    max: number | null            // 최대 직원수
    description: string           // 원문 설명 (예: "상시근로자 5인 이상")
  } | null

  revenue: {
    min: number | null            // 최소 매출 (원)
    max: number | null            // 최대 매출 (원)
    description: string           // 원문 설명 (예: "연매출 100억 이하")
  } | null

  // 업력 조건
  businessAge: {
    min: number | null            // 최소 업력 (년)
    max: number | null            // 최대 업력 (년)
    description: string           // 원문 설명 (예: "창업 7년 이내")
  } | null

  // 업종 조건
  industries: {
    included: string[]            // 지원 가능 업종
    excluded: string[]            // 지원 불가 업종
    description: string
  }

  // 지역 조건
  regions: {
    included: string[]            // 지원 가능 지역
    excluded: string[]            // 지원 불가 지역
    description: string
  }

  // 필요 인증/자격
  requiredCertifications: string[]  // 벤처인증, ISO, 이노비즈 등

  // 기타 조건
  additionalRequirements: string[]  // 기타 지원 조건

  // 지원 제외 대상
  exclusions: string[]              // 지원 불가 대상

  // 원문 요약
  summary: string                   // 지원자격 요약 (1-2문장)

  // 파싱 메타데이터
  confidence: number                // 파싱 신뢰도 (0-1)
  parsedAt: string                  // 파싱 시각
}
