/**
 * 공고 평가기준 타입 정의
 *
 * 정부지원사업 평가표를 구조화한 형태
 */

// 개별 평가항목
export interface EvaluationItem {
  category: string           // 대분류 (예: 기술성, 사업성, 시장성)
  name: string               // 평가항목명
  description?: string       // 평가항목 설명
  maxScore: number           // 배점 (최대 점수)
  weight?: number            // 가중치 (0-1)
  subItems?: EvaluationSubItem[]  // 세부 평가항목
}

// 세부 평가항목
export interface EvaluationSubItem {
  name: string               // 세부항목명
  description?: string       // 세부항목 설명
  maxScore: number           // 세부 배점
  keywords?: string[]        // 핵심 키워드 (지원서 작성 시 참고)
}

// 가점/감점 항목
export interface BonusItem {
  name: string               // 가점항목명
  score: number              // 가점 점수
  condition: string          // 가점 조건
  type: 'bonus' | 'penalty'  // 가점/감점 구분
}

// 전체 평가기준 구조
export interface EvaluationCriteria {
  // 기본 정보
  totalScore: number         // 총점 (보통 100점)
  passingScore?: number      // 합격 기준점

  // 평가항목
  items: EvaluationItem[]

  // 가점/감점
  bonusItems?: BonusItem[]

  // 평가 방식
  evaluationMethod?: {
    type: 'absolute' | 'relative'  // 절대평가/상대평가
    stages?: number                 // 심사 단계 수
    stageNames?: string[]           // 단계별 이름 (서류심사, 발표심사 등)
  }

  // 메타 정보
  extractedAt: string        // 추출 일시
  confidence: number         // AI 추출 신뢰도 (0-1)
  source?: string            // 추출 출처 (본문/첨부파일명)
}

// 평가기준 요약 (빠른 조회용)
export interface EvaluationSummary {
  totalScore: number
  categories: {
    name: string             // 대분류명
    maxScore: number         // 해당 분류 총점
    percentage: number       // 비중 (%)
  }[]
  hasBonusItems: boolean
  passingScore?: number
}

// AI 추출 결과
export interface EvaluationExtractionResult {
  success: boolean
  criteria?: EvaluationCriteria
  summary?: EvaluationSummary
  error?: string
  rawText?: string           // 평가기준 관련 원문 텍스트
}

// 매칭 점수 계산에 사용
export interface EvaluationBasedScore {
  category: string           // 평가 분류
  maxScore: number           // 최대 점수
  estimatedScore: number     // 예상 점수
  percentage: number         // 득점률 (%)
  reasons: string[]          // 점수 산정 이유
  improvements?: string[]    // 개선 제안
}

// 지원서 실시간 점수 피드백
export interface ApplicationScoreFeedback {
  section: string            // 지원서 섹션명
  relatedEvalItems: string[] // 관련 평가항목
  estimatedScore: number     // 예상 점수
  maxScore: number           // 해당 항목 최대 점수
  feedback: string           // AI 피드백
  suggestions: string[]      // 개선 제안
}
