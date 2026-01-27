/**
 * 프롬프트 선택 로직
 *
 * 활성 버전 조회, A/B 테스트용 무작위 선택, 성능 메트릭 기록
 */

import { createClient } from '@/lib/supabase/server'
import type { PromptType, PromptVersion, PromptUsageLog, PromptMetrics } from './versions'

// 프롬프트 버전 DB 레코드 타입
interface PromptVersionRecord {
  id: string
  prompt_type: string
  version: string
  content: string
  is_active: boolean
  weight: number
  description: string | null
  created_at: string
}

// 사용 로그 DB 레코드 타입
interface PromptUsageRecord {
  prompt_version_id: string
  result_score: number | null
  response_time: number | null
  error_message: string | null
}

/**
 * 활성 프롬프트 버전 조회 (기본 버전 반환)
 */
export async function getActivePrompt(
  type: PromptType
): Promise<PromptVersion | null> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('prompt_versions')
    .select('*')
    .eq('prompt_type', type)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single() as { data: PromptVersionRecord | null; error: unknown }

  if (error || !data) {
    console.error('활성 프롬프트 조회 실패:', error)
    return null
  }

  return {
    id: data.id,
    type: data.prompt_type as PromptType,
    version: data.version,
    content: data.content,
    isActive: data.is_active,
    weight: data.weight,
    description: data.description || '',
    createdAt: new Date(data.created_at),
  }
}

/**
 * A/B 테스트용 무작위 버전 선택
 * 가중치 기반 확률 분포 사용
 */
export async function selectPromptForABTest(
  type: PromptType
): Promise<PromptVersion | null> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: versions, error } = await (supabase as any)
    .from('prompt_versions')
    .select('*')
    .eq('prompt_type', type)
    .eq('is_active', true) as { data: PromptVersionRecord[] | null; error: unknown }

  if (error || !versions || versions.length === 0) {
    console.error('A/B 테스트용 프롬프트 조회 실패:', error)
    return null
  }

  // 가중치 기반 무작위 선택
  const totalWeight = versions.reduce((sum, v) => sum + v.weight, 0)
  const random = Math.random() * totalWeight

  let cumulativeWeight = 0
  for (const version of versions) {
    cumulativeWeight += version.weight
    if (random <= cumulativeWeight) {
      return {
        id: version.id,
        type: version.prompt_type as PromptType,
        version: version.version,
        content: version.content,
        isActive: version.is_active,
        weight: version.weight,
        description: version.description || '',
        createdAt: new Date(version.created_at),
      }
    }
  }

  // 폴백: 첫 번째 버전 반환
  const firstVersion = versions[0]
  return {
    id: firstVersion.id,
    type: firstVersion.prompt_type as PromptType,
    version: firstVersion.version,
    content: firstVersion.content,
    isActive: firstVersion.is_active,
    weight: firstVersion.weight,
    description: firstVersion.description || '',
    createdAt: new Date(firstVersion.created_at),
  }
}

/**
 * 프롬프트 사용 로그 기록
 */
export async function logPromptUsage(
  log: PromptUsageLog
): Promise<void> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('prompt_usage_logs')
    .insert({
      prompt_version_id: log.promptVersionId,
      user_id: log.userId || null,
      result_score: log.resultScore || null,
      response_time: log.responseTime || null,
      error_message: log.errorMessage || null,
    })

  if (error) {
    console.error('프롬프트 사용 로그 기록 실패:', error)
  }
}

/**
 * 버전별 성능 메트릭 조회
 */
export async function getPromptMetrics(
  type: PromptType,
  versionId?: string
): Promise<PromptMetrics[]> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('prompt_usage_logs')
    .select(`
      prompt_version_id,
      result_score,
      response_time,
      error_message,
      prompt_versions!inner(prompt_type, version)
    `)
    .eq('prompt_versions.prompt_type', type)

  if (versionId) {
    query = query.eq('prompt_version_id', versionId)
  }

  const { data, error } = await query as { data: PromptUsageRecord[] | null; error: unknown }

  if (error || !data) {
    console.error('프롬프트 메트릭 조회 실패:', error)
    return []
  }

  // 버전별 그룹화 및 통계 계산
  const metricsMap = new Map<string, {
    totalUsage: number
    totalScore: number
    totalResponseTime: number
    errorCount: number
  }>()

  for (const log of data) {
    const vId = log.prompt_version_id
    if (!metricsMap.has(vId)) {
      metricsMap.set(vId, {
        totalUsage: 0,
        totalScore: 0,
        totalResponseTime: 0,
        errorCount: 0,
      })
    }

    const metrics = metricsMap.get(vId)!
    metrics.totalUsage += 1
    if (log.result_score !== null) {
      metrics.totalScore += log.result_score
    }
    if (log.response_time !== null) {
      metrics.totalResponseTime += log.response_time
    }
    if (log.error_message) {
      metrics.errorCount += 1
    }
  }

  // 결과 변환
  return Array.from(metricsMap.entries()).map(([vId, stats]) => ({
    versionId: vId,
    totalUsage: stats.totalUsage,
    averageScore: stats.totalUsage > 0 ? stats.totalScore / stats.totalUsage : 0,
    averageResponseTime: stats.totalUsage > 0 ? stats.totalResponseTime / stats.totalUsage : 0,
    errorRate: stats.totalUsage > 0 ? (stats.errorCount / stats.totalUsage) * 100 : 0,
    successRate: stats.totalUsage > 0 ? ((stats.totalUsage - stats.errorCount) / stats.totalUsage) * 100 : 0,
  }))
}

/**
 * 프롬프트 내용 가져오기 (함수형 프롬프트 지원)
 */
export function getPromptContent(
  version: PromptVersion,
  args?: unknown[]
): string {
  if (typeof version.content === 'function') {
    return version.content(...(args || []))
  }
  return version.content
}
