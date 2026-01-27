/**
 * 프롬프트 버전 관리 시스템 사용 예시
 *
 * 기존 API 엔드포인트에서 버전 시스템을 활용하는 방법
 */

import { usePromptWithLogging, recordPromptScore } from './index'

/**
 * 예시 1: AI 매칭 분석 API에서 사용
 * 파일: app/api/matching/route.ts
 */
export async function exampleMatchingAPI(
  userId: string,
  announcementContent: string,
  companyProfile: string,
  businessPlan: string
) {
  // 1. 프롬프트 가져오기 (A/B 테스트 활성화)
  const { content: promptContent, versionId } = await usePromptWithLogging(
    'matching_analysis',
    [announcementContent, companyProfile, businessPlan],
    userId,
    true  // A/B 테스트 활성화
  )

  if (!promptContent || !versionId) {
    throw new Error('프롬프트 조회 실패')
  }

  // 2. AI에게 프롬프트 전달 (Gemini)
  const startTime = Date.now()
  const result = await callGeminiAPI(promptContent)
  const responseTime = Date.now() - startTime

  // 3. 결과 점수 기록
  const overallScore = result.overallScore || 0
  await recordPromptScore(versionId, overallScore, userId)

  return result
}

/**
 * 예시 2: 지원자격 파싱 API에서 사용
 * 파일: app/api/announcements/parse-eligibility/route.ts
 */
export async function exampleEligibilityParsingAPI(
  announcementTitle: string,
  announcementContent: string,
  targetCompany: string | null
) {
  // 1. 프롬프트 가져오기 (기본 활성 버전)
  const { content: promptContent, versionId } = await usePromptWithLogging(
    'eligibility_parsing',
    [announcementTitle, announcementContent, targetCompany]
  )

  if (!promptContent || !versionId) {
    throw new Error('프롬프트 조회 실패')
  }

  // 2. AI에게 프롬프트 전달
  const result = await callGeminiAPI(promptContent)

  // 3. 파싱 신뢰도(confidence)를 점수로 기록
  const confidence = result.confidence || 0
  await recordPromptScore(versionId, confidence * 100)

  return result
}

/**
 * 예시 3: 지원서 섹션 작성 API에서 사용
 * 파일: app/api/applications/stream/route.ts
 */
export async function exampleApplicationSectionAPI(
  userId: string,
  section: string,
  announcementContent: string,
  companyProfile: string,
  businessPlan: string
) {
  // 1. 프롬프트 가져오기
  const { content: promptContent, versionId } = await usePromptWithLogging(
    'application_section',
    [section, announcementContent, companyProfile, businessPlan],
    userId
  )

  if (!promptContent || !versionId) {
    throw new Error('프롬프트 조회 실패')
  }

  // 2. AI 스트리밍 응답
  const stream = await streamGeminiAPI(promptContent)

  // 3. 완료 후 사용자 만족도를 별도로 기록
  // (사용자가 "좋아요" 클릭 시 recordPromptScore 호출)

  return { stream, versionId }
}

/**
 * 예시 4: 챗봇 API에서 사용
 * 파일: app/api/chat/route.ts
 */
export async function exampleChatbotAPI(
  userId: string,
  userMessage: string,
  context?: {
    companyProfile?: string
    recentMatches?: string
    currentAnnouncement?: string
  }
) {
  // 1. 프롬프트 가져오기
  const { content: promptContent, versionId } = await usePromptWithLogging(
    'chatbot',
    [userMessage, context],
    userId
  )

  if (!promptContent || !versionId) {
    throw new Error('프롬프트 조회 실패')
  }

  // 2. AI 챗봇 응답
  const response = await callGeminiAPI(promptContent)

  // 3. 응답 품질을 자동으로 평가하여 기록
  const quality = evaluateResponseQuality(response)
  await recordPromptScore(versionId, quality, userId)

  return response
}

/**
 * 헬퍼: AI API 호출 (실제 구현은 lib/ai/gemini.ts 참고)
 */
async function callGeminiAPI(prompt: string): Promise<any> {
  // 실제 Gemini API 호출 로직
  throw new Error('구현 필요')
}

async function streamGeminiAPI(prompt: string): Promise<ReadableStream> {
  // 실제 Gemini Streaming API 호출 로직
  throw new Error('구현 필요')
}

/**
 * 헬퍼: 응답 품질 평가
 */
function evaluateResponseQuality(response: string): number {
  // 응답 길이, 구조, 키워드 등을 기반으로 품질 점수 계산
  const length = response.length
  if (length < 50) return 30
  if (length < 200) return 60
  return 85
}

/**
 * 예시 5: A/B 테스트 결과 분석
 */
export async function analyzeABTestResults() {
  const { getPromptMetrics } = await import('./index')

  // 매칭 분석 프롬프트의 모든 버전 메트릭 조회
  const metrics = await getPromptMetrics('matching_analysis')

  console.log('=== 매칭 분석 프롬프트 A/B 테스트 결과 ===')
  for (const metric of metrics) {
    console.log(`\n버전 ID: ${metric.versionId}`)
    console.log(`총 사용 횟수: ${metric.totalUsage}회`)
    console.log(`평균 매칭 점수: ${metric.averageScore.toFixed(2)}점`)
    console.log(`평균 응답 시간: ${metric.averageResponseTime.toFixed(0)}ms`)
    console.log(`성공률: ${metric.successRate.toFixed(1)}%`)
    console.log(`에러율: ${metric.errorRate.toFixed(1)}%`)
  }

  // 가장 성능이 좋은 버전 찾기
  const bestVersion = metrics.reduce((prev, curr) =>
    curr.averageScore > prev.averageScore ? curr : prev
  )

  console.log(`\n🏆 최고 성능 버전: ${bestVersion.versionId}`)
  console.log(`평균 점수: ${bestVersion.averageScore.toFixed(2)}점`)
}
