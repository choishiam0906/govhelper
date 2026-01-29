/**
 * 사용자 행동 기반 추천 점수 계산
 *
 * 동일 카테고리/기관/업종의 공고에 대한 사용자 행동을 분석하여
 * 새로운 공고에 대한 관심도를 예측
 *
 * 점수 = 카테고리 선호도 + 기관 선호도 + 유사 공고 행동 가중치
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface BehaviorSignals {
  // 카테고리별 행동 집계
  categoryPreferences: Record<string, number> // category → 가중 점수
  // 기관별 행동 집계
  organizationPreferences: Record<string, number> // org → 가중 점수
  // 이미 본/저장/매칭/지원한 공고 ID
  interactedAnnouncementIds: Set<string>
}

// 행동별 가중치
const ACTION_WEIGHTS = {
  view: 1, // 조회
  save: 3, // 저장
  match: 5, // AI 매칭 요청
  matchHighScore: 8, // AI 매칭 80점 이상
  apply: 10, // 지원
}

/**
 * 사용자의 행동 신호 수집 (최근 30일)
 */
export async function collectBehaviorSignals(
  supabase: SupabaseClient,
  userId: string
): Promise<BehaviorSignals> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const cutoff = thirtyDaysAgo.toISOString()

  const categoryPreferences: Record<string, number> = {}
  const organizationPreferences: Record<string, number> = {}
  const interactedIds = new Set<string>()

  // Helper: 카테고리/기관 선호도 누적
  function addPreference(
    category: string | null,
    organization: string | null,
    weight: number
  ) {
    if (category) {
      categoryPreferences[category] =
        (categoryPreferences[category] || 0) + weight
    }
    if (organization) {
      organizationPreferences[organization] =
        (organizationPreferences[organization] || 0) + weight
    }
  }

  // 1. 조회 이력
  const { data: views } = await supabase
    .from('user_announcement_views')
    .select(
      'announcement_id, view_count, announcements!inner(category, organization)'
    )
    .eq('user_id', userId)
    .gte('last_viewed_at', cutoff)
    .limit(100)

  if (views) {
    for (const v of views) {
      interactedIds.add(v.announcement_id)
      const ann = (v as any).announcements
      const weight =
        Math.min(v.view_count, 5) * ACTION_WEIGHTS.view // 최대 5회까지만 반영
      addPreference(ann?.category, ann?.organization, weight)
    }
  }

  // 2. 저장 이력
  const { data: saves } = await supabase
    .from('saved_announcements')
    .select(
      'announcement_id, announcements!inner(category, organization)'
    )
    .eq('user_id', userId)
    .gte('created_at', cutoff)
    .limit(100)

  if (saves) {
    for (const s of saves) {
      interactedIds.add(s.announcement_id)
      const ann = (s as any).announcements
      addPreference(ann?.category, ann?.organization, ACTION_WEIGHTS.save)
    }
  }

  // 3. AI 매칭 이력
  const { data: matches } = await supabase
    .from('matches')
    .select(
      'announcement_id, match_score, announcements!inner(category, organization)'
    )
    .eq('user_id', userId)
    .gte('created_at', cutoff)
    .limit(100)

  if (matches) {
    for (const m of matches) {
      interactedIds.add(m.announcement_id)
      const ann = (m as any).announcements
      const weight =
        m.match_score >= 80
          ? ACTION_WEIGHTS.matchHighScore
          : ACTION_WEIGHTS.match
      addPreference(ann?.category, ann?.organization, weight)
    }
  }

  // 4. 지원 이력
  const { data: applications } = await supabase
    .from('application_tracking')
    .select(
      'announcement_id, announcements!inner(category, organization)'
    )
    .eq('user_id', userId)
    .gte('created_at', cutoff)
    .limit(50)

  if (applications) {
    for (const a of applications) {
      interactedIds.add(a.announcement_id)
      const ann = (a as any).announcements
      addPreference(
        ann?.category,
        ann?.organization,
        ACTION_WEIGHTS.apply
      )
    }
  }

  return {
    categoryPreferences,
    organizationPreferences,
    interactedAnnouncementIds: interactedIds,
  }
}

/**
 * 특정 공고에 대한 행동 기반 점수 계산 (0-30점)
 */
export function calculateBehaviorScore(
  announcement: {
    category: string | null
    organization: string | null
    id: string
  },
  signals: BehaviorSignals
): number {
  // 이미 상호작용한 공고는 중복 추천 방지 → -10 패널티
  if (signals.interactedAnnouncementIds.has(announcement.id)) {
    return -10
  }

  let score = 0

  // 1. 카테고리 선호도 (최대 15점)
  if (
    announcement.category &&
    signals.categoryPreferences[announcement.category]
  ) {
    const catScore = signals.categoryPreferences[announcement.category]
    // 정규화: 최대 가중치 대비 비율 * 15점
    const maxCat = Math.max(
      ...Object.values(signals.categoryPreferences),
      1
    )
    score += Math.round((catScore / maxCat) * 15)
  }

  // 2. 기관 선호도 (최대 10점)
  if (
    announcement.organization &&
    signals.organizationPreferences[announcement.organization]
  ) {
    const orgScore =
      signals.organizationPreferences[announcement.organization]
    const maxOrg = Math.max(
      ...Object.values(signals.organizationPreferences),
      1
    )
    score += Math.round((orgScore / maxOrg) * 10)
  }

  // 3. 행동 데이터가 있으면 기본 가산점 (5점)
  const totalInteractions = Object.values(
    signals.categoryPreferences
  ).reduce((a, b) => a + b, 0)
  if (totalInteractions > 0) {
    score += 5
  }

  return Math.min(score, 30) // 최대 30점
}
