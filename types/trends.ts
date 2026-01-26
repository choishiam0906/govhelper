/**
 * 지원사업 트렌드 분석 타입 정의
 */

// 월별 공고 현황
export interface MonthlyTrend {
  month: string // YYYY-MM
  count: number
  totalAmount: number
  avgAmount: number
}

// 카테고리별 현황
export interface CategoryTrend {
  category: string
  count: number
  percentage: number
  growth: number // 전월 대비 성장률
}

// 지역별 현황
export interface RegionTrend {
  region: string
  count: number
  percentage: number
}

// 기관별 현황
export interface OrganizationTrend {
  organization: string
  count: number
  avgAmount: number
}

// 지원유형별 현황
export interface SupportTypeTrend {
  type: string
  count: number
  percentage: number
}

// 전체 트렌드 분석 결과
export interface TrendsAnalysis {
  // 월별 추이 (최근 6개월)
  monthlyTrends: MonthlyTrend[]
  // 인기 카테고리 (상위 10개)
  topCategories: CategoryTrend[]
  // 인기 지역 (상위 10개)
  topRegions: RegionTrend[]
  // 활발한 기관 (상위 10개)
  topOrganizations: OrganizationTrend[]
  // 지원유형 분포
  supportTypes: SupportTypeTrend[]
  // 요약 통계
  summary: {
    totalAnnouncements: number
    activeAnnouncements: number
    avgSupportAmount: number
    medianSupportAmount: number
    mostPopularCategory: string
    mostActiveOrganization: string
  }
  // 분석 기준일
  analyzedAt: string
}

// API 응답
export interface TrendsResponse {
  success: boolean
  data?: TrendsAnalysis
  error?: string
}
