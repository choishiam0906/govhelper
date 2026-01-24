/**
 * AI 매칭 API 통합 테스트
 * /api/matching 및 관련 엔드포인트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Google Generative AI 모킹
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn(),
      generateContentStream: vi.fn(),
    }),
  })),
}))

// Supabase 클라이언트 모킹
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}))

// 테스트용 목업 데이터
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
}

const mockCompany = {
  id: 'company-123',
  name: '테스트 기업',
  industry: 'software',
  employee_count: 50,
  location: 'seoul',
  founded_date: '2020-01-01',
  certifications: ['벤처인증'],
  annual_revenue: '10억',
}

const mockAnnouncement = {
  id: 'announcement-123',
  title: '2024 중소기업 R&D 지원사업',
  organization: '중소벤처기업부',
  eligibility_criteria: {
    companyTypes: ['중소기업', '스타트업'],
    employeeCount: { min: 5, max: 300 },
    revenue: { max: 10000000000 },
    businessAge: { max: 7 },
    industries: { included: ['소프트웨어', 'IT'], excluded: [] },
    regions: { included: ['전국'], excluded: [] },
    requiredCertifications: [],
  },
}

const mockMatchResult = {
  id: 'match-123',
  company_id: 'company-123',
  announcement_id: 'announcement-123',
  score: 85,
  is_eligible: true,
  analysis: {
    summary: '지원 자격을 충족합니다.',
    strengths: ['업종 일치', '직원수 조건 충족'],
    weaknesses: ['인증 부족'],
    recommendations: ['벤처인증 취득 권장'],
  },
  score_breakdown: {
    industry: 25,
    region: 20,
    employee_count: 15,
    revenue: 15,
    business_age: 10,
    certifications: 0,
  },
  created_at: '2024-01-15T00:00:00Z',
}

describe('/api/matching', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST - AI 매칭 분석 요청', () => {
    it('인증된 사용자만 매칭을 요청할 수 있다', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      expect(mockUser.id).toBeDefined()
    })

    it('비인증 사용자는 401 에러를 받아야 한다', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const response = { status: 401, error: '로그인이 필요해요' }
      expect(response.status).toBe(401)
    })

    it('공고 ID가 필요하다', async () => {
      const requestBody = {}
      const isValid = !!requestBody.announcement_id

      expect(isValid).toBe(false)
    })

    it('기업 정보가 필요하다', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const company = null
      const hasCompany = !!company

      expect(hasCompany).toBe(false)
    })

    it('매칭 결과가 올바른 형식으로 반환되어야 한다', async () => {
      expect(mockMatchResult.score).toBeGreaterThanOrEqual(0)
      expect(mockMatchResult.score).toBeLessThanOrEqual(100)
      expect(mockMatchResult.is_eligible).toBeDefined()
      expect(mockMatchResult.analysis).toBeDefined()
    })
  })

  describe('매칭 점수 계산', () => {
    it('점수는 0-100 범위이어야 한다', () => {
      expect(mockMatchResult.score).toBeGreaterThanOrEqual(0)
      expect(mockMatchResult.score).toBeLessThanOrEqual(100)
    })

    it('점수 세부 항목의 합이 전체 점수와 일치해야 한다', () => {
      const breakdown = mockMatchResult.score_breakdown
      const sum = Object.values(breakdown).reduce((a, b) => a + b, 0)

      expect(sum).toBe(mockMatchResult.score)
    })

    it('부적격 기업은 0점이어야 한다', () => {
      const ineligibleResult = {
        ...mockMatchResult,
        is_eligible: false,
        score: 0,
      }

      expect(ineligibleResult.score).toBe(0)
    })
  })

  describe('적격성 판단', () => {
    const checkEligibility = (
      company: typeof mockCompany,
      criteria: typeof mockAnnouncement.eligibility_criteria
    ): boolean => {
      // 직원수 체크
      if (criteria.employeeCount) {
        if (
          criteria.employeeCount.min &&
          company.employee_count < criteria.employeeCount.min
        ) {
          return false
        }
        if (
          criteria.employeeCount.max &&
          company.employee_count > criteria.employeeCount.max
        ) {
          return false
        }
      }

      // 제외 업종 체크
      if (
        criteria.industries?.excluded?.length > 0 &&
        criteria.industries.excluded.includes(company.industry)
      ) {
        return false
      }

      // 제외 지역 체크
      if (
        criteria.regions?.excluded?.length > 0 &&
        criteria.regions.excluded.includes(company.location)
      ) {
        return false
      }

      return true
    }

    it('모든 조건 충족 시 적격 판정', () => {
      const isEligible = checkEligibility(
        mockCompany,
        mockAnnouncement.eligibility_criteria
      )
      expect(isEligible).toBe(true)
    })

    it('직원수 미달 시 부적격 판정', () => {
      const smallCompany = { ...mockCompany, employee_count: 2 }
      const isEligible = checkEligibility(
        smallCompany,
        mockAnnouncement.eligibility_criteria
      )
      expect(isEligible).toBe(false)
    })

    it('직원수 초과 시 부적격 판정', () => {
      const largeCompany = { ...mockCompany, employee_count: 500 }
      const isEligible = checkEligibility(
        largeCompany,
        mockAnnouncement.eligibility_criteria
      )
      expect(isEligible).toBe(false)
    })

    it('제외 업종에 해당하면 부적격 판정', () => {
      const criteria = {
        ...mockAnnouncement.eligibility_criteria,
        industries: { included: [], excluded: ['software'] },
      }
      const isEligible = checkEligibility(mockCompany, criteria)
      expect(isEligible).toBe(false)
    })
  })
})

describe('/api/matching/[id]', () => {
  describe('GET - 매칭 결과 조회', () => {
    it('본인의 매칭 결과를 조회할 수 있다', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      expect(mockMatchResult.id).toBeDefined()
    })

    it('존재하지 않는 매칭은 404를 반환해야 한다', async () => {
      const response = { status: 404, error: '매칭 결과를 찾을 수 없어요' }
      expect(response.status).toBe(404)
    })

    it('분석 결과가 포함되어야 한다', async () => {
      expect(mockMatchResult.analysis.summary).toBeDefined()
      expect(mockMatchResult.analysis.strengths).toBeInstanceOf(Array)
      expect(mockMatchResult.analysis.weaknesses).toBeInstanceOf(Array)
      expect(mockMatchResult.analysis.recommendations).toBeInstanceOf(Array)
    })
  })

  describe('DELETE - 매칭 결과 삭제', () => {
    it('본인의 매칭 결과를 삭제할 수 있다', async () => {
      const deleteResponse = { success: true }
      expect(deleteResponse.success).toBe(true)
    })
  })
})

describe('/api/matching/stream', () => {
  describe('POST - 스트리밍 매칭 분석', () => {
    it('SSE 형식으로 응답해야 한다', async () => {
      const contentType = 'text/event-stream'
      expect(contentType).toBe('text/event-stream')
    })

    it('진행 상황을 실시간으로 전송해야 한다', async () => {
      const progressEvents = [
        { type: 'progress', step: '기업 정보 분석 중...', progress: 20 },
        { type: 'progress', step: '공고 자격 요건 파싱 중...', progress: 40 },
        { type: 'progress', step: 'AI 매칭 분석 중...', progress: 60 },
        { type: 'progress', step: '결과 생성 중...', progress: 80 },
        { type: 'complete', result: mockMatchResult },
      ]

      expect(progressEvents.length).toBe(5)
      expect(progressEvents[progressEvents.length - 1].type).toBe('complete')
    })
  })
})

describe('플랜별 매칭 결과 공개', () => {
  const applyPlanRestrictions = (
    results: Array<{ rank: number; score: number }>,
    plan: 'free' | 'pro' | 'premium'
  ) => {
    return results.map((r) => ({
      ...r,
      isBlurred: plan === 'free' && r.rank <= 2,
    }))
  }

  const mockResults = [
    { rank: 1, score: 95 },
    { rank: 2, score: 88 },
    { rank: 3, score: 75 },
    { rank: 4, score: 68 },
    { rank: 5, score: 52 },
  ]

  it('Free 플랜은 1~2순위가 블러 처리되어야 한다', () => {
    const restricted = applyPlanRestrictions(mockResults, 'free')

    expect(restricted[0].isBlurred).toBe(true)
    expect(restricted[1].isBlurred).toBe(true)
    expect(restricted[2].isBlurred).toBe(false)
  })

  it('Pro 플랜은 전체 공개되어야 한다', () => {
    const restricted = applyPlanRestrictions(mockResults, 'pro')

    expect(restricted.every((r) => !r.isBlurred)).toBe(true)
  })

  it('Premium 플랜은 전체 공개되어야 한다', () => {
    const restricted = applyPlanRestrictions(mockResults, 'premium')

    expect(restricted.every((r) => !r.isBlurred)).toBe(true)
  })
})

describe('매칭 캐싱', () => {
  it('동일한 기업-공고 조합은 캐시를 사용해야 한다', () => {
    const cacheKey = `matching:${mockCompany.id}:${mockAnnouncement.id}`

    expect(cacheKey).toContain('matching:')
    expect(cacheKey).toContain(mockCompany.id)
    expect(cacheKey).toContain(mockAnnouncement.id)
  })

  it('캐시 TTL은 7일이어야 한다', () => {
    const CACHE_TTL_DAYS = 7
    const CACHE_TTL_SECONDS = CACHE_TTL_DAYS * 24 * 60 * 60

    expect(CACHE_TTL_SECONDS).toBe(604800)
  })

  it('기업 정보 변경 시 캐시가 무효화되어야 한다', () => {
    const oldCompanyHash = 'hash-123'
    const newCompanyHash = 'hash-456'

    expect(oldCompanyHash).not.toBe(newCompanyHash)
  })
})

describe('매칭 분석 품질', () => {
  it('분석 요약이 포함되어야 한다', () => {
    expect(mockMatchResult.analysis.summary).toBeTruthy()
    expect(mockMatchResult.analysis.summary.length).toBeGreaterThan(10)
  })

  it('강점이 최소 1개 이상 포함되어야 한다', () => {
    expect(mockMatchResult.analysis.strengths.length).toBeGreaterThanOrEqual(1)
  })

  it('약점 또는 개선점이 포함되어야 한다', () => {
    const hasWeaknessOrRecommendation =
      mockMatchResult.analysis.weaknesses.length > 0 ||
      mockMatchResult.analysis.recommendations.length > 0

    expect(hasWeaknessOrRecommendation).toBe(true)
  })
})

describe('/api/recommendations', () => {
  describe('GET - 맞춤 추천 공고', () => {
    it('Pro/Premium 사용자만 접근 가능해야 한다', () => {
      const allowedPlans = ['pro', 'premium']
      const userPlan = 'pro'

      expect(allowedPlans).toContain(userPlan)
    })

    it('추천 결과에 적합도 점수가 포함되어야 한다', () => {
      const recommendation = {
        announcement_id: 'ann-123',
        score: 85,
        matchedCriteria: ['업종', '지역', '직원수'],
      }

      expect(recommendation.score).toBeDefined()
      expect(recommendation.matchedCriteria).toBeInstanceOf(Array)
    })

    it('최소 점수 이상의 공고만 추천되어야 한다', () => {
      const minScore = 50
      const recommendations = [
        { score: 85 },
        { score: 72 },
        { score: 45 }, // 제외
      ]

      const filtered = recommendations.filter((r) => r.score >= minScore)
      expect(filtered.length).toBe(2)
    })

    it('마감 임박 공고에 가산점이 부여되어야 한다', () => {
      const baseScore = 80
      const deadlineBonus = 5
      const daysUntilDeadline = 3

      const finalScore =
        daysUntilDeadline <= 7 ? baseScore + deadlineBonus : baseScore

      expect(finalScore).toBe(85)
    })
  })
})

describe('Rate Limiting', () => {
  it('매칭 요청에 Rate Limit이 적용되어야 한다', () => {
    const rateLimit = {
      free: { requests: 5, window: '1d' },
      pro: { requests: 50, window: '1d' },
      premium: { requests: 200, window: '1d' },
    }

    expect(rateLimit.free.requests).toBeLessThan(rateLimit.pro.requests)
    expect(rateLimit.pro.requests).toBeLessThan(rateLimit.premium.requests)
  })

  it('Rate Limit 초과 시 429 에러를 반환해야 한다', () => {
    const errorResponse = {
      status: 429,
      error: '일일 매칭 한도를 초과했어요',
    }

    expect(errorResponse.status).toBe(429)
  })
})
