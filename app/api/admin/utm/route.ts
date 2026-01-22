import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// UTM 분석 통계 API (관리자 전용)
export async function GET() {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 확인
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 1. 비회원 리드 UTM 통계 (최근 30일)
    const { data: guestLeads } = await (supabase as any)
      .from('guest_leads')
      .select('utm_source, utm_medium, utm_campaign, converted_to_user, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })

    // 2. 회원 분석 데이터 (있으면)
    const { data: userAnalytics } = await (supabase as any)
      .from('user_analytics')
      .select('utm_source, utm_medium, utm_campaign, signup_completed, onboarding_completed, first_match_at, first_payment_at, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })

    // 3. 소스별 집계
    const sourceStats = aggregateByField(guestLeads || [], 'utm_source')
    const mediumStats = aggregateByField(guestLeads || [], 'utm_medium')
    const campaignStats = aggregateByField(guestLeads || [], 'utm_campaign')

    // 4. 일별 추이 (최근 14일)
    const dailyStats = aggregateByDay(guestLeads || [])

    // 5. 전체 요약
    const totalLeads = guestLeads?.length || 0
    const convertedLeads = guestLeads?.filter((l: any) => l.converted_to_user).length || 0
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads * 100).toFixed(1) : '0'

    // UTM이 있는 리드
    const utmLeads = guestLeads?.filter((l: any) => l.utm_source || l.utm_medium || l.utm_campaign).length || 0
    const organicLeads = totalLeads - utmLeads

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalLeads,
          convertedLeads,
          conversionRate: parseFloat(conversionRate),
          utmLeads,
          organicLeads,
        },
        bySource: sourceStats,
        byMedium: mediumStats,
        byCampaign: campaignStats,
        dailyTrend: dailyStats,
        userAnalytics: aggregateUserAnalytics(userAnalytics || []),
      },
    })
  } catch (error) {
    console.error('UTM stats error:', error)
    return NextResponse.json(
      { success: false, error: '통계 조회에 실패했어요' },
      { status: 500 }
    )
  }
}

// 필드별 집계
function aggregateByField(data: any[], field: string) {
  const grouped: Record<string, { total: number; converted: number }> = {}

  data.forEach(item => {
    const key = item[field] || '(직접 유입)'
    if (!grouped[key]) {
      grouped[key] = { total: 0, converted: 0 }
    }
    grouped[key].total++
    if (item.converted_to_user) {
      grouped[key].converted++
    }
  })

  return Object.entries(grouped)
    .map(([name, stats]) => ({
      name,
      total: stats.total,
      converted: stats.converted,
      conversionRate: stats.total > 0 ? parseFloat((stats.converted / stats.total * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10) // 상위 10개
}

// 일별 집계
function aggregateByDay(data: any[]) {
  const grouped: Record<string, { total: number; converted: number }> = {}

  // 최근 14일 초기화
  for (let i = 13; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const key = date.toISOString().split('T')[0]
    grouped[key] = { total: 0, converted: 0 }
  }

  data.forEach(item => {
    const date = new Date(item.created_at).toISOString().split('T')[0]
    if (grouped[date]) {
      grouped[date].total++
      if (item.converted_to_user) {
        grouped[date].converted++
      }
    }
  })

  return Object.entries(grouped)
    .map(([date, stats]) => ({
      date,
      total: stats.total,
      converted: stats.converted,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// 회원 분석 집계
function aggregateUserAnalytics(data: any[]) {
  if (!data || data.length === 0) {
    return {
      total: 0,
      completedOnboarding: 0,
      usedMatching: 0,
      convertedPaid: 0,
    }
  }

  return {
    total: data.length,
    completedOnboarding: data.filter(u => u.onboarding_completed).length,
    usedMatching: data.filter(u => u.first_match_at).length,
    convertedPaid: data.filter(u => u.first_payment_at).length,
  }
}
