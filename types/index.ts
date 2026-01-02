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

export interface MatchAnalysis {
  overallScore: number
  technicalScore: number
  marketScore: number
  businessScore: number
  bonusPoints: number
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
export type SubscriptionPlan = 'free' | 'pro' | 'enterprise'
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
