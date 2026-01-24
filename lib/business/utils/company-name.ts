/**
 * 회사명 정규화 유틸리티
 *
 * 사업자 정보 조회 시 다양한 소스의 회사명 표기를 통일하고
 * 검색/매칭 시 회사명 변형을 처리하기 위한 함수들
 */

// 법인 형태 표기 (정규식용)
const CORPORATION_PATTERNS = {
  // 약어 → 정식
  shortToFull: {
    '\\(주\\)': '주식회사',
    '\\(유\\)': '유한회사',
    '\\(합\\)': '합자회사',
    '\\(유한\\)': '유한회사',
    '\\(사\\)': '사단법인',
    '\\(재\\)': '재단법인',
  },
  // 정식 명칭들
  fullForms: [
    '주식회사',
    '유한회사',
    '합자회사',
    '합명회사',
    '유한책임회사',
    '사단법인',
    '재단법인',
    '협동조합',
  ],
  // 영문 표기
  englishForms: [
    'CO\\.,?\\s*LTD\\.?',
    'CORPORATION',
    'CORP\\.?',
    'INC\\.?',
    'LIMITED',
    'LTD\\.?',
  ],
}

/**
 * 회사명 정규화
 * - 법인 표기 제거
 * - 공백 정규화
 * - 특수문자 정리
 * - 영문 법인 표기 제거
 *
 * @param name - 원본 회사명
 * @returns 정규화된 회사명
 *
 * @example
 * normalizeCompanyName("(주) 삼성전자")             // "삼성전자"
 * normalizeCompanyName("주식회사 카카오")           // "카카오"
 * normalizeCompanyName("네이버 주식회사")           // "네이버"
 * normalizeCompanyName("SAMSUNG ELECTRONICS CO., LTD.") // "SAMSUNG ELECTRONICS"
 * normalizeCompanyName("(주)토스·뱅크")            // "토스뱅크"
 */
export function normalizeCompanyName(name: string): string {
  if (!name || typeof name !== 'string') {
    return ''
  }

  let normalized = name.trim()

  // 1. 법인 약어 제거 - (주), (유), (합) 등
  Object.entries(CORPORATION_PATTERNS.shortToFull).forEach(([pattern]) => {
    normalized = normalized.replace(new RegExp(pattern, 'gi'), '')
  })

  // 2. 정식 법인명 제거 - 주식회사, 유한회사 등
  CORPORATION_PATTERNS.fullForms.forEach((form) => {
    // 앞에 있는 경우
    normalized = normalized.replace(new RegExp(`^${form}\\s+`, 'gi'), '')
    // 뒤에 있는 경우
    normalized = normalized.replace(new RegExp(`\\s+${form}$`, 'gi'), '')
  })

  // 3. 영문 법인 표기 제거
  CORPORATION_PATTERNS.englishForms.forEach((pattern) => {
    normalized = normalized.replace(new RegExp(pattern, 'gi'), '')
  })

  // 4. 특수문자 정리
  // 가운데점(·) → 공백 제거
  normalized = normalized.replace(/·/g, '')
  // 괄호 제거 (남은 빈 괄호)
  normalized = normalized.replace(/\(\s*\)/g, '')
  // 마침표, 쉼표 (영문 표기 정리 후 남은 것들)
  normalized = normalized.replace(/[.,]/g, '')

  // 5. 공백 정규화 (연속된 공백 → 단일 공백)
  normalized = normalized.replace(/\s+/g, ' ')

  // 6. 양쪽 공백 제거
  normalized = normalized.trim()

  return normalized
}

/**
 * 회사명의 다양한 변형 생성 (검색/매칭용)
 *
 * @param name - 원본 회사명
 * @returns 변형된 회사명 배열 (중복 제거됨)
 *
 * @example
 * extractCompanyNameVariants("카카오")
 * // ["카카오", "주식회사 카카오", "(주)카카오", "카카오 주식회사", "카카오(주)"]
 *
 * extractCompanyNameVariants("삼성전자")
 * // ["삼성전자", "주식회사 삼성전자", "(주)삼성전자", "삼성전자 주식회사", "삼성전자(주)"]
 */
export function extractCompanyNameVariants(name: string): string[] {
  if (!name || typeof name !== 'string') {
    return []
  }

  const normalized = normalizeCompanyName(name)
  if (!normalized) {
    return []
  }

  const variants = new Set<string>()

  // 1. 정규화된 이름
  variants.add(normalized)

  // 2. 주식회사 변형
  variants.add(`주식회사 ${normalized}`)
  variants.add(`${normalized} 주식회사`)
  variants.add(`(주)${normalized}`)
  variants.add(`${normalized}(주)`)

  // 3. 유한회사 변형 (필요시)
  variants.add(`유한회사 ${normalized}`)
  variants.add(`${normalized} 유한회사`)
  variants.add(`(유)${normalized}`)
  variants.add(`${normalized}(유)`)

  // 4. 원본 이름도 포함 (이미 법인 표기가 있는 경우 대비)
  variants.add(name.trim())

  return Array.from(variants)
}

/**
 * 두 회사명의 유사도 계산
 * - 정규화 후 비교
 * - Levenshtein 거리 기반 유사도
 *
 * @param name1 - 첫 번째 회사명
 * @param name2 - 두 번째 회사명
 * @returns 유사도 점수 (0~1, 1이 완전 일치)
 *
 * @example
 * compareCompanyNames("주식회사 카카오", "카카오(주)")        // 1.0 (동일)
 * compareCompanyNames("카카오", "카카오뱅크")               // ~0.5 (부분 일치)
 * compareCompanyNames("삼성전자", "LG전자")                 // ~0.5 (부분 일치)
 * compareCompanyNames("네이버", "카카오")                   // 0 (불일치)
 */
export function compareCompanyNames(name1: string, name2: string): number {
  if (!name1 || !name2) {
    return 0
  }

  const normalized1 = normalizeCompanyName(name1).toLowerCase()
  const normalized2 = normalizeCompanyName(name2).toLowerCase()

  // 정규화 후 완전 일치
  if (normalized1 === normalized2) {
    return 1.0
  }

  // 한쪽이 다른 쪽을 포함
  if (
    normalized1.includes(normalized2) ||
    normalized2.includes(normalized1)
  ) {
    // 포함 관계 점수 = 짧은 문자열 길이 / 긴 문자열 길이
    const shorter = Math.min(normalized1.length, normalized2.length)
    const longer = Math.max(normalized1.length, normalized2.length)
    return shorter / longer
  }

  // Levenshtein 거리 기반 유사도
  const distance = levenshteinDistance(normalized1, normalized2)
  const maxLength = Math.max(normalized1.length, normalized2.length)

  // 유사도 = 1 - (거리 / 최대 길이)
  return Math.max(0, 1 - distance / maxLength)
}

/**
 * Levenshtein 거리 계산 (편집 거리)
 * - 두 문자열을 같게 만들기 위해 필요한 최소 편집 횟수
 *
 * @param str1 - 첫 번째 문자열
 * @param str2 - 두 번째 문자열
 * @returns 편집 거리
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length

  // DP 테이블 생성
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0))

  // 초기화
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  // DP 계산
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // 삭제
        matrix[i][j - 1] + 1, // 삽입
        matrix[i - 1][j - 1] + cost // 치환
      )
    }
  }

  return matrix[len1][len2]
}

/**
 * 회사명이 특정 법인 형태를 포함하는지 확인
 *
 * @param name - 회사명
 * @returns 법인 형태 또는 null
 *
 * @example
 * getCorporationType("주식회사 카카오")    // "주식회사"
 * getCorporationType("(주)네이버")         // "주식회사"
 * getCorporationType("카카오")             // null
 */
export function getCorporationType(name: string): string | null {
  if (!name) {
    return null
  }

  // 약어 체크
  for (const [pattern, fullForm] of Object.entries(
    CORPORATION_PATTERNS.shortToFull
  )) {
    if (new RegExp(pattern, 'i').test(name)) {
      return fullForm
    }
  }

  // 정식 명칭 체크
  for (const form of CORPORATION_PATTERNS.fullForms) {
    if (new RegExp(`\\b${form}\\b`, 'i').test(name)) {
      return form
    }
  }

  return null
}
