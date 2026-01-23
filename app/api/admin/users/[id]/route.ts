import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// 관리자 이메일 목록
const ADMIN_EMAILS = ['choishiam@gmail.com']

// Supabase Admin Client (RLS 우회용)
function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

interface RouteParams {
  params: Promise<{ id: string }>
}

// DELETE: 사용자 구독 취소/다운그레이드
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: userId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 관리자 권한 확인
    if (!ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    // Service Role Client 사용 (RLS 우회)
    const adminClient = getSupabaseAdmin()

    // 구독을 free로 다운그레이드
    const { error: updateError } = await adminClient
      .from('subscriptions')
      .update({
        plan: 'free',
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('Subscription cancel error:', updateError)
      return NextResponse.json(
        { success: false, error: '구독 취소에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '구독이 취소되었습니다.',
    })
  } catch (error) {
    console.error('Admin cancel subscription error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
