// 사용자 A/B 테스트 그룹 할당 로직
import { createClient } from '@/lib/supabase/server'
import { getExperiment, isABTestEnabled } from './config'
import type { ABVariant } from './types'

/**
 * 문자열을 해시하여 0-99 사이 숫자 반환
 * 동일한 입력은 항상 동일한 출력 (일관된 그룹 할당)
 */
function hashToNumber(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 32bit 정수로 변환
  }
  return Math.abs(hash) % 100
}

/**
 * 가중치 기반 변형 선택
 */
function selectVariantByWeight(variants: ABVariant[], hashValue: number): ABVariant {
  let cumulative = 0
  for (const variant of variants) {
    cumulative += variant.weight
    if (hashValue < cumulative) {
      return variant
    }
  }
  // 폴백: 마지막 변형
  return variants[variants.length - 1]
}

/**
 * 사용자에게 실험 그룹 할당
 * - 이미 할당된 경우 기존 그룹 반환
 * - 새 사용자는 해시 기반 할당
 */
export async function assignUserToExperiment(
  experimentId: string,
  userId: string
): Promise<{ variant: ABVariant; isNew: boolean } | null> {
  // A/B 테스트 비활성화 시 null
  if (!isABTestEnabled()) {
    return null
  }

  const experiment = getExperiment(experimentId)
  if (!experiment || experiment.status !== 'running') {
    return null
  }

  const supabase = await createClient()

  // 1. 기존 할당 확인 (테이블 미생성 시 타입 오류 방지)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('ab_assignments')
    .select('variant')
    .eq('experiment_id', experimentId)
    .eq('user_id', userId)
    .single() as { data: { variant: string } | null }

  if (existing) {
    const variant = experiment.variants.find(v => v.id === existing.variant)
    return variant ? { variant, isNew: false } : null
  }

  // 2. 새 할당 (해시 기반)
  const hashValue = hashToNumber(`${experimentId}:${userId}`)
  const selectedVariant = selectVariantByWeight(experiment.variants, hashValue)

  // 3. DB에 저장
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('ab_assignments')
    .insert({
      experiment_id: experimentId,
      user_id: userId,
      variant: selectedVariant.id,
    })

  return { variant: selectedVariant, isNew: true }
}

/**
 * 전환 이벤트 기록
 */
export async function recordConversion(
  experimentId: string,
  userId: string,
  eventType: 'purchase' | 'signup' | 'click',
  revenue?: number
): Promise<boolean> {
  if (!isABTestEnabled()) {
    return false
  }

  const supabase = await createClient()

  // 사용자 할당 정보 조회
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: assignment } = await (supabase as any)
    .from('ab_assignments')
    .select('variant')
    .eq('experiment_id', experimentId)
    .eq('user_id', userId)
    .single() as { data: { variant: string } | null }

  if (!assignment) {
    return false
  }

  // 전환 이벤트 저장
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('ab_conversions')
    .insert({
      experiment_id: experimentId,
      user_id: userId,
      variant: assignment.variant,
      event_type: eventType,
      revenue: revenue || 0,
    })

  return !error
}

/**
 * Pro 플랜 가격 조회 (A/B 테스트 적용)
 */
export async function getProPriceForUser(userId: string): Promise<number> {
  const result = await assignUserToExperiment('proPriceTest', userId)

  if (result?.variant.price) {
    return result.variant.price
  }

  // 기본 가격 (A/B 테스트 비활성화 또는 오류 시)
  return 5000
}

/**
 * 사용자의 현재 variant 조회
 */
export async function getUserVariant(
  experimentId: string,
  userId: string
): Promise<string | null> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('ab_assignments')
    .select('variant')
    .eq('experiment_id', experimentId)
    .eq('user_id', userId)
    .single() as { data: { variant: string } | null }

  return data?.variant || null
}
