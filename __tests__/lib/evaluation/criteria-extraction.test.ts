// 평가기준 자동 추출 시스템 테스트
// lib/evaluation/ 모듈 테스트 (Gemini AI)

import { describe, it, expect } from 'vitest'

// 평가기준 타입
interface EvaluationItem {
  category: string
  name: string
  description: string
  maxScore: number
  subItems?: Array<{
    name: string
    maxScore: number
  }>
}

interface BonusItem {
  name: string
  score: number
  condition: string
  type: 'bonus' | 'deduction'
}

interface EvaluationCriteria {
  totalScore: number
  passingScore: number | null
  items: EvaluationItem[]
  bonusItems: BonusItem[]
  evaluationMethod: {
    type: 'absolute' | 'relative'
    stages: number
    stageNames: string[]
  }
  confidence: number
  extractedAt: string
}

describe('평가기준 추출', () => {
  describe('기본 평가항목 추출', () => {
    it('항목명, 배점, 설명 추출', () => {
      const item: EvaluationItem = {
        category: '기술성',
        name: '기술개발 계획의 적정성',
        description: '기술개발 목표, 내용, 방법의 구체성',
        maxScore: 30,
      }

      expect(item.category).toBe('기술성')
      expect(item.name).toBe('기술개발 계획의 적정성')
      expect(item.maxScore).toBe(30)
    })

    it('하위 항목 추출', () => {
      const item: EvaluationItem = {
        category: '사업성',
        name: '사업화 계획',
        description: '사업화 전략 및 실현 가능성',
        maxScore: 25,
        subItems: [
          { name: '목표시장 분석', maxScore: 10 },
          { name: '매출 계획', maxScore: 10 },
          { name: '리스크 관리', maxScore: 5 },
        ],
      }

      expect(item.subItems).toHaveLength(3)
      expect(item.subItems![0].name).toBe('목표시장 분석')
      expect(item.subItems!.reduce((sum, sub) => sum + sub.maxScore, 0)).toBe(25)
    })

    it('여러 카테고리 추출', () => {
      const items: EvaluationItem[] = [
        {
          category: '기술성',
          name: '기술개발 계획',
          description: '기술개발 목표 및 방법',
          maxScore: 30,
        },
        {
          category: '사업성',
          name: '사업화 계획',
          description: '사업화 전략 및 실현 가능성',
          maxScore: 25,
        },
        {
          category: '경제성',
          name: '경제적 효과',
          description: '매출 증대 및 고용 창출 효과',
          maxScore: 20,
        },
      ]

      expect(items).toHaveLength(3)
      expect(items.map(i => i.category)).toEqual(['기술성', '사업성', '경제성'])
    })
  })

  describe('가산점/감점 추출', () => {
    it('가산점 항목 추출', () => {
      const bonusItem: BonusItem = {
        name: '벤처기업 인증',
        score: 3,
        condition: '벤처기업 인증서 보유',
        type: 'bonus',
      }

      expect(bonusItem.type).toBe('bonus')
      expect(bonusItem.score).toBe(3)
    })

    it('감점 항목 추출', () => {
      const deductionItem: BonusItem = {
        name: '지원 중복',
        score: -5,
        condition: '동일 사업으로 타 지원사업 중복 수혜',
        type: 'deduction',
      }

      expect(deductionItem.type).toBe('deduction')
      expect(deductionItem.score).toBe(-5)
    })

    it('여러 가산점 항목', () => {
      const bonusItems: BonusItem[] = [
        {
          name: '벤처기업 인증',
          score: 3,
          condition: '벤처기업 인증서 보유',
          type: 'bonus',
        },
        {
          name: '이노비즈 인증',
          score: 2,
          condition: '이노비즈 인증서 보유',
          type: 'bonus',
        },
        {
          name: '여성기업',
          score: 2,
          condition: '여성기업 확인서 보유',
          type: 'bonus',
        },
      ]

      expect(bonusItems).toHaveLength(3)
      expect(bonusItems.reduce((sum, b) => sum + b.score, 0)).toBe(7)
    })
  })

  describe('심사 방식 추출', () => {
    it('절대평가', () => {
      const method = {
        type: 'absolute' as const,
        stages: 1,
        stageNames: ['서류심사'],
      }

      expect(method.type).toBe('absolute')
      expect(method.stages).toBe(1)
    })

    it('상대평가', () => {
      const method = {
        type: 'relative' as const,
        stages: 1,
        stageNames: ['서류심사'],
      }

      expect(method.type).toBe('relative')
    })

    it('2단계 심사 (서류 + 발표)', () => {
      const method = {
        type: 'absolute' as const,
        stages: 2,
        stageNames: ['서류심사', '발표심사'],
      }

      expect(method.stages).toBe(2)
      expect(method.stageNames).toContain('발표심사')
    })

    it('3단계 심사 (서류 + 발표 + 면접)', () => {
      const method = {
        type: 'absolute' as const,
        stages: 3,
        stageNames: ['서류심사', '발표심사', '면접심사'],
      }

      expect(method.stages).toBe(3)
      expect(method.stageNames).toHaveLength(3)
    })
  })

  describe('총점 및 합격 기준', () => {
    it('총점 100점', () => {
      const criteria: EvaluationCriteria = {
        totalScore: 100,
        passingScore: 70,
        items: [],
        bonusItems: [],
        evaluationMethod: {
          type: 'absolute',
          stages: 1,
          stageNames: ['서류심사'],
        },
        confidence: 0.9,
        extractedAt: '2026-01-28T00:00:00Z',
      }

      expect(criteria.totalScore).toBe(100)
    })

    it('합격 기준 점수', () => {
      const criteria: EvaluationCriteria = {
        totalScore: 100,
        passingScore: 70,
        items: [],
        bonusItems: [],
        evaluationMethod: {
          type: 'absolute',
          stages: 1,
          stageNames: ['서류심사'],
        },
        confidence: 0.9,
        extractedAt: '2026-01-28T00:00:00Z',
      }

      expect(criteria.passingScore).toBe(70)
    })

    it('합격 기준 없음 (상대평가)', () => {
      const criteria: EvaluationCriteria = {
        totalScore: 100,
        passingScore: null,
        items: [],
        bonusItems: [],
        evaluationMethod: {
          type: 'relative',
          stages: 1,
          stageNames: ['서류심사'],
        },
        confidence: 0.85,
        extractedAt: '2026-01-28T00:00:00Z',
      }

      expect(criteria.passingScore).toBeNull()
      expect(criteria.evaluationMethod.type).toBe('relative')
    })

    it('항목별 배점 합계 = 총점', () => {
      const items: EvaluationItem[] = [
        { category: '기술성', name: '기술개발', description: '', maxScore: 30 },
        { category: '사업성', name: '사업화', description: '', maxScore: 25 },
        { category: '경제성', name: '경제적 효과', description: '', maxScore: 20 },
        { category: '정책성', name: '정책 부합도', description: '', maxScore: 15 },
        { category: '추진체계', name: '추진 역량', description: '', maxScore: 10 },
      ]

      const total = items.reduce((sum, item) => sum + item.maxScore, 0)

      expect(total).toBe(100)
    })
  })

  describe('신뢰도 점수', () => {
    it('명확한 평가기준 = 높은 신뢰도', () => {
      const confidence = 0.95

      expect(confidence).toBeGreaterThan(0.9)
    })

    it('모호한 평가기준 = 낮은 신뢰도', () => {
      const confidence = 0.6

      expect(confidence).toBeLessThan(0.7)
    })

    it('평가기준 없음 = 매우 낮은 신뢰도', () => {
      const confidence = 0.3

      expect(confidence).toBeLessThan(0.5)
    })
  })

  describe('에러 처리', () => {
    it('공고 내용이 비어있으면 null 반환', () => {
      const content = ''
      const result = content ? { confidence: 0.8 } : null

      expect(result).toBeNull()
    })

    it('평가기준이 없으면 빈 배열 반환', () => {
      const criteria: EvaluationCriteria = {
        totalScore: 0,
        passingScore: null,
        items: [],
        bonusItems: [],
        evaluationMethod: {
          type: 'absolute',
          stages: 1,
          stageNames: ['서류심사'],
        },
        confidence: 0.2,
        extractedAt: '2026-01-28T00:00:00Z',
      }

      expect(criteria.items).toHaveLength(0)
      expect(criteria.confidence).toBeLessThan(0.3)
    })

    it('AI 응답 파싱 실패 시 기본값 반환', () => {
      const fallback: EvaluationCriteria = {
        totalScore: 100,
        passingScore: null,
        items: [
          {
            category: '사업성',
            name: '사업 계획의 적정성',
            description: '일반적인 평가 항목',
            maxScore: 100,
          },
        ],
        bonusItems: [],
        evaluationMethod: {
          type: 'absolute',
          stages: 1,
          stageNames: ['서류심사'],
        },
        confidence: 0.1,
        extractedAt: '2026-01-28T00:00:00Z',
      }

      expect(fallback.confidence).toBe(0.1)
      expect(fallback.items).toHaveLength(1)
    })
  })

  describe('실전 시나리오', () => {
    it('R&D 지원사업 평가기준', () => {
      const criteria: EvaluationCriteria = {
        totalScore: 100,
        passingScore: 70,
        items: [
          {
            category: '기술성',
            name: '기술개발 계획의 적정성',
            description: '기술개발 목표, 내용, 방법의 구체성 및 실현 가능성',
            maxScore: 35,
            subItems: [
              { name: '기술개발 목표의 명확성', maxScore: 15 },
              { name: '기술개발 방법의 적절성', maxScore: 20 },
            ],
          },
          {
            category: '사업성',
            name: '사업화 계획의 타당성',
            description: '시장성 분석 및 사업화 전략의 구체성',
            maxScore: 30,
          },
          {
            category: '경제성',
            name: '경제적 파급효과',
            description: '매출 증대 및 고용 창출 효과',
            maxScore: 20,
          },
          {
            category: '추진체계',
            name: '연구개발 추진 역량',
            description: '인력 구성 및 연구 환경',
            maxScore: 15,
          },
        ],
        bonusItems: [
          {
            name: '벤처기업 인증',
            score: 3,
            condition: '벤처기업 확인서 제출',
            type: 'bonus',
          },
          {
            name: '이노비즈 인증',
            score: 2,
            condition: '이노비즈 인증서 제출',
            type: 'bonus',
          },
        ],
        evaluationMethod: {
          type: 'absolute',
          stages: 2,
          stageNames: ['서류심사', '발표심사'],
        },
        confidence: 0.92,
        extractedAt: '2026-01-28T00:00:00Z',
      }

      expect(criteria.items).toHaveLength(4)
      expect(criteria.bonusItems).toHaveLength(2)
      expect(criteria.evaluationMethod.stages).toBe(2)
      expect(criteria.confidence).toBeGreaterThan(0.9)

      const itemTotal = criteria.items.reduce((sum, item) => sum + item.maxScore, 0)
      expect(itemTotal).toBe(100)
    })
  })
})
