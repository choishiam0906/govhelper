/**
 * 통합 AI 모듈
 *
 * 텍스트 생성:
 * - Groq ONLY (무료, 빠름, Llama 3.3 70B)
 * - Gemini 폴백 비활성화 (일일 20회 제한으로 인해)
 *
 * 임베딩 우선순위:
 * 1. Gemini (text-embedding-004, 768차원)
 * 2. Voyage AI (voyage-multilingual-2, 1024→768 조정, 폴백)
 */

import { MatchAnalysis, EligibilityCriteria } from '@/types'

// Groq 함수들
import {
  isGroqAvailable,
  streamWithGroq,
  analyzeMatchWithGroq,
  parseEligibilityCriteriaWithGroq,
  streamApplicationSectionWithGroq,
  streamSectionImprovementWithGroq,
  parseEligibilityCriteriaBatchWithGroq,
} from './groq'

// Gemini 함수들 (임베딩 전용)
import {
  streamWithGemini,
  analyzeMatchWithGemini,
  generateEmbedding as generateEmbeddingGemini,
  parseEligibilityCriteria as parseEligibilityCriteriaGemini,
  streamApplicationSection as streamApplicationSectionGemini,
  streamSectionImprovement as streamSectionImprovementGemini,
  parseEligibilityCriteriaBatch as parseEligibilityCriteriaBatchGemini,
} from './gemini'

// Voyage AI 함수들 (임베딩 폴백용)
import {
  isVoyageAvailable,
  generateEmbeddingWithVoyage,
} from './voyage'

// AI 프로바이더 타입
export type AIProvider = 'groq' | 'gemini'

// 재시도 설정
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1초

// 지수 백오프로 재시도
async function withRetry<T>(
  fn: () => Promise<T>,
  operation: string,
  maxRetries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      const isRateLimit = lastError.message?.includes('429') ||
                          lastError.message?.includes('rate') ||
                          lastError.message?.includes('quota')

      if (isRateLimit && attempt < maxRetries) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1)
        console.warn(`[AI] ${operation} rate limited, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      throw error
    }
  }

  throw lastError
}

// 현재 사용 가능한 프로바이더 확인
export function getAvailableProvider(): AIProvider {
  if (isGroqAvailable()) {
    return 'groq'
  }
  return 'gemini'
}

// 프로바이더 정보 로깅
function logProvider(functionName: string, provider: AIProvider) {
  console.log(`[AI] ${functionName} using ${provider.toUpperCase()}`)
}

// Groq 사용 가능 여부 체크 및 오류 메시지
function ensureGroqAvailable(operation: string): void {
  if (!isGroqAvailable()) {
    throw new Error(`[AI] ${operation}: GROQ_API_KEY가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요.`)
  }
}

/**
 * 스트리밍 응답 (Groq 전용)
 * Gemini는 일일 20회 제한으로 폴백 비활성화
 */
export async function* streamWithAI(prompt: string): AsyncGenerator<string, void, unknown> {
  ensureGroqAvailable('streamWithAI')
  logProvider('streamWithAI', 'groq')

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      yield* streamWithGroq(prompt)
      return
    } catch (error) {
      lastError = error as Error
      const isRateLimit = lastError.message?.includes('429') ||
                          lastError.message?.includes('rate') ||
                          lastError.message?.includes('quota')

      if (isRateLimit && attempt < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1)
        console.warn(`[AI] streamWithAI rate limited, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      console.error('[AI] Groq streaming failed:', error)
      throw new Error('AI 분석 서비스에 일시적인 문제가 발생했어요. 잠시 후 다시 시도해주세요.')
    }
  }

  throw lastError
}

/**
 * 매칭 분석 (Groq 전용)
 */
export async function analyzeMatch(
  announcementContent: string,
  companyProfile: string,
  businessPlan: string
): Promise<MatchAnalysis> {
  ensureGroqAvailable('analyzeMatch')
  logProvider('analyzeMatch', 'groq')

  return await withRetry(
    () => analyzeMatchWithGroq(announcementContent, companyProfile, businessPlan),
    'analyzeMatch'
  )
}

/**
 * 지원자격 파싱 (Groq 전용)
 */
export async function parseEligibilityCriteria(
  announcementTitle: string,
  announcementContent: string,
  targetCompany: string | null
): Promise<EligibilityCriteria> {
  ensureGroqAvailable('parseEligibilityCriteria')
  logProvider('parseEligibilityCriteria', 'groq')

  return await withRetry(
    () => parseEligibilityCriteriaWithGroq(announcementTitle, announcementContent, targetCompany),
    'parseEligibilityCriteria'
  )
}

/**
 * 지원서 섹션 스트리밍 생성 (Groq 전용)
 */
export async function* streamApplicationSection(
  section: string,
  announcementContent: string,
  companyProfile: string,
  businessPlan: string
): AsyncGenerator<string, void, unknown> {
  ensureGroqAvailable('streamApplicationSection')
  logProvider('streamApplicationSection', 'groq')

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      yield* streamApplicationSectionWithGroq(section, announcementContent, companyProfile, businessPlan)
      return
    } catch (error) {
      lastError = error as Error
      const isRateLimit = lastError.message?.includes('429') ||
                          lastError.message?.includes('rate') ||
                          lastError.message?.includes('quota')

      if (isRateLimit && attempt < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1)
        console.warn(`[AI] streamApplicationSection rate limited, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      console.error('[AI] Groq application section failed:', error)
      throw new Error('AI 지원서 생성에 일시적인 문제가 발생했어요. 잠시 후 다시 시도해주세요.')
    }
  }

  throw lastError
}

/**
 * 섹션 개선 스트리밍 (Groq 전용)
 */
export async function* streamSectionImprovement(
  section: string,
  currentContent: string,
  announcementContent: string,
  companyProfile: string
): AsyncGenerator<string, void, unknown> {
  ensureGroqAvailable('streamSectionImprovement')
  logProvider('streamSectionImprovement', 'groq')

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      yield* streamSectionImprovementWithGroq(section, currentContent, announcementContent, companyProfile)
      return
    } catch (error) {
      lastError = error as Error
      const isRateLimit = lastError.message?.includes('429') ||
                          lastError.message?.includes('rate') ||
                          lastError.message?.includes('quota')

      if (isRateLimit && attempt < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1)
        console.warn(`[AI] streamSectionImprovement rate limited, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      console.error('[AI] Groq section improvement failed:', error)
      throw new Error('AI 섹션 개선에 일시적인 문제가 발생했어요. 잠시 후 다시 시도해주세요.')
    }
  }

  throw lastError
}

/**
 * 배치 지원자격 파싱 (Groq 전용)
 */
export async function parseEligibilityCriteriaBatch(
  announcements: Array<{
    id: string
    title: string
    content: string | null
    target_company: string | null
  }>
): Promise<Map<string, EligibilityCriteria>> {
  ensureGroqAvailable('parseEligibilityCriteriaBatch')
  logProvider('parseEligibilityCriteriaBatch', 'groq')

  return await withRetry(
    () => parseEligibilityCriteriaBatchWithGroq(announcements),
    'parseEligibilityCriteriaBatch'
  )
}

/**
 * 임베딩 생성 (Gemini 우선, Voyage 폴백)
 * Groq는 임베딩 미지원
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // 1. Gemini 시도
  try {
    console.log('[AI] generateEmbedding using GEMINI')
    return await generateEmbeddingGemini(text)
  } catch (geminiError) {
    console.warn('[AI] Gemini embedding failed:', geminiError)
  }

  // 2. Voyage 폴백
  if (isVoyageAvailable()) {
    try {
      console.log('[AI] generateEmbedding falling back to VOYAGE')
      return await generateEmbeddingWithVoyage(text)
    } catch (voyageError) {
      console.error('[AI] Voyage embedding also failed:', voyageError)
    }
  }

  // 모두 실패
  throw new Error('All embedding providers failed (Gemini, Voyage)')
}

// 기존 Gemini 함수들도 직접 export (하위 호환성)
export {
  streamWithGemini,
  analyzeMatchWithGemini,
  parseEligibilityCriteria as parseEligibilityCriteriaGemini,
  streamApplicationSection as streamApplicationSectionGemini,
  streamSectionImprovement as streamSectionImprovementGemini,
} from './gemini'

// Groq 함수들도 직접 export
export {
  isGroqAvailable,
  streamWithGroq,
  analyzeMatchWithGroq,
  parseEligibilityCriteriaWithGroq,
  streamApplicationSectionWithGroq,
  streamSectionImprovementWithGroq,
} from './groq'

// Voyage 함수들도 직접 export (임베딩 백업용)
export {
  isVoyageAvailable,
  generateEmbeddingWithVoyage,
} from './voyage'
