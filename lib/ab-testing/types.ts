// A/B 테스트 타입 정의

/** 실험 변형 */
export interface ABVariant {
  id: string           // 'A' | 'B'
  name: string         // 'Control' | 'Test'
  price?: number       // 가격 (원)
  weight: number       // 트래픽 비율 (0-100)
}

/** 실험 설정 */
export interface ABExperiment {
  id: string           // 'proPriceTest'
  name: string         // '프로 플랜 가격 테스트'
  description: string
  variants: ABVariant[]
  status: 'draft' | 'running' | 'paused' | 'completed'
  startDate?: string
  endDate?: string
}

/** 사용자 할당 */
export interface ABAssignment {
  id: string
  experimentId: string
  userId: string
  variant: string      // 'A' | 'B'
  createdAt: string
}

/** 전환 이벤트 */
export interface ABConversion {
  id: string
  experimentId: string
  userId: string
  variant: string
  eventType: 'purchase' | 'signup' | 'click'
  revenue?: number
  createdAt: string
}

/** 실험 결과 통계 */
export interface ABResult {
  variantId: string
  variantName: string
  assignments: number      // 할당된 사용자 수
  conversions: number      // 전환 수
  conversionRate: number   // 전환율 (0-1)
  totalRevenue: number     // 총 매출
  averageRevenue: number   // 평균 매출
}

/** 통계적 유의성 */
export interface ABStatistics {
  chiSquare: number        // 카이제곱 값
  pValue: number           // p-value
  significantAt5Percent: boolean
  significantAt10Percent: boolean
  winner?: string          // 승자 variant ID
}
