/**
 * 통합 AI 모듈
 *
 * 우선순위:
 * 1. Groq (무료, 빠름, Llama 3.3 70B)
 * 2. Gemini (유료/무료 제한, 폴백)
 *
 * 임베딩은 Gemini만 지원 (Groq는 임베딩 미지원)
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

// Gemini 함수들 (폴백용)
import {
  streamWithGemini,
  analyzeMatchWithGemini,
  generateEmbedding,
  parseEligibilityCriteria as parseEligibilityCriteriaGemini,
  streamApplicationSection as streamApplicationSectionGemini,
  streamSectionImprovement as streamSectionImprovementGemini,
  parseEligibilityCriteriaBatch as parseEligibilityCriteriaBatchGemini,
} from './gemini'

// AI 프로바이더 타입
export type AIProvider = 'groq' | 'gemini'

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

/**
 * 스트리밍 응답 (Groq 우선)
 */
export async function* streamWithAI(prompt: string): AsyncGenerator<string, void, unknown> {
  const provider = getAvailableProvider()
  logProvider('streamWithAI', provider)

  if (provider === 'groq') {
    try {
      yield* streamWithGroq(prompt)
      return
    } catch (error) {
      console.warn('[AI] Groq failed, falling back to Gemini:', error)
    }
  }

  // Gemini 폴백
  yield* streamWithGemini(prompt)
}

/**
 * 매칭 분석 (Groq 우선)
 */
export async function analyzeMatch(
  announcementContent: string,
  companyProfile: string,
  businessPlan: string
): Promise<MatchAnalysis> {
  const provider = getAvailableProvider()
  logProvider('analyzeMatch', provider)

  if (provider === 'groq') {
    try {
      return await analyzeMatchWithGroq(announcementContent, companyProfile, businessPlan)
    } catch (error) {
      console.warn('[AI] Groq failed, falling back to Gemini:', error)
    }
  }

  // Gemini 폴백
  return await analyzeMatchWithGemini(announcementContent, companyProfile, businessPlan)
}

/**
 * 지원자격 파싱 (Groq 우선)
 */
export async function parseEligibilityCriteria(
  announcementTitle: string,
  announcementContent: string,
  targetCompany: string | null
): Promise<EligibilityCriteria> {
  const provider = getAvailableProvider()
  logProvider('parseEligibilityCriteria', provider)

  if (provider === 'groq') {
    try {
      return await parseEligibilityCriteriaWithGroq(announcementTitle, announcementContent, targetCompany)
    } catch (error) {
      console.warn('[AI] Groq failed, falling back to Gemini:', error)
    }
  }

  // Gemini 폴백
  return await parseEligibilityCriteriaGemini(announcementTitle, announcementContent, targetCompany)
}

/**
 * 지원서 섹션 스트리밍 생성 (Groq 우선)
 */
export async function* streamApplicationSection(
  section: string,
  announcementContent: string,
  companyProfile: string,
  businessPlan: string
): AsyncGenerator<string, void, unknown> {
  const provider = getAvailableProvider()
  logProvider('streamApplicationSection', provider)

  if (provider === 'groq') {
    try {
      yield* streamApplicationSectionWithGroq(section, announcementContent, companyProfile, businessPlan)
      return
    } catch (error) {
      console.warn('[AI] Groq failed, falling back to Gemini:', error)
    }
  }

  // Gemini 폴백
  yield* streamApplicationSectionGemini(section, announcementContent, companyProfile, businessPlan)
}

/**
 * 섹션 개선 스트리밍 (Groq 우선)
 */
export async function* streamSectionImprovement(
  section: string,
  currentContent: string,
  announcementContent: string,
  companyProfile: string
): AsyncGenerator<string, void, unknown> {
  const provider = getAvailableProvider()
  logProvider('streamSectionImprovement', provider)

  if (provider === 'groq') {
    try {
      yield* streamSectionImprovementWithGroq(section, currentContent, announcementContent, companyProfile)
      return
    } catch (error) {
      console.warn('[AI] Groq failed, falling back to Gemini:', error)
    }
  }

  // Gemini 폴백
  yield* streamSectionImprovementGemini(section, currentContent, announcementContent, companyProfile)
}

/**
 * 배치 지원자격 파싱 (Groq 우선)
 */
export async function parseEligibilityCriteriaBatch(
  announcements: Array<{
    id: string
    title: string
    content: string | null
    target_company: string | null
  }>
): Promise<Map<string, EligibilityCriteria>> {
  const provider = getAvailableProvider()
  logProvider('parseEligibilityCriteriaBatch', provider)

  if (provider === 'groq') {
    try {
      return await parseEligibilityCriteriaBatchWithGroq(announcements)
    } catch (error) {
      console.warn('[AI] Groq failed, falling back to Gemini:', error)
    }
  }

  // Gemini 폴백
  return await parseEligibilityCriteriaBatchGemini(announcements)
}

/**
 * 임베딩 생성 (Gemini 전용 - Groq는 임베딩 미지원)
 */
export { generateEmbedding } from './gemini'

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
