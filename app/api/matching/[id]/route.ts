import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: 매칭 결과 상세 조회
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 기업 정보 조회
    const { data: companyData } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const company = companyData as { id: string } | null

    if (!company) {
      return NextResponse.json(
        { success: false, error: '기업 정보가 필요합니다' },
        { status: 400 }
      )
    }

    // 매칭 결과 조회
    const { data, error } = await supabase
      .from('matches')
      .select(`
        id,
        match_score,
        analysis,
        created_at,
        announcements (
          id,
          title,
          organization,
          category,
          support_type,
          support_amount,
          application_end,
          source
        )
      `)
      .eq('id', id)
      .eq('company_id', company.id)
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: '매칭 결과를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Match GET error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// DELETE: 매칭 결과 삭제
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 기업 정보 조회
    const { data: companyData2 } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const company2 = companyData2 as { id: string } | null

    if (!company2) {
      return NextResponse.json(
        { success: false, error: '기업 정보가 필요합니다' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', id)
      .eq('company_id', company2.id)

    if (error) {
      console.error('Match delete error:', error)
      return NextResponse.json(
        { success: false, error: '삭제에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '매칭 결과가 삭제되었습니다',
    })
  } catch (error) {
    console.error('Match DELETE error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
