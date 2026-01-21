export * from './toss'
export * from './kakao'
export * from './naver'

import { PaymentMethod } from '@/types'

export const PAYMENT_PRICES = {
  proMonthly: 5000,          // Pro 월 구독 (커피 한 잔 가격)
  proYearly: 50000,          // Pro 연 구독 (2개월 무료)
  premiumMonthly: 50000,     // Premium 월 구독
  premiumYearly: 500000,     // Premium 연 구독 (2개월 무료)
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
