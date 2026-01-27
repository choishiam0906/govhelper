import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { announcementId } = await request.json()
  if (!announcementId) return NextResponse.json({ error: 'announcementId 필수' }, { status: 400 })

  // 공고 정보 조회
  const { data: announcement } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', announcementId)
    .single()

  if (!announcement) return NextResponse.json({ error: '공고 없음' }, { status: 404 })

  // 경쟁도 계산 (규칙 기반)
  const factors = analyzeCompetition(announcement as any)

  return NextResponse.json({ success: true, ...factors })
}

function analyzeCompetition(announcement: any) {
  let score = 50 // 기본 경쟁도
  const factors: Record<string, string> = {}

  // 1. 지원금액 (높을수록 경쟁 심함)
  const amount = announcement.support_amount || ''
  if (amount.includes('억') || amount.includes('10,000')) {
    score += 20
    factors.supportAmount = '지원금액이 높아 경쟁률이 높을 것으로 예상돼요'
  } else if (amount.includes('천만') || amount.includes('5,000')) {
    score += 10
    factors.supportAmount = '중간 수준의 지원금액이에요'
  } else {
    factors.supportAmount = '지원금액이 상대적으로 낮아 경쟁이 덜할 수 있어요'
  }

  // 2. 자격요건 범위 (넓을수록 경쟁 심함)
  const criteria = announcement.eligibility_criteria
  if (criteria) {
    const types = criteria.companyTypes?.length || 0
    if (types >= 3 || criteria.companyTypes?.includes('중소기업')) {
      score += 15
      factors.eligibilityBreadth = '자격요건이 넓어 많은 기업이 지원 가능해요'
    } else if (types <= 1) {
      score -= 10
      factors.eligibilityBreadth = '자격요건이 제한적이라 경쟁이 적을 수 있어요'
    } else {
      factors.eligibilityBreadth = '자격요건이 보통 수준이에요'
    }
  }

  // 3. 마감일 (남은 기간)
  if (announcement.application_end) {
    const daysLeft = Math.ceil((new Date(announcement.application_end).getTime() - Date.now()) / (1000*60*60*24))
    if (daysLeft > 14) {
      score += 5
      factors.deadline = `마감까지 ${daysLeft}일 남아 지원자가 더 늘어날 수 있어요`
    } else if (daysLeft <= 3) {
      score -= 5
      factors.deadline = `마감이 ${daysLeft}일 남았어요. 빠른 지원이 필요해요`
    } else {
      factors.deadline = `마감까지 ${daysLeft}일 남았어요`
    }
  }

  // 4. 소스별 인기도
  if (announcement.source === 'smes24') {
    score += 5
    factors.popularity = '중소벤처24 공고는 인지도가 높아 지원자가 많은 편이에요'
  }

  score = Math.min(100, Math.max(0, score))

  const level = score >= 80 ? 'very_high' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low'
  const estimatedApplicants = score >= 80 ? '약 100개 이상 기업' : score >= 60 ? '약 50-100개 기업' : score >= 40 ? '약 20-50개 기업' : '약 20개 미만 기업'

  const recommendations: Record<string, string> = {
    very_high: '경쟁이 매우 치열해요. 차별화된 사업계획서가 필요해요',
    high: '경쟁이 높은 편이에요. 빠른 지원을 권장해요',
    medium: '적당한 경쟁 수준이에요. 꼼꼼한 준비가 중요해요',
    low: '경쟁이 낮은 편이에요. 좋은 기회예요'
  }

  return {
    competitionLevel: level,
    competitionScore: score,
    estimatedApplicants,
    factors,
    recommendation: recommendations[level],
  }
}
