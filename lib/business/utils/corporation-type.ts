// 법인형태 추정 유틸리티
// 회사명에서 법인형태를 추출

import type { CorporationType, NTSTaxType } from '../types'

// 회사명 패턴 → 법인형태 매핑
const CORPORATION_PATTERNS: Array<{
  patterns: string[]
  type: CorporationType
}> = [
  {
    patterns: ['주식회사', '(주)', '㈜'],
    type: '주식회사',
  },
  {
    patterns: ['유한회사', '(유)', '㈲'],
    type: '유한회사',
  },
  {
    patterns: ['유한책임회사', 'LLC', 'L.L.C'],
    type: '유한책임회사',
  },
  {
    patterns: ['합명회사'],
    type: '합명회사',
  },
  {
    patterns: ['합자회사'],
    type: '합자회사',
  },
  {
    patterns: ['사단법인', '재단법인', '사회적협동조합', '협동조합', '비영리', 'NPO', '학교법인', '의료법인'],
    type: '비영리법인',
  },
  {
    patterns: ['유한공사', '외국법인'],
    type: '외국법인',
  },
]

/**
 * 회사명에서 법인형태 추정
 *
 * @param companyName - 회사명
 * @param taxType - 과세유형 (국세청, 선택)
 * @returns 추정된 법인형태
 *
 * @example
 * inferCorporationType('주식회사 카카오') // '주식회사'
 * inferCorporationType('(주)네이버') // '주식회사'
 * inferCorporationType('김철수 세무사무소') // '개인사업자'
 */
export function inferCorporationType(
  companyName: string | null,
  taxType: NTSTaxType | null = null
): CorporationType {
  // 과세유형이 비영리법인이면 비영리법인
  if (
    taxType === '비영리법인 또는 국가기관' ||
    taxType === '수익사업을 영위하지 않는 비영리법인'
  ) {
    return '비영리법인'
  }

  if (!companyName) {
    return '알 수 없음'
  }

  const name = companyName.trim()

  // 패턴 매칭
  for (const { patterns, type } of CORPORATION_PATTERNS) {
    for (const pattern of patterns) {
      if (name.includes(pattern)) {
        return type
      }
    }
  }

  // 법인명에 법인 표기가 없으면 개인사업자로 추정
  // (법인은 보통 주식회사, 유한회사 등이 포함됨)
  // 단, 이름만으로 정확히 판단하기 어려우므로 '기타'로 반환할 수도 있음

  // 개인 이름 패턴 (성 1자 + 이름 2자)
  const personalNamePattern = /^[가-힣]{2,4}$/
  if (personalNamePattern.test(name)) {
    return '개인사업자'
  }

  // 개인사업자 표기 패턴
  if (
    name.includes('사무소') ||
    name.includes('공인') ||
    name.includes('세무') ||
    name.includes('회계') ||
    name.includes('법무')
  ) {
    return '개인사업자'
  }

  // 그 외에는 개인사업자로 추정
  // (법인은 대부분 법인명에 표기가 있음)
  return '개인사업자'
}

/**
 * 법인형태에 따른 설명 반환
 */
export function getCorporationTypeDescription(type: CorporationType): string {
  switch (type) {
    case '주식회사':
      return '주식 발행을 통해 자본을 조달하는 법인'
    case '유한회사':
      return '출자지분이 주식이 아닌 지분인 법인'
    case '유한책임회사':
      return '출자자가 유한책임을 지는 인적회사와 물적회사의 혼합형태'
    case '합명회사':
      return '무한책임사원으로만 구성된 인적회사'
    case '합자회사':
      return '무한책임사원과 유한책임사원으로 구성된 회사'
    case '개인사업자':
      return '개인이 운영하는 사업체'
    case '비영리법인':
      return '영리를 목적으로 하지 않는 법인 (사단법인, 재단법인 등)'
    case '외국법인':
      return '외국에 본점을 둔 법인'
    default:
      return '법인형태를 확인할 수 없음'
  }
}

/**
 * 법인형태에 따른 색상 반환 (UI용)
 */
export function getCorporationTypeColor(type: CorporationType): string {
  switch (type) {
    case '주식회사':
      return 'blue'
    case '유한회사':
    case '유한책임회사':
      return 'green'
    case '합명회사':
    case '합자회사':
      return 'purple'
    case '개인사업자':
      return 'orange'
    case '비영리법인':
      return 'pink'
    case '외국법인':
      return 'cyan'
    default:
      return 'gray'
  }
}
