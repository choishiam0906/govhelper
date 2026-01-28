// 공고 상세 페이지에서 사용하는 유틸리티 함수

/**
 * 콘텐츠에서 원본 URL 추출
 */
export function extractSourceUrl(content: string | null): string | null {
  if (!content) return null

  const patterns = [
    /상세보기\s*:\s*(https?:\/\/[^\s<>"]+)/i,
    /원문\s*:\s*(https?:\/\/[^\s<>"]+)/i,
    /원본\s*링크\s*:\s*(https?:\/\/[^\s<>"]+)/i,
  ]

  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * 콘텐츠에서 상세보기 URL 부분 제거
 */
export function removeSourceUrlFromContent(content: string | null): string | null {
  if (!content) return null

  return content
    .replace(/상세보기\s*:\s*https?:\/\/[^\s<>"]+/gi, '')
    .replace(/원문\s*:\s*https?:\/\/[^\s<>"]+/gi, '')
    .replace(/원본\s*링크\s*:\s*https?:\/\/[^\s<>"]+/gi, '')
    .trim()
}

/**
 * 날짜 포맷팅 (긴 형식)
 */
export function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * 날짜 포맷팅 (짧은 형식)
 */
export function formatDateShort(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * 마감일까지 남은 일수 계산
 */
export function getDaysLeft(endDate: string | null) {
  if (!endDate) return null
  const end = new Date(endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

/**
 * 지원금액 포맷팅
 */
export function formatAmount(amount: string | null): string {
  if (!amount) return '미정'

  // 이미 형식화된 경우
  if (amount.includes('억') || amount.includes('만') || amount.includes('원')) {
    return amount
  }

  // 숫자만 있는 경우
  const numericStr = amount.replace(/[^0-9]/g, '')
  if (numericStr) {
    const value = parseInt(numericStr, 10)
    if (value >= 100000000) {
      const eok = Math.floor(value / 100000000)
      return `${eok}억원`
    } else if (value >= 10000000) {
      const cheonman = Math.round(value / 10000000)
      return `${cheonman}천만원`
    } else if (value >= 10000) {
      const man = Math.round(value / 10000)
      return `약 ${man.toLocaleString()}만원`
    }
    return `${value.toLocaleString()}원`
  }

  return amount
}
