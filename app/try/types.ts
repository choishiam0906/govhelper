/**
 * 비회원 매칭 폼 타입 정의
 */

export type Step = 1 | 2 | 3 | 4

export interface FormData {
  businessNumber: string
  companyName: string
  industry: string
  employeeCount: string
  location: string
  annualRevenue: string
  foundedDate: string
  certifications: string[]
  email: string
}

// 통합 조회 결과 타입 (unified-lookup API 응답)
export interface UnifiedLookupResult {
  success: boolean
  data?: {
    businessNumber: string
    companyName: string
    companyNameEng: string | null
    ceoName: string | null
    address: string | null
    location: string
    industryCode: string | null
    employeeCount: number | null
    establishedDate: string | null
    businessType: string | null      // 업태 (대분류)
    industryName: string | null      // 종목 (세세분류)
    companySize: string              // 기업규모
    corporationType: string          // 법인형태
    homepage: string | null
    phone: string | null
    ntsStatus: string | null
    taxType: string | null
    stockCode: string | null
    stockMarket: string
    sources: string[]
  }
  error?: string
}
