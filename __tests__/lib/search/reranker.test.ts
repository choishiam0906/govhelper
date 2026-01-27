// AI 재순위화 모듈 테스트 (Groq LLM)
// lib/search/reranker.ts의 rerankWithGroq() 함수 테스트

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { RankedResult } from '@/lib/search/types'

// Groq SDK 전체 모킹
vi.mock('groq-sdk')

describe('AI 재순위화 (rerankWithGroq)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // rerankWithGroq를 동적 import로 가져오기
  const importRerankWithGroq = async () => {
    const module = await import('@/lib/search/reranker')
    return module.rerankWithGroq
  }

  describe('기본 동작', () => {
    it('빈 배열을 입력하면 빈 배열을 반환해야 한다', async () => {
      const rerankWithGroq = await importRerankWithGroq()
      const result = await rerankWithGroq('쿼리', [])
      expect(result).toEqual([])
    })

    it('Groq API 호출 실패 시 원본 결과를 반환해야 한다 (graceful degradation)', async () => {
      const mockResults: RankedResult[] = [
        {
          id: 'ann1',
          title: '공고1',
          organization: '기관1',
          category: null,
          support_type: null,
          support_amount: null,
          application_end: null,
          source: 'smes',
          rrfScore: 0.8,
        },
      ]

      // Groq SDK를 에러 발생하도록 모킹
      const Groq = (await import('groq-sdk')).default as any
      Groq.mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockRejectedValue(new Error('API Error')),
          },
        },
      }))

      const rerankWithGroq = await importRerankWithGroq()
      const result = await rerankWithGroq('쿼리', mockResults)

      // 에러 발생 시 원본 결과 반환
      expect(result).toEqual(mockResults)
    })

    it('결과가 하나만 있어도 처리해야 한다', async () => {
      const mockResults: RankedResult[] = [
        {
          id: 'ann1',
          title: 'IT 스타트업 지원',
          organization: '중기부',
          category: '기술개발',
          support_type: '지원금',
          support_amount: '5000만원',
          application_end: '2026-02-28',
          source: 'smes',
          rrfScore: 0.8,
        },
      ]

      const rerankWithGroq = await importRerankWithGroq()
      const result = await rerankWithGroq('IT 지원', mockResults)

      // 결과가 반환되어야 함 (에러가 없으면 재순위화 시도, 에러 시 원본 반환)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('ann1')
    })

    it('여러 결과를 처리해야 한다', async () => {
      const mockResults: RankedResult[] = [
        {
          id: 'ann1',
          title: '공고1',
          organization: '기관1',
          category: null,
          support_type: null,
          support_amount: null,
          application_end: null,
          source: 'smes',
          rrfScore: 0.8,
        },
        {
          id: 'ann2',
          title: '공고2',
          organization: '기관2',
          category: null,
          support_type: null,
          support_amount: null,
          application_end: null,
          source: 'bizinfo',
          rrfScore: 0.6,
        },
        {
          id: 'ann3',
          title: '공고3',
          organization: '기관3',
          category: null,
          support_type: null,
          support_amount: null,
          application_end: null,
          source: 'kstartup',
          rrfScore: 0.4,
        },
      ]

      const rerankWithGroq = await importRerankWithGroq()
      const result = await rerankWithGroq('쿼리', mockResults)

      // 결과가 반환되어야 함
      expect(result).toHaveLength(3)
    })
  })

  describe('데이터 타입 검증', () => {
    it('입력 결과의 모든 필드를 유지해야 한다', async () => {
      const mockResults: RankedResult[] = [
        {
          id: 'ann1',
          title: 'IT 스타트업 지원',
          organization: '중기부',
          category: '기술개발',
          support_type: '지원금',
          support_amount: '5000만원',
          application_end: '2026-02-28',
          source: 'smes',
          rrfScore: 0.8,
          vectorRank: 1,
          keywordRank: 2,
        },
      ]

      const rerankWithGroq = await importRerankWithGroq()
      const result = await rerankWithGroq('IT 지원', mockResults)

      expect(result[0].id).toBe('ann1')
      expect(result[0].title).toBe('IT 스타트업 지원')
      expect(result[0].organization).toBe('중기부')
      expect(result[0].category).toBe('기술개발')
      expect(result[0].support_type).toBe('지원금')
      expect(result[0].support_amount).toBe('5000만원')
      expect(result[0].application_end).toBe('2026-02-28')
      expect(result[0].source).toBe('smes')
      expect(result[0].rrfScore).toBe(0.8)
      expect(result[0].vectorRank).toBe(1)
      expect(result[0].keywordRank).toBe(2)
    })

    it('null 값을 처리해야 한다', async () => {
      const mockResults: RankedResult[] = [
        {
          id: 'ann1',
          title: null as any,
          organization: null as any,
          category: null,
          support_type: null,
          support_amount: null,
          application_end: null,
          source: 'smes',
          rrfScore: 0.8,
        },
      ]

      const rerankWithGroq = await importRerankWithGroq()
      const result = await rerankWithGroq('쿼리', mockResults)

      // null 값도 유지되어야 함
      expect(result).toHaveLength(1)
    })
  })

  describe('환경 변수 검증', () => {
    it('GROQ_API_KEY가 없어도 에러가 발생하지 않아야 한다', async () => {
      const originalKey = process.env.GROQ_API_KEY
      delete process.env.GROQ_API_KEY

      const mockResults: RankedResult[] = [
        {
          id: 'ann1',
          title: '공고1',
          organization: '기관1',
          category: null,
          support_type: null,
          support_amount: null,
          application_end: null,
          source: 'smes',
          rrfScore: 0.8,
        },
      ]

      const rerankWithGroq = await importRerankWithGroq()
      const result = await rerankWithGroq('쿼리', mockResults)

      // 에러가 아닌 결과 반환 (graceful degradation)
      expect(result).toBeDefined()

      // 원래 값 복원
      if (originalKey) {
        process.env.GROQ_API_KEY = originalKey
      }
    })
  })
})
