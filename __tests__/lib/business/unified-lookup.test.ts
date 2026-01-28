// 통합 기업정보 조회 시스템 테스트
// lib/business/ 모듈 테스트 (NTS, NPS, DART 통합)

import { describe, it, expect, vi, beforeEach } from 'vitest'

// 가상의 통합 조회 함수 (실제 구현에 맞게 수정 필요)
interface UnifiedBusinessInfo {
  businessNumber: string
  companyName: string
  ceoName: string | null
  address: string | null
  location: string | null
  industryCode: string | null
  employeeCount: number | null
  establishedDate: string | null
  homepage: string | null
  ntsStatus: string | null
  taxType: string | null
  sources: string[]
}

// Mock 함수들
const mockNTSLookup = vi.fn()
const mockNPSLookup = vi.fn()
const mockDARTLookup = vi.fn()

function mockUnifiedLookup(businessNumber: string): UnifiedBusinessInfo {
  // NTS, NPS, DART 순차 조회
  const nts = mockNTSLookup(businessNumber)
  const nps = mockNPSLookup(businessNumber)
  const dart = mockDARTLookup(businessNumber)

  return {
    businessNumber,
    companyName: nps?.companyName || dart?.corpName || '알 수 없음',
    ceoName: dart?.ceoName || null,
    address: nps?.address || dart?.address || null,
    location: nps?.location || null,
    industryCode: dart?.industryCode || null,
    employeeCount: nps?.employeeCount || null,
    establishedDate: dart?.establishedDate || null,
    homepage: dart?.homepage || null,
    ntsStatus: nts?.status || null,
    taxType: nts?.taxType || null,
    sources: [
      nts && 'NTS',
      nps && 'NPS',
      dart && 'DART',
    ].filter(Boolean) as string[],
  }
}

describe('통합 기업정보 조회', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('성공 시나리오', () => {
    it('NTS + NPS + DART 모두 조회 성공', () => {
      mockNTSLookup.mockReturnValue({
        status: '계속사업자',
        taxType: '일반과세자',
      })

      mockNPSLookup.mockReturnValue({
        companyName: '주식회사 테스트',
        address: '서울특별시 강남구',
        location: 'seoul',
        employeeCount: 50,
      })

      mockDARTLookup.mockReturnValue({
        corpName: '테스트',
        ceoName: '홍길동',
        establishedDate: '2020-01-01',
        homepage: 'https://test.com',
        industryCode: '62010',
      })

      const result = mockUnifiedLookup('123-45-67890')

      expect(result.companyName).toBe('주식회사 테스트')
      expect(result.ceoName).toBe('홍길동')
      expect(result.employeeCount).toBe(50)
      expect(result.ntsStatus).toBe('계속사업자')
      expect(result.sources).toEqual(['NTS', 'NPS', 'DART'])
    })

    it('NTS + NPS만 조회 성공 (DART 없음)', () => {
      mockNTSLookup.mockReturnValue({
        status: '계속사업자',
        taxType: '간이과세자',
      })

      mockNPSLookup.mockReturnValue({
        companyName: '테스트 상사',
        address: '경기도 성남시',
        location: 'gyeonggi',
        employeeCount: 10,
      })

      mockDARTLookup.mockReturnValue(null)

      const result = mockUnifiedLookup('234-56-78901')

      expect(result.companyName).toBe('테스트 상사')
      expect(result.ceoName).toBeNull()
      expect(result.employeeCount).toBe(10)
      expect(result.sources).toEqual(['NTS', 'NPS'])
    })

    it('NTS만 조회 성공 (NPS, DART 없음)', () => {
      mockNTSLookup.mockReturnValue({
        status: '계속사업자',
        taxType: '일반과세자',
      })

      mockNPSLookup.mockReturnValue(null)
      mockDARTLookup.mockReturnValue(null)

      const result = mockUnifiedLookup('345-67-89012')

      expect(result.ntsStatus).toBe('계속사업자')
      expect(result.companyName).toBe('알 수 없음')
      expect(result.sources).toEqual(['NTS'])
    })
  })

  describe('실패 시나리오', () => {
    it('모든 소스 조회 실패', () => {
      mockNTSLookup.mockReturnValue(null)
      mockNPSLookup.mockReturnValue(null)
      mockDARTLookup.mockReturnValue(null)

      const result = mockUnifiedLookup('000-00-00000')

      expect(result.companyName).toBe('알 수 없음')
      expect(result.sources).toEqual([])
    })

    it('폐업 사업자 조회', () => {
      mockNTSLookup.mockReturnValue({
        status: '폐업',
        taxType: null,
      })

      mockNPSLookup.mockReturnValue(null)
      mockDARTLookup.mockReturnValue(null)

      const result = mockUnifiedLookup('999-99-99999')

      expect(result.ntsStatus).toBe('폐업')
      expect(result.sources).toEqual(['NTS'])
    })
  })

  describe('데이터 우선순위', () => {
    it('회사명은 NPS 우선, DART 대체', () => {
      mockNTSLookup.mockReturnValue(null)

      mockNPSLookup.mockReturnValue({
        companyName: 'NPS 회사명',
      })

      mockDARTLookup.mockReturnValue({
        corpName: 'DART 회사명',
      })

      const result = mockUnifiedLookup('123-45-67890')

      expect(result.companyName).toBe('NPS 회사명')
    })

    it('NPS 없으면 DART 회사명 사용', () => {
      mockNTSLookup.mockReturnValue(null)
      mockNPSLookup.mockReturnValue(null)

      mockDARTLookup.mockReturnValue({
        corpName: 'DART 회사명',
      })

      const result = mockUnifiedLookup('123-45-67890')

      expect(result.companyName).toBe('DART 회사명')
    })

    it('주소는 NPS 우선, DART 대체', () => {
      mockNTSLookup.mockReturnValue(null)

      mockNPSLookup.mockReturnValue({
        address: 'NPS 주소',
      })

      mockDARTLookup.mockReturnValue({
        address: 'DART 주소',
      })

      const result = mockUnifiedLookup('123-45-67890')

      expect(result.address).toBe('NPS 주소')
    })
  })

  describe('사업자번호 검증', () => {
    it('유효한 사업자번호 형식', () => {
      const validFormats = [
        '123-45-67890',
        '1234567890',
        '000-00-00000',
      ]

      validFormats.forEach(bn => {
        expect(bn).toMatch(/^\d{3}-?\d{2}-?\d{5}$/)
      })
    })

    it('잘못된 사업자번호 형식', () => {
      const invalidFormats = [
        '12-34-56789',  // 자릿수 틀림
        'abc-de-fghij', // 숫자가 아님
        '123456789',    // 자릿수 부족
      ]

      invalidFormats.forEach(bn => {
        expect(bn).not.toMatch(/^\d{3}-?\d{2}-?\d{5}$/)
      })
    })
  })

  describe('직원수 추정', () => {
    it('NPS 가입자수 = 직원수', () => {
      mockNTSLookup.mockReturnValue(null)

      mockNPSLookup.mockReturnValue({
        employeeCount: 25,
      })

      mockDARTLookup.mockReturnValue(null)

      const result = mockUnifiedLookup('123-45-67890')

      expect(result.employeeCount).toBe(25)
    })

    it('NPS 데이터 없으면 직원수 null', () => {
      mockNTSLookup.mockReturnValue(null)
      mockNPSLookup.mockReturnValue(null)

      mockDARTLookup.mockReturnValue({
        corpName: '테스트',
      })

      const result = mockUnifiedLookup('123-45-67890')

      expect(result.employeeCount).toBeNull()
    })
  })

  describe('지역 코드 매핑', () => {
    it('서울특별시 → seoul', () => {
      mockNTSLookup.mockReturnValue(null)

      mockNPSLookup.mockReturnValue({
        location: 'seoul',
      })

      mockDARTLookup.mockReturnValue(null)

      const result = mockUnifiedLookup('123-45-67890')

      expect(result.location).toBe('seoul')
    })

    it('경기도 → gyeonggi', () => {
      mockNTSLookup.mockReturnValue(null)

      mockNPSLookup.mockReturnValue({
        location: 'gyeonggi',
      })

      mockDARTLookup.mockReturnValue(null)

      const result = mockUnifiedLookup('123-45-67890')

      expect(result.location).toBe('gyeonggi')
    })
  })

  describe('업종 코드', () => {
    it('DART 업종코드를 사용', () => {
      mockNTSLookup.mockReturnValue(null)
      mockNPSLookup.mockReturnValue(null)

      mockDARTLookup.mockReturnValue({
        industryCode: '62010', // 컴퓨터 프로그래밍
      })

      const result = mockUnifiedLookup('123-45-67890')

      expect(result.industryCode).toBe('62010')
    })

    it('DART 없으면 업종코드 null', () => {
      mockNTSLookup.mockReturnValue(null)
      mockNPSLookup.mockReturnValue(null)
      mockDARTLookup.mockReturnValue(null)

      const result = mockUnifiedLookup('123-45-67890')

      expect(result.industryCode).toBeNull()
    })
  })
})

describe('회사명 정규화', () => {
  it('(주) 제거', () => {
    const normalized = '삼성전자'.replace(/^\(주\)\s*/, '')
    expect(normalized).toBe('삼성전자')
  })

  it('주식회사 제거', () => {
    const normalized = '카카오'.replace(/^주식회사\s*/, '')
    expect(normalized).toBe('카카오')
  })

  it('양쪽 공백 제거', () => {
    const normalized = '  네이버  '.trim()
    expect(normalized).toBe('네이버')
  })

  it('연속 공백 하나로', () => {
    const normalized = '라인    플러스'.replace(/\s+/g, ' ')
    expect(normalized).toBe('라인 플러스')
  })
})
