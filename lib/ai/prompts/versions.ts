/**
 * 프롬프트 버전 관리 시스템
 *
 * A/B 테스트 및 성능 추적을 위한 프롬프트 버전 관리
 */

/**
 * 프롬프트 타입 정의
 */
export type PromptType =
  | 'matching_analysis'       // AI 매칭 분석
  | 'eligibility_parsing'     // 지원자격 파싱
  | 'application_section'     // 지원서 섹션 작성
  | 'section_improvement'     // 섹션 개선
  | 'evaluation_extraction'   // 평가기준 추출
  | 'evaluation_matching'     // 평가기준 기반 매칭 분석
  | 'chatbot'                 // AI 챗봇
  | 'application_score'       // 지원서 점수 분석
  | 'section_guide'           // 섹션별 작성 가이드

/**
 * 프롬프트 버전 정의
 */
export interface PromptVersion {
  /** 버전 ID (v1, v2, v3 등) */
  id: string
  /** 프롬프트 타입 */
  type: PromptType
  /** 버전 번호 */
  version: string
  /** 프롬프트 내용 (함수 또는 문자열) */
  content: string | ((...args: any[]) => string)
  /** 활성화 여부 */
  isActive: boolean
  /** A/B 테스트 가중치 (0-100) */
  weight: number
  /** 버전 설명 */
  description: string
  /** 생성일 */
  createdAt: Date
}

/**
 * 프롬프트 설정
 */
export interface PromptConfig {
  /** 프롬프트 타입 */
  type: PromptType
  /** 사용 가능한 버전들 */
  versions: PromptVersion[]
  /** 기본 버전 ID */
  defaultVersion: string
}

/**
 * 프롬프트 사용 로그
 */
export interface PromptUsageLog {
  id?: string
  promptVersionId: string
  userId?: string
  resultScore?: number
  responseTime?: number
  errorMessage?: string
  createdAt?: Date
}

/**
 * 프롬프트 성능 메트릭
 */
export interface PromptMetrics {
  versionId: string
  totalUsage: number
  averageScore: number
  averageResponseTime: number
  errorRate: number
  successRate: number
}
