// 기업규모 추정 유틸리티
// 중소기업기본법 기준 참조

import type { CompanySizeType } from '../types'

// 업종별 중소기업 기준 (연매출 기준, 억원)
// 실제로는 3년 평균 매출액을 기준으로 함
const SME_REVENUE_LIMITS: Record<string, number> = {
  // 의류, 가구, 가죽, 기타 제조업: 1,500억 이하
  '제조업': 1500,
  '광업': 1000,
  '건설업': 1000,
  '운수 및 창고업': 1000,
  '정보통신업': 1000,
  '도매 및 소매업': 1000,
  '숙박 및 음식점업': 800,
  '금융 및 보험업': 400,
  '전문, 과학 및 기술 서비스업': 1000,
  '사업시설 관리, 사업 지원 및 임대 서비스업': 800,
  '보건업 및 사회복지 서비스업': 800,
  '교육 서비스업': 600,
  '예술, 스포츠 및 여가관련 서비스업': 600,
  '기타': 800,
}

// 업종별 소기업 기준 (연매출 기준, 억원)
const SMALL_REVENUE_LIMITS: Record<string, number> = {
  '제조업': 120,
  '광업': 120,
  '건설업': 120,
  '운수 및 창고업': 120,
  '정보통신업': 80,
  '도매 및 소매업': 80,
  '숙박 및 음식점업': 30,
  '전문, 과학 및 기술 서비스업': 80,
  '사업시설 관리, 사업 지원 및 임대 서비스업': 50,
  '기타': 50,
}

// 직원수 기반 간이 추정 기준
// 정확한 기준은 매출액이 필요하지만, 직원수로 대략적 추정
const EMPLOYEE_THRESHOLDS = {
  // 소기업 추정: 50인 미만
  small: 50,
  // 중소기업 추정: 300인 미만 (제조업은 500인)
  sme: 300,
  smeManufacturing: 500,
  // 중견기업 추정: 1000인 미만
  midsize: 1000,
}

/**
 * 직원수 기반 기업규모 추정
 *
 * @param employeeCount - 직원 수 (국민연금 가입자 수 기준)
 * @param businessType - 업태 (대분류)
 * @param annualRevenue - 연매출 (억원, 선택)
 * @returns 추정된 기업규모
 *
 * 참고: 실제 중소기업 판정은 3년 평균 매출액과 자산규모를 종합적으로 고려함
 * 직원수만으로는 정확한 판정이 어려우므로 '추정' 값임
 */
export function estimateCompanySize(
  employeeCount: number | null,
  businessType: string | null = null,
  annualRevenue: number | null = null
): CompanySizeType {
  // 데이터가 없으면 알 수 없음
  if (employeeCount === null && annualRevenue === null) {
    return '알 수 없음'
  }

  // 매출액 정보가 있으면 매출액 기준 판정
  if (annualRevenue !== null && businessType) {
    const smeLimit = SME_REVENUE_LIMITS[businessType] || SME_REVENUE_LIMITS['기타']
    const smallLimit = SMALL_REVENUE_LIMITS[businessType] || SMALL_REVENUE_LIMITS['기타']

    if (annualRevenue > smeLimit * 10) {
      return '대기업'
    } else if (annualRevenue > smeLimit) {
      return '중견기업'
    } else if (annualRevenue <= smallLimit) {
      return '소기업'
    } else {
      return '중기업'
    }
  }

  // 직원수만 있는 경우 직원수 기준 추정
  if (employeeCount !== null) {
    const isManufacturing = businessType === '제조업'
    const smeThreshold = isManufacturing
      ? EMPLOYEE_THRESHOLDS.smeManufacturing
      : EMPLOYEE_THRESHOLDS.sme

    if (employeeCount >= EMPLOYEE_THRESHOLDS.midsize) {
      return '대기업'
    } else if (employeeCount >= smeThreshold) {
      return '중견기업'
    } else if (employeeCount < EMPLOYEE_THRESHOLDS.small) {
      return '소기업'
    } else {
      return '중기업'
    }
  }

  return '알 수 없음'
}

/**
 * 기업규모에 따른 색상 반환 (UI용)
 */
export function getCompanySizeColor(size: CompanySizeType): string {
  switch (size) {
    case '소기업':
      return 'blue'
    case '중기업':
    case '중소기업':
      return 'green'
    case '중견기업':
      return 'orange'
    case '대기업':
      return 'red'
    default:
      return 'gray'
  }
}

/**
 * 기업규모 설명 반환
 */
export function getCompanySizeDescription(size: CompanySizeType): string {
  switch (size) {
    case '소기업':
      return '직원수 50인 미만 또는 연매출 80억원 이하 (추정)'
    case '중기업':
      return '직원수 50~300인 또는 연매출 80~1,000억원 (추정)'
    case '중소기업':
      return '중소기업기본법상 중소기업 (추정)'
    case '중견기업':
      return '직원수 300~1,000인 또는 연매출 1,000억원 초과 (추정)'
    case '대기업':
      return '직원수 1,000인 이상 또는 연매출 10,000억원 초과 (추정)'
    default:
      return '직원수 또는 매출 정보 없음'
  }
}
