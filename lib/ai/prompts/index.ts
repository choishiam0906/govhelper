/**
 * 프롬프트 버전 관리 시스템 - 진입점
 *
 * DB 기반 버전 관리 + 기존 prompts.ts 폴백 지원
 */

export * from './versions'
export * from './selector'

import {
  getActivePrompt,
  selectPromptForABTest,
  logPromptUsage,
  getPromptContent,
} from './selector'
import type { PromptType, PromptVersion } from './versions'

// 기존 프롬프트 임포트 (폴백용)
import {
  MATCHING_ANALYSIS_PROMPT,
  ELIGIBILITY_PARSING_PROMPT,
  APPLICATION_SECTION_PROMPT,
  SECTION_IMPROVEMENT_PROMPT,
  CHATBOT_PROMPT,
  EVALUATION_EXTRACTION_PROMPT,
  EVALUATION_BASED_MATCHING_PROMPT,
} from '../prompts'

/**
 * 기존 프롬프트 함수 맵
 * DB에서 프롬프트를 찾지 못할 경우 폴백으로 사용
 */
const LEGACY_PROMPTS: Record<PromptType, ((...args: unknown[]) => string) | null> = {
  matching_analysis: MATCHING_ANALYSIS_PROMPT as (...args: unknown[]) => string,
  eligibility_parsing: ELIGIBILITY_PARSING_PROMPT as (...args: unknown[]) => string,
  application_section: APPLICATION_SECTION_PROMPT as (...args: unknown[]) => string,
  section_improvement: SECTION_IMPROVEMENT_PROMPT as (...args: unknown[]) => string,
  chatbot: CHATBOT_PROMPT as (...args: unknown[]) => string,
  evaluation_extraction: EVALUATION_EXTRACTION_PROMPT as (...args: unknown[]) => string,
  evaluation_matching: EVALUATION_BASED_MATCHING_PROMPT as (...args: unknown[]) => string,
  application_score: null,  // DB 전용 (레거시 없음)
  section_guide: null,      // DB 전용 (레거시 없음)
}

/**
 * 프롬프트 가져오기 (버전 시스템 + 폴백)
 *
 * 1. DB에서 활성 버전 조회
 * 2. DB에 없으면 기존 prompts.ts 사용
 *
 * @param type 프롬프트 타입
 * @param args 프롬프트 인자
 * @param options 옵션
 * @returns 프롬프트 내용
 */
export async function getPrompt(
  type: PromptType,
  args?: unknown[],
  options?: {
    useABTest?: boolean  // A/B 테스트 활성화 여부
    useFallback?: boolean // 폴백 사용 여부 (기본: true)
  }
): Promise<string | null> {
  const useFallback = options?.useFallback !== false

  try {
    // DB에서 프롬프트 조회
    const version = options?.useABTest
      ? await selectPromptForABTest(type)
      : await getActivePrompt(type)

    if (version) {
      return getPromptContent(version, args)
    }

    // DB에 없으면 폴백 사용
    if (useFallback) {
      return getLegacyPrompt(type, args)
    }

    console.warn(`프롬프트를 찾을 수 없음: ${type}`)
    return null
  } catch (error) {
    // DB 오류 시 폴백
    if (useFallback) {
      console.warn(`프롬프트 조회 오류, 폴백 사용: ${type}`, error)
      return getLegacyPrompt(type, args)
    }

    console.error('프롬프트 조회 오류:', error)
    return null
  }
}

/**
 * 기존 프롬프트 가져오기 (폴백)
 */
function getLegacyPrompt(type: PromptType, args?: unknown[]): string | null {
  const legacyFn = LEGACY_PROMPTS[type]
  if (!legacyFn) {
    console.warn(`레거시 프롬프트 없음: ${type}`)
    return null
  }

  try {
    return legacyFn(...(args || []))
  } catch (error) {
    console.error(`레거시 프롬프트 실행 오류: ${type}`, error)
    return null
  }
}

/**
 * 프롬프트 사용 및 로그 기록
 *
 * @param type 프롬프트 타입
 * @param args 프롬프트 인자
 * @param userId 사용자 ID
 * @param useABTest A/B 테스트 활성화
 * @returns 프롬프트 내용 및 버전 ID
 */
export async function usePromptWithLogging(
  type: PromptType,
  args?: unknown[],
  userId?: string,
  useABTest = false
): Promise<{ content: string | null; versionId: string | null; isLegacy: boolean }> {
  const startTime = Date.now()
  let versionId: string | null = null

  try {
    const version = useABTest
      ? await selectPromptForABTest(type)
      : await getActivePrompt(type)

    if (version) {
      versionId = version.id
      const content = getPromptContent(version, args)
      const responseTime = Date.now() - startTime

      // 로그 기록 (비동기, 실패해도 무시)
      logPromptUsage({
        promptVersionId: versionId,
        userId,
        responseTime,
      }).catch((err) => console.error('로그 기록 실패:', err))

      return { content, versionId, isLegacy: false }
    }

    // 폴백 사용
    const legacyContent = getLegacyPrompt(type, args)
    return { content: legacyContent, versionId: null, isLegacy: true }
  } catch (error) {
    console.error('프롬프트 사용 오류:', error)

    // 에러 로그 기록
    if (versionId) {
      logPromptUsage({
        promptVersionId: versionId,
        userId,
        errorMessage: error instanceof Error ? error.message : '알 수 없는 오류',
      }).catch((err) => console.error('에러 로그 기록 실패:', err))
    }

    // 폴백 시도
    const legacyContent = getLegacyPrompt(type, args)
    return { content: legacyContent, versionId: null, isLegacy: true }
  }
}

/**
 * 프롬프트 사용 후 결과 점수 기록
 *
 * @param versionId 버전 ID (null이면 레거시 사용 중이라 기록 안 함)
 * @param score 결과 점수 (0-100)
 * @param userId 사용자 ID
 */
export async function recordPromptScore(
  versionId: string | null,
  score: number,
  userId?: string
): Promise<void> {
  if (!versionId) {
    // 레거시 프롬프트 사용 중이면 기록하지 않음
    return
  }

  await logPromptUsage({
    promptVersionId: versionId,
    userId,
    resultScore: score,
  })
}

/**
 * 직접 기존 프롬프트 사용 (버전 시스템 우회)
 * 마이그레이션 전 기존 코드 호환용
 */
export function useLegacyPrompt(
  type: PromptType,
  ...args: unknown[]
): string | null {
  return getLegacyPrompt(type, args)
}

/**
 * 프롬프트 버전 정보 포함하여 가져오기
 */
export async function getPromptWithVersion(
  type: PromptType,
  args?: unknown[],
  useABTest = false
): Promise<{
  content: string | null
  version: PromptVersion | null
  isLegacy: boolean
}> {
  try {
    const version = useABTest
      ? await selectPromptForABTest(type)
      : await getActivePrompt(type)

    if (version) {
      return {
        content: getPromptContent(version, args),
        version,
        isLegacy: false,
      }
    }

    return {
      content: getLegacyPrompt(type, args),
      version: null,
      isLegacy: true,
    }
  } catch (error) {
    console.error('프롬프트 조회 오류:', error)
    return {
      content: getLegacyPrompt(type, args),
      version: null,
      isLegacy: true,
    }
  }
}
