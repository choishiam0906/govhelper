import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// 캐시 유효 시간 (초)
const CACHE_TTL = 300 // 5분

// 통계 타입 정의
interface PublicStatistics {
  id: string
  total_matches: number
  avg_match_score: number
  high_score_matches: number
  success_rate: number
  total_announcements: number
  active_announcements: number
  total_users: number
  total_companies: number
  total_support_amount: number
  avg_support_amount: number
  total_guest_matches: number
  guest_conversion_rate: number
  updated_at: string
}

// 공개 통계 API (인증 불필요)
export async function GET() {
  try {
    const supabase = await createClient()

    // 캐시된 통계 조회
    const { data, error } = await supabase
      .from('public_statistics')
      .select('*')
      .eq('id', 'main')
      .single()

    if (error || !data) {
      // 테이블이 없거나 에러 시 직접 계산
      return await getDirectStatistics(supabase)
    }

    const stats = data as PublicStatistics

    // 캐시가 5분 이상 오래되었으면 백그라운드에서 갱신
    const updatedAt = new Date(stats.updated_at)
    const now = new Date()
    const diffSeconds = (now.getTime() - updatedAt.getTime()) / 1000

    if (diffSeconds > CACHE_TTL) {
      // 비동기로 통계 갱신 (응답은 즉시 반환)
      supabase.rpc('update_public_statistics').then(() => {
      })
    }

    // 마케팅용 수치 보정 (초기 서비스 신뢰도 확보)
    const marketingStats = applyMarketingAdjustments(stats)

    return NextResponse.json({
      success: true,
      data: marketingStats,
      cached: true,
      updatedAt: stats.updated_at,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Statistics API error:', error)
    return NextResponse.json(
      { success: false, error: '통계를 불러오는데 실패했어요' },
      { status: 500 }
    )
  }
}

// 직접 통계 계산 (캐시 테이블 없을 때)
async function getDirectStatistics(supabase: any) {
  try {
    const [matchesResult, announcementsResult, companiesResult, guestResult] = await Promise.all([
      // 매칭 통계
      supabase
        .from('matches')
        .select('match_score'),

      // 공고 통계
      supabase
        .from('announcements')
        .select('id, support_amount, status'),

      // 기업 통계
      supabase
        .from('companies')
        .select('id', { count: 'exact', head: true }),

      // 비회원 통계
      supabase
        .from('guest_matches')
        .select('id', { count: 'exact', head: true }),
    ])

    const matches = matchesResult.data || []
    const announcements = announcementsResult.data || []
    const totalCompanies = companiesResult.count || 0
    const totalGuestMatches = guestResult.count || 0

    const totalMatches = matches.length
    const avgMatchScore = totalMatches > 0
      ? matches.reduce((sum: number, m: any) => sum + (m.match_score || 0), 0) / totalMatches
      : 0
    const highScoreMatches = matches.filter((m: any) => m.match_score >= 70).length
    const successRate = totalMatches > 0 ? (highScoreMatches / totalMatches) * 100 : 0

    const activeAnnouncements = announcements.filter((a: any) => a.status === 'active')
    const announcementsWithAmount = activeAnnouncements.filter((a: any) => a.support_amount > 0)
    const avgSupportAmount = announcementsWithAmount.length > 0
      ? announcementsWithAmount.reduce((sum: number, a: any) => sum + a.support_amount, 0) / announcementsWithAmount.length
      : 0

    const stats = {
      total_matches: totalMatches,
      avg_match_score: avgMatchScore,
      high_score_matches: highScoreMatches,
      success_rate: successRate,
      total_announcements: announcements.length,
      active_announcements: activeAnnouncements.length,
      total_companies: totalCompanies,
      avg_support_amount: avgSupportAmount,
      total_guest_matches: totalGuestMatches,
    }

    const marketingStats = applyMarketingAdjustments(stats)

    return NextResponse.json({
      success: true,
      data: marketingStats,
      cached: false,
    })
  } catch (error) {
    console.error('Direct statistics error:', error)
    // 폴백: 기본값 반환
    return NextResponse.json({
      success: true,
      data: getDefaultStatistics(),
      cached: false,
      fallback: true,
    })
  }
}

// 마케팅용 수치 보정
function applyMarketingAdjustments(stats: any) {
  // 실제 데이터가 적을 때 최소 기준값 적용
  const MIN_MATCHES = 200
  const MIN_SUCCESS_RATE = 75
  const MIN_AVG_SUPPORT = 30000000 // 3천만원
  const MIN_ANNOUNCEMENTS = 500

  return {
    // 매칭 통계
    totalMatches: Math.max(stats.total_matches || 0, MIN_MATCHES),
    avgMatchScore: Math.round(stats.avg_match_score || 78),
    successRate: Math.max(Math.round(stats.success_rate || 0), MIN_SUCCESS_RATE),

    // 공고 통계
    totalAnnouncements: Math.max(stats.total_announcements || 0, MIN_ANNOUNCEMENTS),
    activeAnnouncements: stats.active_announcements || 0,

    // 금액 (원 단위 → 만원 단위로 표시용)
    avgSupportAmount: Math.max(stats.avg_support_amount || 0, MIN_AVG_SUPPORT),
    avgSupportAmountFormatted: formatAmount(Math.max(stats.avg_support_amount || 0, MIN_AVG_SUPPORT)),

    // 기업/사용자
    totalCompanies: stats.total_companies || 0,
    totalGuestMatches: stats.total_guest_matches || 0,

    // 추가 마케팅 수치
    analysisTime: 30, // 분석 소요 시간 (초)
    satisfactionRate: 94, // 만족도 (%)
  }
}

// 금액 포맷팅 (3000만원 형식)
function formatAmount(amount: number): string {
  if (amount >= 100000000) {
    const billions = Math.floor(amount / 100000000)
    const millions = Math.floor((amount % 100000000) / 10000)
    return millions > 0 ? `${billions}억 ${millions}만원` : `${billions}억원`
  } else if (amount >= 10000) {
    return `${Math.floor(amount / 10000).toLocaleString()}만원`
  }
  return `${amount.toLocaleString()}원`
}

// 기본 통계값 (폴백)
function getDefaultStatistics() {
  return {
    totalMatches: 200,
    avgMatchScore: 78,
    successRate: 78,
    totalAnnouncements: 500,
    activeAnnouncements: 300,
    avgSupportAmount: 30000000,
    avgSupportAmountFormatted: '3,000만원',
    totalCompanies: 50,
    totalGuestMatches: 100,
    analysisTime: 30,
    satisfactionRate: 94,
  }
}
