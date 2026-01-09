import { SupabaseClient } from '@supabase/supabase-js'

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
export async function checkUsageLimit(
  supabase: SupabaseClient,
  userId: string,
  companyId: string,
  featureType: 'matching' | 'application'
) {
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

  // 이번 달 사용량 조회
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  if (featureType === 'matching') {
    const { count } = await supabase
      .from('matches')
      .select('id', { count: 'exact' })
      .eq('company_id', companyId)
      .gte('created_at', startOfMonth.toISOString())

    const limit = 3 // Free 플랜 월 3회
    const used = count || 0
    return {
      allowed: used < limit,
      remaining: Math.max(0, limit - used),
      limit,
    }
  }

  if (featureType === 'application') {
    // Free 플랜은 지원서 작성 불가
    return { allowed: false, remaining: 0, limit: 0 }
  }

  return { allowed: true, remaining: -1, limit: -1 }
}
