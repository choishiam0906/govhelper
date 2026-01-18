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
