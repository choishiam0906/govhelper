// A/B 테스트 실험 설정
import type { ABExperiment } from './types'

/** Pro 플랜 가격 A/B 테스트 */
export const PRO_PRICE_EXPERIMENT: ABExperiment = {
  id: 'proPriceTest',
  name: 'Pro 플랜 가격 테스트',
  description: 'Pro 플랜 최적 가격점 발견을 위한 A/B 테스트 (₩5,000 vs ₩3,900)',
  variants: [
    {
      id: 'A',
      name: 'Control - ₩5,000',
      price: 5000,
      weight: 50,  // 50% 트래픽
    },
    {
      id: 'B',
      name: 'Test - ₩3,900',
      price: 3900,
      weight: 50,  // 50% 트래픽
    },
  ],
  status: 'running',
  startDate: '2026-01-27',
}

/** 모든 실험 목록 */
export const EXPERIMENTS: Record<string, ABExperiment> = {
  proPriceTest: PRO_PRICE_EXPERIMENT,
}

/** 실험 ID로 조회 */
export function getExperiment(experimentId: string): ABExperiment | null {
  return EXPERIMENTS[experimentId] || null
}

/** 활성 실험 목록 */
export function getActiveExperiments(): ABExperiment[] {
  return Object.values(EXPERIMENTS).filter(exp => exp.status === 'running')
}

/** A/B 테스트 활성화 여부 */
export function isABTestEnabled(): boolean {
  return process.env.AB_TEST_ENABLED === 'true' || process.env.NODE_ENV === 'development'
}
