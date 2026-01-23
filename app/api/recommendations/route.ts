import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/queries/dashboard'
import { filterAndScoreAnnouncements } from '@/lib/recommendations/filter'
import type {
  CompanyInfo,
  AnnouncementForRecommendation,
  RecommendationsResponse
} from '@/lib/recommendations/types'

/**
 * 맞춤 추천 공고 API
 * Pro/Premium 사용자만 사용 가능
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json<RecommendationsResponse>({
        success: false,
        error: '로그인이 필요해요'
      }, { status: 401 })
    }

    // 2. 플랜 확인 (Pro/Premium만)
    const plan = await getUserPlan(supabase, user.id)
    if (plan === 'free') {
      return NextResponse.json<RecommendationsResponse>({
        success: false,
        error: '이 기능은 Pro 이상 플랜에서 사용할 수 있어요',
        requiredPlan: 'pro'
      }, { status: 403 })
    }

    // 3. 회사 정보 조회
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('id, name, industry, location, employee_count, annual_revenue, founded_date, certifications')
      .eq('user_id', user.id)
      .single()

    if (companyError || !companyData) {
      return NextResponse.json<RecommendationsResponse>({
        success: false,
        error: '기업 정보를 먼저 등록해주세요'
      }, { status: 400 })
    }

    // 타입 명시
    const company = companyData as {
      id: string
      name: string
      industry: string | null
      location: string | null
      employee_count: number | null
      annual_revenue: number | null
      founded_date: string | null
      certifications: string[] | null
    }

    // 4. 활성 공고 조회 (eligibility_criteria가 있는 것만)
    const { data: announcements, error: announcementsError } = await supabase
      .from('announcements')
      .select(`
        id,
        title,
        organization,
        category,
        support_type,
        support_amount,
        application_end,
        eligibility_criteria
      `)
      .eq('status', 'active')
      .not('eligibility_criteria', 'is', null)
      .gte('application_end', new Date().toISOString().split('T')[0]) // 마감 전 공고만
      .order('application_end', { ascending: true })
      .limit(200)

    if (announcementsError) {
      console.error('Announcements query error:', announcementsError)
      return NextResponse.json<RecommendationsResponse>({
        success: false,
        error: '공고를 불러오지 못했어요'
      }, { status: 500 })
    }

    // 5. 회사 정보 변환
    const companyInfo: CompanyInfo = {
      industry: company.industry,
      location: company.location,
      employeeCount: company.employee_count,
      annualRevenue: company.annual_revenue,
      foundedDate: company.founded_date,
      certifications: company.certifications
    }

    // 6. 필터링 및 점수 계산
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const minScore = parseInt(searchParams.get('minScore') || '50')

    const results = filterAndScoreAnnouncements(
      announcements as AnnouncementForRecommendation[],
      companyInfo,
      { limit, minScore }
    )

    // 7. 응답 반환
    return NextResponse.json<RecommendationsResponse>({
      success: true,
      data: {
        recommendations: results,
        companyInfo: {
          name: company.name,
          industry: company.industry,
          location: company.location
        },
        totalMatched: results.length
      }
    })

  } catch (error) {
    console.error('Recommendations API error:', error)
    return NextResponse.json<RecommendationsResponse>({
      success: false,
      error: '추천 공고를 불러오는 중 문제가 발생했어요'
    }, { status: 500 })
  }
}
