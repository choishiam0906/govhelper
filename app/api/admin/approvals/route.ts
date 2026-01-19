import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAILS = ['choishiam@gmail.com']

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 관리자 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { companyId, status } = body

    if (!companyId || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: '잘못된 요청입니다' },
        { status: 400 }
      )
    }

    // 기업 승인 상태 업데이트
    const { error } = await (supabase
      .from('companies') as any)
      .update({
        approval_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', companyId)

    if (error) {
      console.error('Approval update error:', error)
      return NextResponse.json(
        { success: false, error: '상태 변경에 실패했습니다' },
        { status: 500 }
      )
    }

    // TODO: 이메일 알림 발송 (승인/거절 안내)

    return NextResponse.json({
      success: true,
      message: status === 'approved' ? '승인되었습니다' : '거절되었습니다',
    })
  } catch (error) {
    console.error('Admin approval error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// GET: 승인 대기 목록 조회
export async function GET() {
  try {
    const supabase = await createClient()

    // 관리자 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    // 미등록 사업자 목록 조회
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('is_registered_business', false)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { success: false, error: '데이터 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Admin approvals GET error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
