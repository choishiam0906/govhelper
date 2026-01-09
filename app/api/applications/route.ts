import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateApplicationDraft } from '@/lib/ai/claude'
import { checkUsageLimit } from '@/lib/queries/dashboard'
import { z } from 'zod'

// 지원서 생성 스키마
const createApplicationSchema = z.object({
  matchId: z.string().uuid(),
})

// GET: 지원서 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 지원서 목록 조회
    const { data, error } = await supabase
      .from('applications')
      .select(`
        id,
        content,
        status,
        created_at,
        updated_at,
        matches (
          id,
          match_score,
          announcements (
            id,
            title,
            organization,
            application_end
          )
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Applications fetch error:', error)
      return NextResponse.json(
        { success: false, error: '지원서 목록 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Applications GET error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// POST: 새 지원서 생성 (AI 초안 작성)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createApplicationSchema.parse(body)

    // 기업 정보 조회
    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const company = companyData as any

    if (!company) {
      return NextResponse.json(
        { success: false, error: '기업 정보가 필요합니다' },
        { status: 400 }
      )
    }

    // 사용량 체크
    const usage = await checkUsageLimit(supabase, user.id, company.id, 'application')
    if (!usage.allowed) {
      return NextResponse.json(
        { success: false, error: '이번 달 사용량을 초과했습니다' },
        { status: 403 }
      )
    }

    // 매칭 결과 조회 (공고 정보 포함)
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .select(`
        id,
        analysis,
        company_id,
        announcements (
          id,
          title,
          organization,
          category,
          support_type,
          support_amount,
          content,
          parsed_content
        )
      `)
      .eq('id', validatedData.matchId)
      .eq('company_id', company.id)
      .single()

    const match = matchData as any

    if (matchError || !match) {
      return NextResponse.json(
        { success: false, error: '매칭 결과를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 기존 지원서가 있는지 확인
    const { data: existingAppData } = await supabase
      .from('applications')
      .select('id')
      .eq('match_id', validatedData.matchId)
      .eq('user_id', user.id)
      .single()

    const existingApp = existingAppData as { id: string } | null

    if (existingApp) {
      return NextResponse.json(
        { success: false, error: '이미 지원서가 존재합니다', existingId: existingApp.id },
        { status: 400 }
      )
    }

    const announcement = match.announcements as any

    // 공고 내용 준비
    const announcementContent = announcement.parsed_content || announcement.content || `
제목: ${announcement.title}
주관기관: ${announcement.organization || '미상'}
분류: ${announcement.category || '미상'}
지원유형: ${announcement.support_type || '미상'}
지원금액: ${announcement.support_amount || '미상'}
`

    // 기업 프로필 준비
    const companyProfile = `
기업명: ${company.name}
업종: ${company.industry || '미상'}
직원수: ${company.employee_count || '미상'}명
설립일: ${company.founded_date || '미상'}
소재지: ${company.location || '미상'}
보유인증: ${company.certifications?.join(', ') || '없음'}
연매출: ${company.annual_revenue ? `${company.annual_revenue.toLocaleString()}원` : '미상'}
기업소개: ${company.description || '없음'}
`

    // 사업계획서 조회 (있는 경우)
    const { data: businessPlanData } = await supabase
      .from('business_plans')
      .select('parsed_content, content')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const businessPlan = businessPlanData as { parsed_content: string | null; content: string | null } | null
    const businessPlanContent = businessPlan?.parsed_content || businessPlan?.content || '사업계획서 정보 없음'

    // AI로 지원서 초안 생성
    const sections = ['사업 개요', '기술 현황', '시장 분석', '사업화 전략', '기대 효과']
    const generatedSections = await generateApplicationDraft(
      announcementContent,
      companyProfile,
      businessPlanContent,
      sections
    )

    // 지원서 저장
    const contentJson = {
      sections: generatedSections,
      metadata: {
        announcementId: announcement.id,
        announcementTitle: announcement.title,
        generatedAt: new Date().toISOString(),
      }
    }

    const { data: application, error: insertError } = await (supabase
      .from('applications') as any)
      .insert({
        match_id: validatedData.matchId,
        user_id: user.id,
        content: JSON.stringify(contentJson),
        status: 'draft',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Application insert error:', insertError)
      return NextResponse.json(
        { success: false, error: '지원서 생성에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: application,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '잘못된 요청입니다', details: (error as any).errors },
        { status: 400 }
      )
    }

    console.error('Application POST error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
