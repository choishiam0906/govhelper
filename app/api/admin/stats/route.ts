import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

import { ADMIN_EMAILS, isAdmin } from '@/lib/admin'

export async function GET() {
  try {
    const supabase = await createServiceClient()

    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ success: false, error: '권한이 없어요' }, { status: 403 })
    }

    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // 사용자 통계 (Supabase Auth Admin API)
    const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const users = usersData?.users || []
    const totalUsers = users.length
    const recentUsers = users.filter(u =>
      new Date(u.created_at) >= sevenDaysAgo
    ).length

    // 일별 가입자 추이 (최근 30일)
    const usersByDate: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      usersByDate[dateStr] = 0
    }
    users.forEach(u => {
      const dateStr = new Date(u.created_at).toISOString().split('T')[0]
      if (usersByDate[dateStr] !== undefined) {
        usersByDate[dateStr]++
      }
    })
    const userTrend = Object.entries(usersByDate).map(([date, count]) => ({
      date,
      count,
    }))

    // 공고 통계
    const { count: totalAnnouncements } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })

    const { data: announcementsBySource } = await supabase
      .from('announcements')
      .select('source') as { data: { source: string }[] | null }

    const sourceCounts: Record<string, number> = {}
    announcementsBySource?.forEach(a => {
      sourceCounts[a.source] = (sourceCounts[a.source] || 0) + 1
    })

    // 매칭 통계
    const { count: totalMatches } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })

    const { count: recentMatches } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    // 일별 매칭 추이 (최근 30일)
    const { data: matchesData } = await supabase
      .from('matches')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString()) as { data: { created_at: string }[] | null }

    const matchesByDate: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      matchesByDate[dateStr] = 0
    }
    matchesData?.forEach(m => {
      const dateStr = new Date(m.created_at).toISOString().split('T')[0]
      if (matchesByDate[dateStr] !== undefined) {
        matchesByDate[dateStr]++
      }
    })
    const matchTrend = Object.entries(matchesByDate).map(([date, count]) => ({
      date,
      count,
    }))

    // 지원서 통계
    const { count: totalApplications } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })

    const { count: recentApplications } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    // 결제 통계
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('amount, status, created_at')
      .eq('status', 'completed') as { data: { amount: number; status: string; created_at: string }[] | null }

    const totalRevenue = paymentsData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    const recentRevenue = paymentsData
      ?.filter(p => new Date(p.created_at) >= sevenDaysAgo)
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    // 월별 매출 추이 (최근 6개월)
    const revenueByMonth: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today)
      date.setMonth(date.getMonth() - i)
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      revenueByMonth[monthStr] = 0
    }
    paymentsData?.forEach(p => {
      const date = new Date(p.created_at)
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (revenueByMonth[monthStr] !== undefined) {
        revenueByMonth[monthStr] += p.amount || 0
      }
    })
    const revenueTrend = Object.entries(revenueByMonth).map(([month, amount]) => ({
      month,
      amount,
    }))

    // 구독 통계
    const { count: activeSubscriptions } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          recent: recentUsers,
          trend: userTrend,
        },
        announcements: {
          total: totalAnnouncements || 0,
          bySource: sourceCounts,
        },
        matches: {
          total: totalMatches || 0,
          recent: recentMatches || 0,
          trend: matchTrend,
        },
        applications: {
          total: totalApplications || 0,
          recent: recentApplications || 0,
        },
        revenue: {
          total: totalRevenue,
          recent: recentRevenue,
          trend: revenueTrend,
        },
        subscriptions: {
          active: activeSubscriptions || 0,
        },
      },
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { success: false, error: '통계를 불러오지 못했어요' },
      { status: 500 }
    )
  }
}
