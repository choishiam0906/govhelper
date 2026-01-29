/**
 * AI 매칭 점수 캘리브레이션
 *
 * AI가 과대평가하는 경향을 보정하고,
 * 피드백 데이터 기반으로 점수를 조정
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface CalibrationConfig {
  // 사업계획서 없을 때 감점 비율 (0-1)
  noPlanPenalty: number
  // 기업 정보 불완전 시 감점 비율
  incompleteProfilePenalty: number
  // 최소/최대 점수 범위
  minScore: number
  maxScore: number
}

export const DEFAULT_CONFIG: CalibrationConfig = {
  noPlanPenalty: 0.15,
  incompleteProfilePenalty: 0.10,
  minScore: 0,
  maxScore: 100,
}

/**
 * AI 원본 점수를 캘리브레이션하여 보정된 점수 반환
 */
export function calibrateScore(
  rawScore: number,
  options: {
    hasBusinessPlan: boolean
    hasRAGContext: boolean
    companyProfileCompleteness: number // 0-1 (입력된 필드 비율)
    eligibilityPassed: boolean
  },
  config: CalibrationConfig = DEFAULT_CONFIG
): number {
  if (!options.eligibilityPassed) return 0

  let calibrated = rawScore

  // 1. 사업계획서 없으면 감점
  if (!options.hasBusinessPlan && !options.hasRAGContext) {
    calibrated *= (1 - config.noPlanPenalty)
  }

  // 2. 기업 프로필 불완전하면 감점
  if (options.companyProfileCompleteness < 0.7) {
    const penalty = config.incompleteProfilePenalty * (1 - options.companyProfileCompleteness)
    calibrated *= (1 - penalty)
  }

  // 3. 과대평가 보정 (시그모이드 스쿼싱)
  // 85점 이상은 압축
  if (calibrated > 85) {
    calibrated = 85 + (calibrated - 85) * 0.5
  }

  // 4. 범위 클램핑
  return Math.max(config.minScore, Math.min(config.maxScore, Math.round(calibrated)))
}

/**
 * 기업 프로필 완성도 계산
 */
export function calculateProfileCompleteness(company: {
  industry: string | null
  location: string | null
  employee_count: number | null
  annual_revenue: number | null
  founded_date: string | null
  certifications: string[] | null
  description: string | null
}): number {
  const fields = [
    company.industry,
    company.location,
    company.employee_count,
    company.annual_revenue,
    company.founded_date,
    company.certifications && company.certifications.length > 0 ? 'has' : null,
    company.description,
  ]
  const filled = fields.filter(f => f !== null && f !== undefined).length
  return filled / fields.length
}

/**
 * 피드백 데이터 기반 캘리브레이션 오프셋 계산
 * 최근 100개 피드백에서 평균 방향성을 분석
 */
export async function getFeedbackCalibrationOffset(
  supabase: SupabaseClient
): Promise<number> {
  try {
    const { data } = await (supabase as any)
      .from('match_feedback')
      .select('score_direction, accuracy_rating')
      .order('created_at', { ascending: false })
      .limit(100)

    if (!data || data.length < 10) return 0 // 최소 10개 피드백 필요

    let offset = 0
    let count = 0

    for (const feedback of data) {
      if (feedback.score_direction === 'too_high') {
        // 과대평가 -> 점수 낮춰야 함
        offset -= (6 - feedback.accuracy_rating)
        count++
      } else if (feedback.score_direction === 'too_low') {
        // 과소평가 -> 점수 높여야 함
        offset += (6 - feedback.accuracy_rating)
        count++
      }
    }

    if (count === 0) return 0

    // 평균 오프셋 (최대 +/-10점)
    const avgOffset = offset / count
    return Math.max(-10, Math.min(10, Math.round(avgOffset)))
  } catch {
    return 0
  }
}
