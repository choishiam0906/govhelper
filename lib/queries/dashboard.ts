import { SupabaseClient } from '@supabase/supabase-js'

// 프로모션 설정: 2026년 6월 30일까지 모든 사용자 Pro 무료
export const PROMOTION_CONFIG = {
  enabled: true,
  endDate: new Date('2026-06-30T23:59:59+09:00'), // KST
  name: '얼리버드 프로모션',
  description: '2026년 6월 30일까지 모든 분들께 Pro 플랜을 무료로 제공합니다!',
}

// 프로모션 기간인지 확인
export function isPromotionActive(): boolean {
  if (!PROMOTION_CONFIG.enabled) return false
  return new Date() < PROMOTION_CONFIG.endDate
}

// 프로모션 남은 일수 계산
export function getPromotionDaysRemaining(): number {
  const now = new Date()
  const end = PROMOTION_CONFIG.endDate
  const diff = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// 대시보드 통계 조회
export async function getDashboardStats(
  supabase: SupabaseClient,
  userId: string,
  companyId: string
) {
  // 병렬로 쿼리 실행
  const [matchesResult, applicationsResult, savedResult, subscriptionResult] =
    await Promise.all([
      // 매칭 결과 수
      supabase
        .from('matches')
        .select('id, match_score', { count: 'exact' })
        .eq('company_id', companyId),

      // 지원서 수
      supabase
        .from('applications')
        .select('id, status', { count: 'exact' })
        .eq('user_id', userId),

      // 저장된 공고 수
      supabase
        .from('saved_announcements')
        .select('id', { count: 'exact' })
        .eq('user_id', userId),

      // 구독 정보
      supabase
        .from('subscriptions')
        .select('plan, status, current_period_end')
        .eq('user_id', userId)
        .single(),
    ])

  // 평균 매칭점수 계산
  const matches = matchesResult.data || []
  const avgMatchScore =
    matches.length > 0
      ? Math.round(
          matches.reduce((sum, m) => sum + (m.match_score || 0), 0) / matches.length
        )
      : 0

  // 진행 중인 지원서 수
  const inProgressApplications = (applicationsResult.data || []).filter(
    (a) => a.status === 'draft'
  ).length

  return {
    matchesCount: matchesResult.count || 0,
    avgMatchScore,
    applicationsCount: applicationsResult.count || 0,
    inProgressApplications,
    savedCount: savedResult.count || 0,
    subscription: subscriptionResult.data || { plan: 'free', status: 'active' },
  }
}

// 최근 추천 공고 조회
export async function getRecentAnnouncements(
  supabase: SupabaseClient,
  limit: number = 5
) {
  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, organization, application_end, category, support_amount, source')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Recent announcements error:', error)
    return []
  }

  return data || []
}

// 최근 매칭 결과 조회
export async function getRecentMatches(
  supabase: SupabaseClient,
  companyId: string,
  limit: number = 5
) {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      id,
      match_score,
      created_at,
      announcements (
        id,
        title,
        organization,
        application_end
      )
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Recent matches error:', error)
    return []
  }

  return data || []
}

// 사용량 체크 (무료 플랜 제한)
// 비즈니스 모델:
// - 매칭 분석: 무료 (모든 사용자)
// - 지원서 작성: 유료 (Pro 이상)
export async function checkUsageLimit(
  supabase: SupabaseClient,
  userId: string,
  companyId: string,
  featureType: 'matching' | 'application'
) {
  // 매칭 분석은 모든 사용자에게 무료로 제공
  if (featureType === 'matching') {
    return { allowed: true, remaining: -1, limit: -1 }
  }

  // 지원서 작성은 프로모션 기간 또는 유료 플랜만 가능
  if (featureType === 'application') {
    // 프로모션 기간 중에는 모든 사용자 무제한
    if (isPromotionActive()) {
      return { allowed: true, remaining: -1, limit: -1, promotion: true }
    }

    // 구독 정보 조회
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .single()

    const plan = subscription?.plan || 'free'

    // Pro/Enterprise는 제한 없음
    if (plan !== 'free') {
      return { allowed: true, remaining: -1, limit: -1 }
    }

    // Free 플랜은 지원서 작성 불가
    return { allowed: false, remaining: 0, limit: 0 }
  }

  return { allowed: true, remaining: -1, limit: -1 }
}
