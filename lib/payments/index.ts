export * from './toss'
export * from './kakao'
export * from './naver'

import { PaymentMethod } from '@/types'

export const PAYMENT_PRICES = {
  applicationDraft: 29900,  // 지원서 초안 작성 1회
  proMonthly: 50000,        // Pro 월 구독
  proYearly: 500000,        // Pro 연 구독
} as const

export function getPaymentMethodName(method: PaymentMethod): string {
  switch (method) {
    case 'toss':
      return '토스페이먼츠'
    case 'kakao':
      return '카카오페이'
    case 'naver':
      return '네이버페이'
    default:
      return '알 수 없음'
  }
}
