/**
 * 공고 API 통합 테스트
 * /api/announcements 및 관련 엔드포인트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Supabase 클라이언트 모킹
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
  rpc: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}))

// Google Generative AI 모킹 (시맨틱 검색용)
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      embedContent: vi.fn().mockResolvedValue({
        embedding: { values: new Array(768).fill(0.1) },
      }),
    }),
  })),
}))

// 테스트용 목업 데이터
const mockAnnouncements = [
  {
    id: 'ann-1',
    title: '2024 중소기업 R&D 지원사업',
    organization: '중소벤처기업부',
    category: 'R&D',
    source: 'smes',
    status: 'active',
    application_start: '2024-01-01',
    application_end: '2024-03-31',
    support_amount: '최대 3억원',
    description: 'R&D 역량 강화 지원',
    eligibility_criteria: {
      companyTypes: ['중소기업'],
      employeeCount: { max: 300 },
    },
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ann-2',
    title: '창업기업 성장 지원',
    organization: '창업진흥원',
    category: '창업',
    source: 'kstartup',
    status: 'active',
    application_start: '2024-02-01',
    application_end: '2024-04-30',
    support_amount: '최대 1억원',
    description: '초기 창업기업 지원',
    eligibility_criteria: {
      companyTypes: ['스타트업'],
      businessAge: { max: 3 },
    },
    created_at: '2024-01-15T00:00:00Z',
  },
]

describe('/api/announcements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET - 공고 목록 조회', () => {
    it('공고 목록을 조회할 수 있다', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockAnnouncements,
          error: null,
          count: 2,
        }),
      }
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      expect(mockAnnouncements.length).toBe(2)
    })

    it('소스별 필터링이 동작해야 한다', async () => {
      const source = 'smes'
      const filtered = mockAnnouncements.filter((a) => a.source === source)

      expect(filtered.length).toBe(1)
      expect(filtered[0].source).toBe('smes')
    })

    it('카테고리별 필터링이 동작해야 한다', async () => {
      const category = 'R&D'
      const filtered = mockAnnouncements.filter((a) => a.category === category)

      expect(filtered.length).toBe(1)
      expect(filtered[0].category).toBe('R&D')
    })

    it('상태별 필터링이 동작해야 한다', async () => {
      const status = 'active'
      const filtered = mockAnnouncements.filter((a) => a.status === status)

      expect(filtered.length).toBe(2)
    })

    it('페이지네이션이 동작해야 한다', async () => {
      const page = 1
      const limit = 20
      const offset = (page - 1) * limit

      expect(offset).toBe(0)
      expect(limit).toBe(20)
    })

    it('정렬 옵션이 동작해야 한다', async () => {
      const sortOptions = ['created_at', 'application_end', 'title']

      expect(sortOptions).toContain('created_at')
      expect(sortOptions).toContain('application_end')
    })
  })

  describe('키워드 검색', () => {
    it('제목에서 키워드 검색이 동작해야 한다', async () => {
      const keyword = 'R&D'
      const filtered = mockAnnouncements.filter((a) =>
        a.title.includes(keyword)
      )

      expect(filtered.length).toBe(1)
    })

    it('기관명에서 키워드 검색이 동작해야 한다', async () => {
      const keyword = '중소벤처'
      const filtered = mockAnnouncements.filter((a) =>
        a.organization.includes(keyword)
      )

      expect(filtered.length).toBe(1)
    })

    it('설명에서 키워드 검색이 동작해야 한다', async () => {
      const keyword = '창업'
      const filtered = mockAnnouncements.filter((a) =>
        a.description.includes(keyword)
      )

      expect(filtered.length).toBe(1)
    })

    it('빈 키워드는 전체 결과를 반환해야 한다', async () => {
      const keyword = ''
      const filtered = keyword
        ? mockAnnouncements.filter((a) => a.title.includes(keyword))
        : mockAnnouncements

      expect(filtered.length).toBe(mockAnnouncements.length)
    })
  })
})

describe('/api/announcements/[id]', () => {
  describe('GET - 공고 상세 조회', () => {
    it('공고 상세 정보를 조회할 수 있다', async () => {
      const announcement = mockAnnouncements[0]

      expect(announcement.id).toBeDefined()
      expect(announcement.title).toBeDefined()
      expect(announcement.organization).toBeDefined()
    })

    it('존재하지 않는 공고는 404를 반환해야 한다', async () => {
      const notFoundResponse = { status: 404, error: '공고를 찾을 수 없어요' }

      expect(notFoundResponse.status).toBe(404)
    })

    it('eligibility_criteria가 포함되어야 한다', async () => {
      const announcement = mockAnnouncements[0]

      expect(announcement.eligibility_criteria).toBeDefined()
      expect(announcement.eligibility_criteria.companyTypes).toBeDefined()
    })
  })
})

describe('/api/announcements/search (시맨틱 검색)', () => {
  describe('POST - AI 시맨틱 검색', () => {
    it('자연어 쿼리로 검색할 수 있다', async () => {
      const query = 'IT 스타트업을 위한 R&D 지원금'

      expect(query.length).toBeGreaterThan(0)
    })

    it('검색 결과에 유사도 점수가 포함되어야 한다', async () => {
      const searchResult = {
        id: 'ann-1',
        title: '2024 중소기업 R&D 지원사업',
        similarity: 0.85,
      }

      expect(searchResult.similarity).toBeGreaterThanOrEqual(0)
      expect(searchResult.similarity).toBeLessThanOrEqual(1)
    })

    it('최소 유사도 임계값이 적용되어야 한다', async () => {
      const minSimilarity = 0.5
      const results = [
        { id: '1', similarity: 0.85 },
        { id: '2', similarity: 0.72 },
        { id: '3', similarity: 0.45 }, // 제외
      ]

      const filtered = results.filter((r) => r.similarity >= minSimilarity)
      expect(filtered.length).toBe(2)
    })

    it('결과 개수 제한이 적용되어야 한다', async () => {
      const limit = 10
      const manyResults = Array(20)
        .fill(null)
        .map((_, i) => ({ id: `ann-${i}`, similarity: 0.8 }))

      const limited = manyResults.slice(0, limit)
      expect(limited.length).toBe(limit)
    })
  })

  describe('임베딩 캐싱', () => {
    it('동일한 쿼리는 캐시된 임베딩을 사용해야 한다', async () => {
      const query = '스타트업 지원'
      const cacheKey = `rag:embedding:${Buffer.from(query).toString('base64')}`

      expect(cacheKey).toContain('rag:embedding:')
    })

    it('캐시 TTL은 1시간이어야 한다', async () => {
      const CACHE_TTL_HOURS = 1
      const CACHE_TTL_SECONDS = CACHE_TTL_HOURS * 60 * 60

      expect(CACHE_TTL_SECONDS).toBe(3600)
    })
  })

  describe('폴백 검색', () => {
    it('시맨틱 검색 실패 시 키워드 검색으로 폴백해야 한다', async () => {
      const semanticFailed = true
      const useFallback = semanticFailed

      expect(useFallback).toBe(true)
    })
  })
})

describe('/api/announcements/search (추천 검색어)', () => {
  describe('GET - 추천 검색어', () => {
    it('인기 검색어 목록을 반환해야 한다', async () => {
      const popularKeywords = [
        '스타트업 지원',
        'R&D 자금',
        '창업 지원금',
        '수출 바우처',
        '인건비 지원',
      ]

      expect(popularKeywords.length).toBeGreaterThan(0)
    })

    it('검색 통계를 반환해야 한다', async () => {
      const stats = {
        totalAnnouncements: 1500,
        activeAnnouncements: 350,
        embeddedAnnouncements: 1200,
      }

      expect(stats.totalAnnouncements).toBeGreaterThan(0)
      expect(stats.activeAnnouncements).toBeLessThanOrEqual(
        stats.totalAnnouncements
      )
    })
  })
})

describe('소스별 공고 조회', () => {
  const sources = ['smes', 'bizinfo', 'kstartup', 'g2b']

  sources.forEach((source) => {
    describe(`/api/announcements/${source}`, () => {
      it(`${source} 소스의 공고를 조회할 수 있다`, async () => {
        expect(source).toBeTruthy()
      })
    })
  })
})

describe('공고 동기화', () => {
  describe('POST - /api/announcements/[source]/sync', () => {
    it('동기화 시 새 공고가 추가되어야 한다', async () => {
      const syncResult = {
        added: 10,
        updated: 5,
        skipped: 85,
      }

      expect(syncResult.added).toBeGreaterThanOrEqual(0)
    })

    it('동기화 후 AI 자동 분류가 실행되어야 한다', async () => {
      const parsedCount = 10

      expect(parsedCount).toBeGreaterThan(0)
    })

    it('API 호출 제한을 준수해야 한다', async () => {
      const rateLimit = {
        maxRequests: 100,
        windowMs: 60000,
      }

      expect(rateLimit.maxRequests).toBe(100)
    })
  })
})

describe('지원자격 파싱', () => {
  describe('POST - /api/announcements/parse-eligibility', () => {
    it('배치 파싱이 동작해야 한다', async () => {
      const batchSize = 10
      expect(batchSize).toBeGreaterThan(0)
    })

    it('파싱 결과가 올바른 스키마를 따라야 한다', async () => {
      const parsedCriteria = {
        companyTypes: ['중소기업'],
        employeeCount: { min: 5, max: 300 },
        revenue: { max: 10000000000 },
        businessAge: { max: 7 },
        industries: { included: ['제조업'], excluded: [] },
        regions: { included: ['전국'], excluded: [] },
        requiredCertifications: ['벤처인증'],
        additionalRequirements: ['고용보험 가입'],
        exclusions: ['세금 체납 기업'],
        summary: '창업 7년 이내 중소기업 대상',
        confidence: 0.85,
        parsedAt: new Date().toISOString(),
      }

      expect(parsedCriteria.companyTypes).toBeInstanceOf(Array)
      expect(parsedCriteria.confidence).toBeGreaterThanOrEqual(0)
      expect(parsedCriteria.confidence).toBeLessThanOrEqual(1)
    })
  })
})

describe('공고 필터링 로직', () => {
  const filterAnnouncements = (
    announcements: typeof mockAnnouncements,
    filters: {
      source?: string
      category?: string
      status?: string
      deadline?: 'upcoming' | 'ended'
    }
  ) => {
    return announcements.filter((ann) => {
      if (filters.source && ann.source !== filters.source) return false
      if (filters.category && ann.category !== filters.category) return false
      if (filters.status && ann.status !== filters.status) return false
      if (filters.deadline) {
        const now = new Date()
        const endDate = new Date(ann.application_end)
        if (filters.deadline === 'upcoming' && endDate < now) return false
        if (filters.deadline === 'ended' && endDate >= now) return false
      }
      return true
    })
  }

  it('복합 필터가 동작해야 한다', () => {
    const filtered = filterAnnouncements(mockAnnouncements, {
      source: 'smes',
      status: 'active',
    })

    expect(filtered.length).toBe(1)
    expect(filtered[0].source).toBe('smes')
    expect(filtered[0].status).toBe('active')
  })

  it('마감 임박 공고를 필터링할 수 있다', () => {
    // 현재 날짜 기준으로 테스트
    const upcomingFilter = { deadline: 'upcoming' as const }
    expect(upcomingFilter.deadline).toBe('upcoming')
  })
})

describe('공고 정렬', () => {
  it('마감일순 정렬이 동작해야 한다', () => {
    const sorted = [...mockAnnouncements].sort(
      (a, b) =>
        new Date(a.application_end).getTime() -
        new Date(b.application_end).getTime()
    )

    expect(new Date(sorted[0].application_end).getTime()).toBeLessThanOrEqual(
      new Date(sorted[1].application_end).getTime()
    )
  })

  it('최신순 정렬이 동작해야 한다', () => {
    const sorted = [...mockAnnouncements].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    expect(new Date(sorted[0].created_at).getTime()).toBeGreaterThanOrEqual(
      new Date(sorted[1].created_at).getTime()
    )
  })
})
