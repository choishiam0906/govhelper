import { SupabaseClient } from '@supabase/supabase-js'

// 프로모션 설정 (비활성화됨)
export const PROMOTION_CONFIG = {
  enabled: false,
  endDate: new Date('2026-06-30T23:59:59+09:00'), // KST
  name: '얼리버드 프로모션',
  description: '프로모션이 종료되었어요.',
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

// 플랜 타입 정의
export type PlanType = 'free' | 'pro' | 'premium'

// 플랜 정보
export const PLAN_INFO = {
  free: {
    name: 'Free',
    price: 0,
    priceLabel: '무료',
    tagline: '기본 기능 체험',
    features: {
      search: true,           // 공고 검색
      semanticSearch: true,   // AI 시맨틱 검색
      matching: true,         // AI 매칭 분석 (3~5순위만)
      matchingFull: false,    // AI 매칭 전체 공개 (1~5순위)
      application: false,     // AI 지원서 작성
    },
  },
  pro: {
    name: 'Pro',
    price: 5000,
    priceLabel: '₩5,000/월',
    tagline: '전체 매칭 결과 확인',
    features: {
      search: true,
      semanticSearch: true,
      matching: true,
      matchingFull: true,     // AI 매칭 전체 공개 (1~5순위)
      application: false,
    },
  },
  premium: {
    name: 'Premium',
    price: 49000,
    priceLabel: '₩49,000/월',
    tagline: 'AI 지원서 작성까지',
    features: {
      search: true,
      semanticSearch: true,
      matching: true,
      matchingFull: true,
      application: true,      // AI 지원서 작성
    },
  },
}

// 사용자 플랜 조회
export async function getUserPlan(
  supabase: SupabaseClient,
  userId: string
): Promise<PlanType> {
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .single()

  return (subscription?.plan as PlanType) || 'free'
}

// 기능 사용 가능 여부 체크
export async function checkFeatureAccess(
  supabase: SupabaseClient,
  userId: string,
  feature: keyof typeof PLAN_INFO.free.features
): Promise<{ allowed: boolean; plan: PlanType; requiredPlan?: PlanType }> {
  const plan = await getUserPlan(supabase, userId)
  const planInfo = PLAN_INFO[plan]
  const allowed = planInfo.features[feature]

  // 필요한 플랜 찾기
  let requiredPlan: PlanType | undefined
  if (!allowed) {
    if (PLAN_INFO.pro.features[feature]) {
      requiredPlan = 'pro'
    } else if (PLAN_INFO.premium.features[feature]) {
      requiredPlan = 'premium'
    }
  }

  return { allowed, plan, requiredPlan }
}

// 사용량 체크 (하위 호환성 유지)
// 새로운 비즈니스 모델:
// - Free: 매칭 분석 (2~5순위만), 공고 검색
// - Pro: 매칭 분석 전체 공개 (1~5순위)
// - Premium: 지원서 작성
export async function checkUsageLimit(
  supabase: SupabaseClient,
  userId: string,
  companyId: string,
  featureType: 'matching' | 'application'
) {
  const plan = await getUserPlan(supabase, userId)

  // 매칭 분석은 모든 사용자에게 허용 (결과 공개 범위는 플랜에 따라 다름)
  if (featureType === 'matching') {
    return {
      allowed: true,
      remaining: -1,
      limit: -1,
      plan,
      matchingFull: PLAN_INFO[plan].features.matchingFull,
    }
  }

  // 지원서 작성은 Premium만 가능
  if (featureType === 'application') {
    const allowed = PLAN_INFO[plan].features.application

    return {
      allowed,
      remaining: allowed ? -1 : 0,
      limit: allowed ? -1 : 0,
      plan,
      promotion: isPromotionActive(),
    }
  }

  return { allowed: true, remaining: -1, limit: -1, plan }
}
