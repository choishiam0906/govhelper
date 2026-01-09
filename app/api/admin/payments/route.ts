import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 관리자 이메일 목록
const ADMIN_EMAILS = ['choishiam@gmail.com']

// GET: 결제 목록 조회 (관리자용)
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

    // 관리자 권한 확인
    if (!ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'

    // 결제 목록 조회 (사용자 정보 포함)
    let query = supabase
      .from('payments')
      .select(`
        id,
        user_id,
        amount,
        payment_method,
        order_id,
        status,
        metadata,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: paymentsData, error } = await query.limit(50)

    if (error) {
      console.error('Admin payments fetch error:', error)
      return NextResponse.json(
        { success: false, error: '결제 목록 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    const payments = paymentsData as Array<{
      id: string
      user_id: string
      amount: number
      payment_method: string
      order_id: string
      status: string
      metadata: any
      created_at: string
      updated_at: string
    }> | null

    // 사용자 이메일 조회
    const userIds = [...new Set(payments?.map(p => p.user_id) || [])]
    const usersMap: Record<string, string> = {}

    if (userIds.length > 0) {
      // auth.users에서 이메일 조회 (admin API 필요하므로 간단히 처리)
      // 실제로는 profiles 테이블을 만들어서 조회하는 것이 좋음
      for (const payment of payments || []) {
        usersMap[payment.user_id] = payment.user_id.slice(0, 8) + '...'
      }
    }

    const paymentsWithUser = payments?.map(payment => ({
      ...payment,
      user_email: usersMap[payment.user_id] || payment.user_id,
    }))

    return NextResponse.json({
      success: true,
      data: paymentsWithUser,
    })
  } catch (error) {
    console.error('Admin payments GET error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
