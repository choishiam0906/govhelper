/**
 * A/B 테스트 핵심 로직
 *
 * Pro 플랜 가격 A/B 테스트 (₩3,900 vs ₩5,000)
 * 사용자 ID 기반으로 일관된 variant 할당 (같은 유저는 항상 같은 가격)
 */

export type ABTestVariant = 'control' | 'variant_a' | 'variant_b'

export interface ABTestConfig {
  id: ABTestVariant
  label: string
  value: {
    proMonthly: number
    proYearly: number
  }
  weight: number // 가중치 (0-100)
}

export interface ABTest {
  id: string
  name: string
  variants: ABTestConfig[]
  isActive: boolean
}

/**
 * Pro 가격 A/B 테스트 설정
 * - control: 기존 ₩5,000
 * - variant_a: 할인 ₩3,900
 */
export const PRICING_AB_TEST: ABTest = {
  id: 'pricing_pro_202601',
  name: 'Pro 가격 테스트',
  isActive: true,
  variants: [
    {
      id: 'control',
      label: '기본 ₩5,000',
      value: { proMonthly: 5000, proYearly: 50000 },
      weight: 50,
    },
    {
      id: 'variant_a',
      label: '할인 ₩3,900',
      value: { proMonthly: 3900, proYearly: 39000 },
      weight: 50,
    },
  ],
}

/**
 * 간단한 해시 함수 (문자열 → 숫자)
 * userId와 testId를 조합하여 일관된 해시값 생성
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // 32bit integer로 변환
  }
  return Math.abs(hash)
}

/**
 * 사용자 ID 기반으로 일관된 variant 할당
 *
 * @param userId - 사용자 고유 ID (Supabase UUID)
 * @param test - A/B 테스트 설정
 * @returns 할당된 variant
 *
 * 동작 원리:
 * 1. userId + testId 해시 → 0~100 사이 숫자로 정규화
 * 2. 가중치 기반으로 variant 선택
 * 3. 같은 userId는 항상 같은 variant 반환
 */
export function getABTestVariant(userId: string, test: ABTest): ABTestVariant {
  // userId + testId 해시로 일관된 배정
  const hash = simpleHash(userId + test.id)
  const normalized = hash % 100

  let cumulative = 0
  for (const variant of test.variants) {
    cumulative += variant.weight
    if (normalized < cumulative) {
      return variant.id
    }
  }

  // 폴백: 첫 번째 variant
  return test.variants[0].id
}

/**
 * 현재 사용자의 Pro 가격 가져오기
 *
 * @param userId - 사용자 고유 ID
 * @returns Pro 가격 정보 및 variant
 *
 * 사용 예시:
 * ```typescript
 * const pricing = getProPricing(user.id)
 * console.log(pricing.proMonthly)  // 5000 or 3900
 * console.log(pricing.variant)     // 'control' or 'variant_a'
 * ```
 */
export function getProPricing(userId: string): {
  proMonthly: number
  proYearly: number
  variant: ABTestVariant
} {
  // A/B 테스트가 비활성화된 경우 기본값 반환
  if (!PRICING_AB_TEST.isActive) {
    return {
      proMonthly: 5000,
      proYearly: 50000,
      variant: 'control',
    }
  }

  // 사용자의 variant 계산
  const variant = getABTestVariant(userId, PRICING_AB_TEST)
  const config = PRICING_AB_TEST.variants.find((v) => v.id === variant)

  if (!config) {
    // 폴백: 기본값
    return {
      proMonthly: 5000,
      proYearly: 50000,
      variant: 'control',
    }
  }

  return {
    ...config.value,
    variant,
  }
}

/**
 * 특정 금액이 A/B 테스트에서 허용된 금액인지 검증
 *
 * @param amount - 검증할 금액
 * @param period - 'monthly' 또는 'yearly'
 * @returns 허용 여부
 *
 * 사용 예시: 결제 API에서 금액 검증
 * ```typescript
 * if (!isValidABTestAmount(3900, 'monthly')) {
 *   throw new Error('Invalid amount')
 * }
 * ```
 */
export function isValidABTestAmount(
  amount: number,
  period: 'monthly' | 'yearly'
): boolean {
  const field = period === 'monthly' ? 'proMonthly' : 'proYearly'

  return PRICING_AB_TEST.variants.some(
    (variant) => variant.value[field] === amount
  )
}
