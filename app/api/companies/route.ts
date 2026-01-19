import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// 기업 정보 생성/수정 스키마
const companySchema = z.object({
  name: z.string().min(1, '기업명은 필수입니다'),
  businessNumber: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  employeeCount: z.number().optional().nullable(),
  foundedDate: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  certifications: z.array(z.string()).optional().nullable(),
  annualRevenue: z.number().optional().nullable(),
  description: z.string().optional().nullable(),
  // 미등록 사업자 관련 필드
  isRegisteredBusiness: z.boolean().optional(),
  businessPlanUrl: z.string().optional().nullable(),
})

// GET: 현재 사용자의 기업 정보 조회
export async function GET() {
  try {
    const supabase = await createClient()

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 사용자의 기업 정보 조회
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116: 결과가 없음 (정상적인 경우)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || null,
    })
  } catch (error) {
    console.error('Companies GET error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// POST: 새 기업 등록
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 이미 등록된 기업이 있는지 확인
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingCompany) {
      return NextResponse.json(
        { success: false, error: '이미 등록된 기업이 있습니다. 수정하려면 PUT 요청을 사용하세요.' },
        { status: 400 }
      )
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json()
    const validationResult = companySchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const companyData = validationResult.data

    // 미등록 사업자 여부에 따른 승인 상태 결정
    const isRegistered = companyData.isRegisteredBusiness !== false
    const approvalStatus = isRegistered ? 'approved' : 'pending'

    // 기업 정보 저장
    const { data, error } = await (supabase
      .from('companies') as any)
      .insert({
        user_id: user.id,
        name: companyData.name,
        business_number: companyData.businessNumber,
        industry: companyData.industry,
        employee_count: companyData.employeeCount,
        founded_date: companyData.foundedDate,
        location: companyData.location,
        certifications: companyData.certifications,
        annual_revenue: companyData.annualRevenue,
        description: companyData.description,
        is_registered_business: isRegistered,
        business_plan_url: companyData.businessPlanUrl,
        approval_status: approvalStatus,
      })
      .select()
      .single()

    if (error) {
      console.error('Company insert error:', error)
      return NextResponse.json(
        { success: false, error: '기업 등록에 실패했습니다' },
        { status: 500 }
      )
    }

    const message = isRegistered
      ? '기업 정보가 등록되었습니다'
      : '미등록 사업자 정보가 등록되었습니다. 관리자 승인 후 서비스를 이용할 수 있어요.'

    return NextResponse.json({
      success: true,
      data,
      message,
      requiresApproval: !isRegistered,
    })
  } catch (error) {
    console.error('Companies POST error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
