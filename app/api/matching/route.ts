import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeMatchWithGemini } from '@/lib/ai/gemini'
import { Tables, InsertTables, Json } from '@/types/database'

export async function POST(request: NextRequest) {
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

    // Fetch announcement
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

    // Fetch company profile
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

    // Fetch business plan if provided
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

    // Prepare content for AI analysis
    const announcementContent = `
제목: ${announcement.title}
기관: ${announcement.organization}
분야: ${announcement.category}
지원유형: ${announcement.support_type}
지원금액: ${announcement.support_amount}
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

    // Perform AI analysis
    const analysis = await analyzeMatchWithGemini(
      announcementContent,
      companyProfile,
      businessPlanContent
    )

    // Save match result
    const matchInsert = {
      company_id: companyId,
      announcement_id: announcementId,
      business_plan_id: businessPlanId || null,
      match_score: analysis.overallScore,
      analysis: analysis,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: matchResult, error: matchError } = await (supabase as any)
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

    return NextResponse.json({
      success: true,
      data: {
        match: matchResult,
        analysis,
      },
    })
  } catch (error) {
    console.error('Matching error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
