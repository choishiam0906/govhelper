// 날짜 포맷팅
export function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// 남은 일수 계산
export function getDaysLeft(endDate: string | null) {
  if (!endDate) return null
  const end = new Date(endDate)
  const today = new Date()
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

// 지원금액 파싱 함수
export function parseAmount(amount: string | null): number {
  if (!amount) return 0
  const numStr = amount.replace(/[^0-9]/g, '')
  if (!numStr) return 0
  let value = parseInt(numStr, 10)
  if (amount.includes('억')) value *= 100000000
  else if (amount.includes('천만')) value *= 10000000
  else if (amount.includes('만')) value *= 10000
  return value
}

// 금액 포맷팅
export function formatMoney(value: number | null | undefined): string {
  if (!value) return '-'
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억원`
  if (value >= 10000) return `${(value / 10000).toFixed(0)}만원`
  return `${value.toLocaleString()}원`
}
