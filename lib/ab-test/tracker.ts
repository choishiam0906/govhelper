/**
 * A/B 테스트 이벤트 추적
 *
 * GA4로 A/B 테스트 exposure 및 conversion 이벤트 전송
 */

import { ABTestVariant } from './index'

/**
 * A/B 테스트 노출 이벤트 기록
 *
 * @param testId - 테스트 ID (예: 'pricing_pro_202601')
 * @param variant - 사용자에게 노출된 variant
 *
 * 사용 시점: 사용자가 가격 페이지에 진입했을 때
 *
 * GA4 이벤트 파라미터:
 * - test_id: 테스트 ID
 * - variant: control | variant_a | variant_b
 */
export function trackABTestExposure(
  testId: string,
  variant: ABTestVariant
): void {
  if (typeof window === 'undefined') return

  // GA4 gtag 함수 호출
  const gtag = (window as any).gtag
  if (typeof gtag === 'function') {
    gtag('event', 'ab_test_exposure', {
      test_id: testId,
      variant: variant,
    })
  }
}

/**
 * A/B 테스트 전환 이벤트 기록
 *
 * @param testId - 테스트 ID
 * @param variant - 사용자의 variant
 * @param value - 결제 금액 (KRW)
 *
 * 사용 시점: 결제 완료 후
 *
 * GA4 이벤트 파라미터:
 * - test_id: 테스트 ID
 * - variant: control | variant_a | variant_b
 * - value: 결제 금액 (KRW)
 * - currency: KRW
 */
export function trackABTestConversion(
  testId: string,
  variant: ABTestVariant,
  value: number
): void {
  if (typeof window === 'undefined') return

  const gtag = (window as any).gtag
  if (typeof gtag === 'function') {
    gtag('event', 'ab_test_conversion', {
      test_id: testId,
      variant: variant,
      value: value,
      currency: 'KRW',
    })
  }
}

/**
 * Pro 플랜 결제 완료 추적 (편의 함수)
 *
 * @param variant - 사용자의 variant
 * @param amount - 결제 금액
 *
 * 사용 예시:
 * ```typescript
 * import { trackProPlanPurchase } from '@/lib/ab-test/tracker'
 *
 * // 결제 성공 후
 * trackProPlanPurchase('variant_a', 3900)
 * ```
 */
export function trackProPlanPurchase(
  variant: ABTestVariant,
  amount: number
): void {
  trackABTestConversion('pricing_pro_202601', variant, amount)
}
