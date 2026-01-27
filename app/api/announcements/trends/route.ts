import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const period = parseInt(request.nextUrl.searchParams.get('period') || '30')
  const since = new Date()
  since.setDate(since.getDate() - period)

  // 기간 내 공고 조회
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, organization, category, source, application_end, support_amount, status, created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })

  const items = (announcements || []) as any[]

  // 카테고리별 집계
  const categoryMap = new Map<string, number>()
  items.forEach(a => {
    const cat = a.category || '미분류'
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1)
  })
  const byCategory = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // 기관별 집계
  const orgMap = new Map<string, number>()
  items.forEach(a => {
    const org = a.organization || '기관 미상'
    orgMap.set(org, (orgMap.get(org) || 0) + 1)
  })
  const byOrganization = Array.from(orgMap.entries())
    .map(([org, count]) => ({ org, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // 소스별 집계
  const sourceMap = new Map<string, number>()
  items.forEach(a => {
    sourceMap.set(a.source, (sourceMap.get(a.source) || 0) + 1)
  })
  const bySource = Array.from(sourceMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)

  // 마감일 분포
  const now = Date.now()
  const deadlineRanges = [
    { label: '이미 마감', count: 0 },
    { label: '3일 이내', count: 0 },
    { label: '7일 이내', count: 0 },
    { label: '14일 이내', count: 0 },
    { label: '30일 이내', count: 0 },
    { label: '30일 이상', count: 0 },
  ]
  items.forEach(a => {
    if (!a.application_end) return
    const daysLeft = Math.ceil((new Date(a.application_end).getTime() - now) / (1000*60*60*24))
    if (daysLeft < 0) deadlineRanges[0].count++
    else if (daysLeft <= 3) deadlineRanges[1].count++
    else if (daysLeft <= 7) deadlineRanges[2].count++
    else if (daysLeft <= 14) deadlineRanges[3].count++
    else if (daysLeft <= 30) deadlineRanges[4].count++
    else deadlineRanges[5].count++
  })

  // 핫 키워드 (제목에서 추출)
  const keywordMap = new Map<string, number>()
  const stopWords = new Set(['및', '등', '위한', '관련', '대상', '지원', '사업', '공고', '안내', '모집', '선정'])
  items.forEach(a => {
    const words = (a.title || '').replace(/[^가-힣a-zA-Z0-9\s]/g, '').split(/\s+/)
    words.forEach((w: string) => {
      if (w.length >= 2 && !stopWords.has(w)) {
        keywordMap.set(w, (keywordMap.get(w) || 0) + 1)
      }
    })
  })
  const hotKeywords = Array.from(keywordMap.entries())
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  // 간단한 인사이트 생성 (규칙 기반)
  const insights: string[] = []
  if (byCategory.length > 0) {
    insights.push(`최근 ${period}일간 가장 많은 공고는 "${byCategory[0].category}" 분야 (${byCategory[0].count}건)예요`)
  }
  if (byOrganization.length > 0) {
    insights.push(`"${byOrganization[0].org}"이(가) 가장 많은 공고를 게시했어요 (${byOrganization[0].count}건)`)
  }
  const activeCount = items.filter(a => a.status === 'active').length
  insights.push(`현재 지원 가능한 활성 공고는 ${activeCount}건이에요`)
  if (deadlineRanges[1].count > 0) {
    insights.push(`3일 이내 마감 공고가 ${deadlineRanges[1].count}건 있어요. 서둘러 확인하세요!`)
  }

  return NextResponse.json({
    period: `${period}일`,
    totalAnnouncements: items.length,
    activeCount,
    trends: {
      byCategory,
      byOrganization,
      bySource,
      deadlineDistribution: deadlineRanges,
    },
    hotKeywords,
    insights,
  })
}
