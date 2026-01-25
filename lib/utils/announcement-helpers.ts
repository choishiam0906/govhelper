/**
 * 공고 관련 유틸리티 함수
 */

/**
 * 지원금액 파싱 결과
 */
export interface ParsedAmount {
  min: number | null
  max: number | null
  display: string
  raw: string | null
}

/**
 * 지원금액 문자열을 파싱하여 구조화된 데이터로 변환
 * @example
 * parseSupportAmount("최대 3억원") → { min: null, max: 300000000, display: "최대 3억원" }
 * parseSupportAmount("1천만원 ~ 5천만원") → { min: 10000000, max: 50000000, display: "1천만~5천만원" }
 * parseSupportAmount("78001000") → { min: null, max: 78001000, display: "약 7,800만원" }
 */
export function parseSupportAmount(amount: string | null | undefined): ParsedAmount {
  if (!amount || amount.trim() === '') {
    return { min: null, max: null, display: '미정', raw: null }
  }

  const raw = amount.trim()

  // 이미 포맷된 경우 그대로 사용
  if (raw.includes('미정') || raw.includes('별도') || raw.includes('협의')) {
    return { min: null, max: null, display: raw, raw }
  }

  // 숫자만 있는 경우 (예: "78001000")
  const numericOnly = raw.replace(/[^0-9]/g, '')
  if (numericOnly === raw && numericOnly.length > 0) {
    const value = parseInt(numericOnly, 10)
    return {
      min: null,
      max: value,
      display: formatKoreanCurrency(value),
      raw
    }
  }

  // 금액 추출 시도
  let min: number | null = null
  let max: number | null = null

  // 범위 패턴: "1억 ~ 3억", "1천만원~5천만원"
  const rangeMatch = raw.match(/([0-9,.]+\s*(?:억|천만|백만|만)?(?:원)?)\s*[~\-]\s*([0-9,.]+\s*(?:억|천만|백만|만)?(?:원)?)/i)
  if (rangeMatch) {
    min = parseKoreanAmount(rangeMatch[1])
    max = parseKoreanAmount(rangeMatch[2])
  } else {
    // 단일 금액 패턴
    const singleMatch = raw.match(/([0-9,.]+)\s*(억|천만|백만|만)?\s*원?/i)
    if (singleMatch) {
      const value = parseKoreanAmount(singleMatch[0])
      if (raw.includes('최대') || raw.includes('이내') || raw.includes('까지')) {
        max = value
      } else if (raw.includes('최소') || raw.includes('이상')) {
        min = value
      } else {
        max = value
      }
    }
  }

  // 표시 형식 생성
  let display = raw
  if (min !== null && max !== null) {
    display = `${formatKoreanCurrency(min)}~${formatKoreanCurrency(max)}`
  } else if (max !== null) {
    display = `최대 ${formatKoreanCurrency(max)}`
  } else if (min !== null) {
    display = `최소 ${formatKoreanCurrency(min)}`
  }

  return { min, max, display, raw }
}

/**
 * 한국어 금액 문자열을 숫자로 변환
 * @example
 * parseKoreanAmount("3억") → 300000000
 * parseKoreanAmount("5천만원") → 50000000
 * parseKoreanAmount("100만원") → 1000000
 */
export function parseKoreanAmount(amountStr: string): number | null {
  if (!amountStr) return null

  const str = amountStr.replace(/[,\s원]/g, '')

  // 억 단위
  const eokMatch = str.match(/([0-9.]+)\s*억/)
  if (eokMatch) {
    const eokValue = parseFloat(eokMatch[1]) * 100000000
    // 추가로 만 단위가 있는지 확인 (예: 1억 5천만)
    const manMatch = str.match(/억\s*([0-9.]+)\s*(?:천)?만/)
    if (manMatch) {
      const multiplier = str.includes('천만') ? 10000000 : 10000
      return eokValue + parseFloat(manMatch[1]) * multiplier
    }
    return eokValue
  }

  // 천만 단위
  const cheonmanMatch = str.match(/([0-9.]+)\s*천만/)
  if (cheonmanMatch) {
    return parseFloat(cheonmanMatch[1]) * 10000000
  }

  // 백만 단위
  const baekmanMatch = str.match(/([0-9.]+)\s*백만/)
  if (baekmanMatch) {
    return parseFloat(baekmanMatch[1]) * 1000000
  }

  // 만 단위
  const manMatch = str.match(/([0-9.]+)\s*만/)
  if (manMatch) {
    return parseFloat(manMatch[1]) * 10000
  }

  // 숫자만 있는 경우
  const numMatch = str.match(/([0-9,.]+)/)
  if (numMatch) {
    return parseFloat(numMatch[1].replace(/,/g, ''))
  }

  return null
}

/**
 * 숫자를 한국식 통화 형식으로 변환
 * @example
 * formatKoreanCurrency(300000000) → "3억원"
 * formatKoreanCurrency(78001000) → "약 7,800만원"
 * formatKoreanCurrency(50000000) → "5천만원"
 */
export function formatKoreanCurrency(value: number): string {
  if (value >= 100000000) {
    // 억 단위
    const eok = Math.floor(value / 100000000)
    const remainder = value % 100000000
    if (remainder >= 10000000) {
      const cheonman = Math.floor(remainder / 10000000)
      return `${eok}억 ${cheonman}천만원`
    }
    return `${eok}억원`
  } else if (value >= 10000000) {
    // 천만 단위
    const cheonman = Math.round(value / 10000000)
    return `${cheonman}천만원`
  } else if (value >= 1000000) {
    // 백만 단위
    const man = Math.round(value / 10000)
    return `약 ${man.toLocaleString()}만원`
  } else if (value >= 10000) {
    // 만 단위
    const man = Math.round(value / 10000)
    return `${man}만원`
  } else {
    return `${value.toLocaleString()}원`
  }
}

/**
 * D-day 계산
 */
export function getDaysLeft(endDate: string | null): number | null {
  if (!endDate) return null
  const end = new Date(endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

/**
 * 공고가 신규인지 확인 (3일 이내)
 */
export function isNewAnnouncement(createdAt: string | null): boolean {
  if (!createdAt) return false
  const created = new Date(createdAt)
  const today = new Date()
  const diff = Math.ceil((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  return diff <= 3
}

/**
 * 마감 임박 여부 확인
 */
export function isClosingSoon(endDate: string | null): boolean {
  const daysLeft = getDaysLeft(endDate)
  return daysLeft !== null && daysLeft <= 7 && daysLeft >= 0
}

/**
 * 마감 상태 정보 반환
 */
export interface DeadlineStatus {
  daysLeft: number | null
  label: string
  color: 'red' | 'orange' | 'yellow' | 'gray'
  isExpired: boolean
  isClosingSoon: boolean
}

export function getDeadlineStatus(endDate: string | null): DeadlineStatus {
  const daysLeft = getDaysLeft(endDate)

  if (daysLeft === null) {
    return {
      daysLeft: null,
      label: '기한 없음',
      color: 'gray',
      isExpired: false,
      isClosingSoon: false
    }
  }

  if (daysLeft < 0) {
    return {
      daysLeft,
      label: '마감',
      color: 'gray',
      isExpired: true,
      isClosingSoon: false
    }
  }

  if (daysLeft === 0) {
    return {
      daysLeft: 0,
      label: 'D-Day',
      color: 'red',
      isExpired: false,
      isClosingSoon: true
    }
  }

  if (daysLeft <= 3) {
    return {
      daysLeft,
      label: `D-${daysLeft}`,
      color: 'red',
      isExpired: false,
      isClosingSoon: true
    }
  }

  if (daysLeft <= 7) {
    return {
      daysLeft,
      label: `D-${daysLeft}`,
      color: 'orange',
      isExpired: false,
      isClosingSoon: true
    }
  }

  if (daysLeft <= 14) {
    return {
      daysLeft,
      label: `D-${daysLeft}`,
      color: 'yellow',
      isExpired: false,
      isClosingSoon: false
    }
  }

  return {
    daysLeft,
    label: `D-${daysLeft}`,
    color: 'gray',
    isExpired: false,
    isClosingSoon: false
  }
}

/**
 * 날짜 포맷팅
 */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * 간단한 날짜 포맷팅 (짧은 형식)
 */
export function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })
}
