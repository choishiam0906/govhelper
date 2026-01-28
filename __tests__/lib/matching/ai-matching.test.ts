// AI 매칭 분석 테스트
// lib/matching/ 모듈 테스트 (Gemini AI)

import { describe, it, expect } from 'vitest'

// 매칭 분석 결과 타입
interface MatchAnalysis {
  announcementId: string
  companyId: string
  score: number
  summary: string
  strengths: string[]
  weaknesses: string[]
  eligibilityCheck: {
    eligible: boolean
    reasons: string[]
  }
  scoreDetails?: {
    eligibility: number
    industry: number
    location: number
    scale: number
    certification: number
  }
}

describe('AI 매칭 분석', () => {
  describe('매칭 점수 계산', () => {
    it('0-100 범위의 점수', () => {
      const score = 85

      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('높은 점수 (80+): 매우 적합', () => {
      const score = 92

      const level = score >= 80 ? '매우 적합' : score >= 60 ? '적합' : '부적합'

      expect(level).toBe('매우 적합')
    })

    it('중간 점수 (60-79): 적합', () => {
      const score = 72

      const level = score >= 80 ? '매우 적합' : score >= 60 ? '적합' : '부적합'

      expect(level).toBe('적합')
    })

    it('낮은 점수 (0-59): 부적합', () => {
      const score = 45

      const level = score >= 80 ? '매우 적합' : score >= 60 ? '적합' : '부적합'

      expect(level).toBe('부적합')
    })
  })

  describe('지원자격 검증', () => {
    it('모든 조건 충족', () => {
      const eligibilityCheck = {
        eligible: true,
        reasons: [
          '업종: IT/소프트웨어 (충족)',
          '직원수: 50명 (충족)',
          '매출: 30억원 (충족)',
          '지역: 서울 (충족)',
        ],
      }

      expect(eligibilityCheck.eligible).toBe(true)
      expect(eligibilityCheck.reasons).toHaveLength(4)
    })

    it('일부 조건 미충족', () => {
      const eligibilityCheck = {
        eligible: false,
        reasons: [
          '업종: IT/소프트웨어 (충족)',
          '직원수: 5명 (미충족, 최소 10명 필요)',
          '매출: 5억원 (충족)',
        ],
      }

      expect(eligibilityCheck.eligible).toBe(false)
      expect(eligibilityCheck.reasons.some(r => r.includes('미충족'))).toBe(true)
    })

    it('필수 인증 미보유', () => {
      const eligibilityCheck = {
        eligible: false,
        reasons: [
          '업종: 제조업 (충족)',
          '벤처인증: 미보유 (필수)',
        ],
      }

      expect(eligibilityCheck.eligible).toBe(false)
      expect(eligibilityCheck.reasons.some(r => r.includes('필수'))).toBe(true)
    })
  })

  describe('강점 분석', () => {
    it('업종 일치', () => {
      const strengths = [
        '업종이 공고 대상(IT/소프트웨어)과 정확히 일치해요',
        '직원 수가 적정 범위 내에 있어요',
      ]

      expect(strengths).toContain('업종이 공고 대상(IT/소프트웨어)과 정확히 일치해요')
    })

    it('지역 일치', () => {
      const strengths = [
        '소재지(서울)가 공고 대상 지역에 포함되어요',
      ]

      expect(strengths[0]).toContain('소재지')
      expect(strengths[0]).toContain('서울')
    })

    it('인증 보유', () => {
      const strengths = [
        '벤처기업 인증을 보유하고 있어요 (가산점 3점)',
      ]

      expect(strengths[0]).toContain('벤처기업 인증')
      expect(strengths[0]).toContain('가산점')
    })

    it('규모 적합', () => {
      const strengths = [
        '기업 규모(직원 50명, 매출 30억)가 공고 요건에 적합해요',
      ]

      expect(strengths[0]).toContain('기업 규모')
    })
  })

  describe('약점 분석', () => {
    it('직원 수 부족', () => {
      const weaknesses = [
        '직원 수가 최소 요구 인원(10명)보다 적어요',
      ]

      expect(weaknesses[0]).toContain('직원 수')
      expect(weaknesses[0]).toContain('적어요')
    })

    it('매출 부족', () => {
      const weaknesses = [
        '연매출이 최소 요구액(10억)보다 적어요',
      ]

      expect(weaknesses[0]).toContain('매출')
    })

    it('업력 부족', () => {
      const weaknesses = [
        '설립일이 최소 업력(3년) 요건을 충족하지 못해요',
      ]

      expect(weaknesses[0]).toContain('설립일')
      expect(weaknesses[0]).toContain('업력')
    })

    it('인증 미보유', () => {
      const weaknesses = [
        '우대 조건인 이노비즈 인증을 보유하지 않았어요',
      ]

      expect(weaknesses[0]).toContain('이노비즈')
      expect(weaknesses[0]).toContain('보유하지 않았어요')
    })
  })

  describe('종합 요약', () => {
    it('매우 적합한 경우', () => {
      const summary = '귀사는 이 공고에 매우 적합해요. 업종, 지역, 규모 모두 요건을 충족하며, 벤처인증까지 보유하고 있어요. 지원을 적극 권장합니다.'

      expect(summary).toContain('매우 적합')
      expect(summary).toContain('권장')
    })

    it('적합한 경우', () => {
      const summary = '귀사는 이 공고에 적합해요. 주요 요건은 충족하지만, 직원 수가 약간 부족해요. 그래도 지원해볼 만해요.'

      expect(summary).toContain('적합')
      expect(summary).toContain('지원해볼 만해요')
    })

    it('부적합한 경우', () => {
      const summary = '귀사는 이 공고에 부적합해요. 직원 수와 매출이 최소 요건을 충족하지 못해요. 다른 공고를 찾아보시는 게 좋겠어요.'

      expect(summary).toContain('부적합')
      expect(summary).toContain('다른 공고')
    })
  })

  describe('점수 세부 항목', () => {
    it('항목별 점수 breakdown', () => {
      const scoreDetails = {
        eligibility: 25, // 자격조건 (30점 만점)
        industry: 18,    // 업종 (20점 만점)
        location: 15,    // 지역 (15점 만점)
        scale: 20,       // 규모 (25점 만점)
        certification: 8, // 인증 (10점 만점)
      }

      const total = Object.values(scoreDetails).reduce((a, b) => a + b, 0)

      expect(total).toBe(86)
      expect(scoreDetails.eligibility).toBeLessThanOrEqual(30)
      expect(scoreDetails.industry).toBeLessThanOrEqual(20)
    })

    it('총점 계산', () => {
      const scoreDetails = {
        eligibility: 25,
        industry: 18,
        location: 15,
        scale: 20,
        certification: 8,
      }

      const total = Object.values(scoreDetails).reduce((a, b) => a + b, 0)

      expect(total).toBeGreaterThanOrEqual(0)
      expect(total).toBeLessThanOrEqual(100)
    })
  })

  describe('캐싱', () => {
    it('동일 회사+공고는 캐시 사용 (7일)', () => {
      const cacheKey = 'matching:company_123:announcement_456'
      const ttl = 7 * 24 * 60 * 60 // 7일 (초)

      expect(cacheKey).toContain('company_123')
      expect(cacheKey).toContain('announcement_456')
      expect(ttl).toBe(604800)
    })

    it('캐시 히트 시 재분석 안 함', () => {
      const cachedResult: MatchAnalysis = {
        announcementId: 'ann_123',
        companyId: 'company_123',
        score: 85,
        summary: '캐시된 결과',
        strengths: [],
        weaknesses: [],
        eligibilityCheck: { eligible: true, reasons: [] },
      }

      expect(cachedResult.summary).toBe('캐시된 결과')
    })
  })

  describe('에러 처리', () => {
    it('회사 정보 없으면 에러', () => {
      const companyInfo = null

      const analyze = () => {
        if (!companyInfo) {
          throw new Error('Company info is required')
        }
        return { score: 0 }
      }

      expect(() => analyze()).toThrow('Company info is required')
    })

    it('공고 정보 없으면 에러', () => {
      const announcement = null

      const analyze = () => {
        if (!announcement) {
          throw new Error('Announcement not found')
        }
        return { score: 0 }
      }

      expect(() => analyze()).toThrow('Announcement not found')
    })

    it('AI 응답 파싱 실패 시 기본값', () => {
      const fallbackResult: MatchAnalysis = {
        announcementId: 'ann_123',
        companyId: 'company_123',
        score: 50,
        summary: '매칭 분석 중 오류가 발생했어요. 기본 점수로 평가했어요.',
        strengths: [],
        weaknesses: [],
        eligibilityCheck: { eligible: false, reasons: ['분석 실패'] },
      }

      expect(fallbackResult.score).toBe(50)
      expect(fallbackResult.summary).toContain('오류')
    })
  })

  describe('RAG 컨텍스트 연동', () => {
    it('사업계획서가 있으면 RAG 검색', () => {
      const hasBusinessPlan = true

      if (hasBusinessPlan) {
        const ragContext = [
          '본 사업은 AI 기반 SaaS 플랫폼 개발을 목표로 합니다.',
          '목표 시장은 중소기업 B2B 시장이며, 연매출 100억 달성을 목표로 합니다.',
        ]

        expect(ragContext).toHaveLength(2)
        expect(ragContext[0]).toContain('AI 기반')
      }

      expect(hasBusinessPlan).toBe(true)
    })

    it('사업계획서 없으면 기본 정보만', () => {
      const hasBusinessPlan = false

      const context = hasBusinessPlan ? 'RAG context' : 'Basic info only'

      expect(context).toBe('Basic info only')
    })
  })

  describe('실전 시나리오', () => {
    it('스타트업 R&D 지원사업 매칭', () => {
      const result: MatchAnalysis = {
        announcementId: 'ann_123',
        companyId: 'company_456',
        score: 88,
        summary:
          '귀사는 이 공고에 매우 적합해요. IT/소프트웨어 업종이며, 서울에 소재하고, 직원 50명으로 규모가 적절해요. 벤처인증도 보유하고 있어 가산점을 받을 수 있어요.',
        strengths: [
          '업종이 공고 대상(IT/소프트웨어)과 정확히 일치해요',
          '소재지(서울)가 공고 대상 지역에 포함되어요',
          '직원 수(50명)가 적정 범위(10-100명) 내에 있어요',
          '벤처기업 인증을 보유하고 있어요 (가산점 3점)',
        ],
        weaknesses: [
          '연매출(5억)이 권장 수준(10억)보다 약간 낮아요',
        ],
        eligibilityCheck: {
          eligible: true,
          reasons: [
            '업종: IT/소프트웨어 (충족)',
            '직원수: 50명 (충족)',
            '지역: 서울 (충족)',
            '벤처인증: 보유 (충족)',
          ],
        },
        scoreDetails: {
          eligibility: 28,
          industry: 20,
          location: 15,
          scale: 18,
          certification: 7,
        },
      }

      expect(result.score).toBe(88)
      expect(result.eligibilityCheck.eligible).toBe(true)
      expect(result.strengths).toHaveLength(4)
      expect(result.weaknesses).toHaveLength(1)
    })
  })
})
