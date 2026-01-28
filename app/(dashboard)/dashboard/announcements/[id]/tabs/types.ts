// 공고 상세 페이지 탭 컴포넌트에서 사용하는 공통 타입

export interface EligibilityCriteria {
  companyTypes: string[]
  employeeCount: { min: number | null; max: number | null; description: string } | null
  revenue: { min: number | null; max: number | null; description: string } | null
  businessAge: { min: number | null; max: number | null; description: string } | null
  industries: { included: string[]; excluded: string[]; description: string }
  regions: { included: string[]; excluded: string[]; description: string }
  requiredCertifications: string[]
  additionalRequirements: string[]
  exclusions: string[]
  summary: string
  confidence: number
  parsedAt: string
}

export interface Announcement {
  id: string
  title: string
  organization: string | null
  category: string | null
  support_type: string | null
  target_company: string | null
  support_amount: string | null
  application_start: string | null
  application_end: string | null
  content: string | null
  parsed_content: string | null
  attachment_urls: string[] | null
  eligibility_criteria: EligibilityCriteria | null
  evaluation_criteria: any | null
  source: string
  status: string
  created_at: string
}
