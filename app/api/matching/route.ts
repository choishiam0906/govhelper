import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { analyzeMatch } from '@/lib/ai'
import { Tables, InsertTables, Json } from '@/types/database'
import { withRateLimit } from '@/lib/api-utils'
import { getMatchingCache, setMatchingCache } from '@/lib/cache'

async function handlePost(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { announcementId, companyId, businessPlanId } = body

    if (!announcementId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }


    // 1. 캐시 확인
    try {
      const cachedResult = await getMatchingCache(companyId, announcementId)
      if (cachedResult) {
        console.log('[Matching] Cache hit:', companyId, announcementId)
        return NextResponse.json(
          {
            success: true,
            data: cachedResult,
            fromCache: true,
          },
          {
            headers: {
              'X-Matching-Cache': 'HIT',
            },
          }
        )
      }
      console.log('[Matching] Cache miss:', companyId, announcementId)
    } catch (cacheError) {
      console.error('[Matching] Cache error (continuing without cache):', cacheError)
      // 캐시 실패 시 기존 로직으로 fallback
    }

    // 2. Fetch announcement
    const { data: announcementData, error: announcementError } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', announcementId)
      .single()

    if (announcementError || !announcementData) {
      return NextResponse.json(
        { success: false, error: 'Announcement not found' },
        { status: 404 }
      )
    }
    const announcement = announcementData as Tables<'announcements'>

    // 3. Fetch company profile
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (companyError || !companyData) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      )
    }
    const company = companyData as Tables<'companies'>

    // 4. Fetch business plan if provided
    let businessPlan: Tables<'business_plans'> | null = null
    if (businessPlanId) {
      const { data, error } = await supabase
        .from('business_plans')
        .select('*')
        .eq('id', businessPlanId)
        .single()

      if (!error && data) {
        businessPlan = data as Tables<'business_plans'>
      }
    }

    // 5. Prepare content for AI analysis
    // support_amount 안전하게 형식화 (숫자 또는 문자열 처리)
    const formatSupportAmount = (amount: string | null | undefined): string => {
      if (!amount) return '미정'
      // 이미 형식화된 경우 그대로 반환
      if (amount.includes('원') || amount.includes('억')) return amount
      // 숫자만 있는 경우 형식화
      const numericValue = Number(amount.replace(/[^0-9]/g, ''))
      if (!isNaN(numericValue) && numericValue > 0) {
        return `${numericValue.toLocaleString()}원`
      }
      return amount || '미정'
    }

    const announcementContent = `
제목: ${announcement.title}
기관: ${announcement.organization}
분야: ${announcement.category}
지원유형: ${announcement.support_type}
지원금액: ${formatSupportAmount(announcement.support_amount)}
내용: ${announcement.content || announcement.parsed_content || ''}
    `.trim()

    const companyProfile = `
회사명: ${company.name}
업종: ${company.industry}
설립일: ${company.founded_date}
직원수: ${company.employee_count}명
소재지: ${company.location}
연매출: ${company.annual_revenue}
인증현황: ${company.certifications?.join(', ') || '없음'}
회사 소개: ${company.description || ''}
    `.trim()

    const businessPlanContent = businessPlan
      ? `
제목: ${businessPlan.title}
내용: ${businessPlan.content || businessPlan.parsed_content || ''}
      `.trim()
      : '사업계획서 없음'

    // 6. Perform AI analysis
    const analysis = await analyzeMatch(
      announcementContent,
      companyProfile,
      businessPlanContent
    )

    // overallScore 유효성 검사 및 정규화
    let validScore = 0
    if (typeof analysis.overallScore === 'number' && !isNaN(analysis.overallScore)) {
      validScore = Math.max(0, Math.min(100, Math.round(analysis.overallScore)))
    } else if (typeof analysis.overallScore === 'string') {
      const numMatch = String(analysis.overallScore).match(/\d+/)
      if (numMatch) {
        validScore = Math.max(0, Math.min(100, parseInt(numMatch[0], 10)))
      }
    }
    analysis.overallScore = validScore

    // 7. Save match result (Service Client로 RLS 우회)
    const serviceClient = await createServiceClient()
    const matchInsert = {
      company_id: companyId,
      announcement_id: announcementId,
      business_plan_id: businessPlanId || null,
      match_score: validScore,
      analysis: analysis,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: matchResult, error: matchError } = await (serviceClient as any)
      .from('matches')
      .insert(matchInsert)
      .select()
      .single()

    if (matchError) {
      console.error('Match save error:', matchError)
      return NextResponse.json(
        { success: false, error: 'Failed to save match result' },
        { status: 500 }
      )
    }


    // 8. 결과 데이터 준비
    const resultData = {
      match: matchResult,
      analysis,
    }

    // 9. 캐시에 저장 (7일 TTL)
    try {
      await setMatchingCache(companyId, announcementId, resultData)
      console.log('[Matching] Cached result:', companyId, announcementId)
    } catch (cacheError) {
      console.error('[Matching] Failed to cache result:', cacheError)
      // 캐시 저장 실패는 무시 (결과는 정상 반환)
    }

    return NextResponse.json(
      {
        success: true,
        data: resultData,
        fromCache: false,
      },
      {
        headers: {
          'X-Matching-Cache': 'MISS',
        },
      }
    )
  } catch (error) {
    console.error('Matching error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// AI Rate Limit 적용 (분당 10회)
export const POST = withRateLimit(handlePost, 'ai')
