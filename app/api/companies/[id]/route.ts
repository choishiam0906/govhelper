import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// 기업 정보 수정 스키마
const updateCompanySchema = z.object({
  name: z.string().min(1, '기업명은 필수입니다').optional(),
  businessNumber: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  employeeCount: z.number().optional().nullable(),
  foundedDate: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  certifications: z.array(z.string()).optional().nullable(),
  annualRevenue: z.number().optional().nullable(),
  description: z.string().optional().nullable(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: 특정 기업 정보 조회
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 기업 정보 조회
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // 본인 기업만 조회 가능
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: '기업 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Company GET error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// PUT: 기업 정보 수정
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 본인 기업인지 확인
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existingCompany) {
      return NextResponse.json(
        { success: false, error: '기업 정보를 찾을 수 없거나 권한이 없습니다' },
        { status: 404 }
      )
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json()
    const validationResult = updateCompanySchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const companyData = validationResult.data

    // 업데이트할 필드만 추출
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (companyData.name !== undefined) updateData.name = companyData.name
    if (companyData.businessNumber !== undefined) updateData.business_number = companyData.businessNumber
    if (companyData.industry !== undefined) updateData.industry = companyData.industry
    if (companyData.employeeCount !== undefined) updateData.employee_count = companyData.employeeCount
    if (companyData.foundedDate !== undefined) updateData.founded_date = companyData.foundedDate
    if (companyData.location !== undefined) updateData.location = companyData.location
    if (companyData.certifications !== undefined) updateData.certifications = companyData.certifications
    if (companyData.annualRevenue !== undefined) updateData.annual_revenue = companyData.annualRevenue
    if (companyData.description !== undefined) updateData.description = companyData.description

    // 기업 정보 수정
    const { data, error } = await (supabase
      .from('companies') as any)
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Company update error:', error)
      return NextResponse.json(
        { success: false, error: '기업 정보 수정에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: '기업 정보가 수정되었습니다',
    })
  } catch (error) {
    console.error('Company PUT error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// DELETE: 기업 정보 삭제
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 기업 정보 삭제
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Company delete error:', error)
      return NextResponse.json(
        { success: false, error: '기업 정보 삭제에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '기업 정보가 삭제되었습니다',
    })
  } catch (error) {
    console.error('Company DELETE error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
