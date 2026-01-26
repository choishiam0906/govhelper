/**
 * 경쟁률 예측 타입 정의
 */

// 경쟁률 등급
export type CompetitionLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high'

// 예측 결과
export interface CompetitionPrediction {
  // 예상 경쟁률 등급
  level: CompetitionLevel
  // 예상 경쟁률 (예: 3.5:1)
  estimatedRatio: number
  // 신뢰도 (0-100)
  confidence: number
  // 예측 점수 (0-100, 높을수록 경쟁 치열)
  score: number
  // 영향 요인
  factors: CompetitionFactor[]
  // 유사 공고 분석
  similarAnalysis: SimilarAnnouncementAnalysis
  // 팁/조언
  tips: string[]
}

// 영향 요인
export interface CompetitionFactor {
  name: string
  impact: 'positive' | 'negative' | 'neutral' // 경쟁률에 미치는 영향
  weight: number // 가중치 (0-100)
  description: string
}

// 유사 공고 분석
export interface SimilarAnnouncementAnalysis {
  // 유사 공고 수
  count: number
  // 분석에 사용된 공고 ID
  announcementIds: string[]
  // 평균 지원금액
  avgSupportAmount?: number
  // 같은 기관 공고 수
  sameOrgCount: number
  // 같은 분류 공고 수
  sameCategoryCount: number
}

// 등급별 정보
export const COMPETITION_LEVELS: Record<CompetitionLevel, {
  label: string
  description: string
  color: string
  bgColor: string
  ratio: string
}> = {
  very_low: {
    label: '매우 낮음',
    description: '지원자가 적어 선정 가능성이 높아요',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    ratio: '~2:1',
  },
  low: {
    label: '낮음',
    description: '경쟁이 치열하지 않아요',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    ratio: '2~4:1',
  },
  medium: {
    label: '보통',
    description: '평균 수준의 경쟁이 예상돼요',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    ratio: '4~7:1',
  },
  high: {
    label: '높음',
    description: '경쟁이 치열해요. 충분한 준비가 필요해요',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    ratio: '7~12:1',
  },
  very_high: {
    label: '매우 높음',
    description: '인기 공고에요. 차별화된 전략이 필요해요',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    ratio: '12:1~',
  },
}

// API 응답
export interface CompetitionPredictionResponse {
  success: boolean
  data?: CompetitionPrediction
  error?: string
}
