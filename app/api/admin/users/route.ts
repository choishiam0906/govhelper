import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// 관리자 이메일 목록
const ADMIN_EMAILS = ['choishiam@gmail.com']

// Supabase Admin Client (Auth 사용자 조회용)
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

// GET: 사용자 목록 조회 (Auth 사용자 + 구독 정보)
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

    // Admin Client로 Auth 사용자 목록 조회
    const adminClient = getSupabaseAdmin()
    const { data: authData, error: authListError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })

    if (authListError) {
      console.error('Auth users fetch error:', authListError)
      return NextResponse.json(
        { success: false, error: 'Auth 사용자 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    const authUsers = authData?.users || []

    // 구독 정보 조회
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (subError) {
      console.error('Subscriptions fetch error:', subError)
    }

    // 회사 정보 조회
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('id, user_id, name, created_at')
      .order('created_at', { ascending: false })

    if (compError) {
      console.error('Companies fetch error:', compError)
    }

    // 데이터 병합: Auth 사용자 기준으로 구성
    const subscriptionsMap = new Map(
      (subscriptions || []).map((sub: any) => [sub.user_id, sub])
    )
    const companiesMap = new Map(
      (companies || []).map((comp: any) => [comp.user_id, comp])
    )

    const users = authUsers.map((authUser) => {
      const company = companiesMap.get(authUser.id)
      const subscription = subscriptionsMap.get(authUser.id)

      return {
        user_id: authUser.id,
        email: authUser.email,
        company_name: company?.name || null,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        subscription: subscription || null,
        provider: authUser.app_metadata?.provider || 'email',
      }
    })

    // 최신 가입자 순으로 정렬
    users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({
      success: true,
      data: users,
      total: users.length,
    })
  } catch (error) {
    console.error('Admin users GET error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// POST: 사용자에게 직접 Pro 권한 부여
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

    // 관리자 권한 확인
    if (!ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, plan, months } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다' },
        { status: 400 }
      )
    }

    const periodStart = new Date()
    const periodEnd = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + (months || 1))

    // 기존 구독 확인
    const { data: existingSub } = await (supabase
      .from('subscriptions') as any)
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existingSub?.id) {
      // 기존 구독 업데이트
      const { error: updateError } = await (supabase
        .from('subscriptions') as any)
        .update({
          plan: plan || 'pro',
          status: 'active',
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSub.id)

      if (updateError) {
        console.error('Subscription update error:', updateError)
        return NextResponse.json(
          { success: false, error: '구독 업데이트에 실패했습니다' },
          { status: 500 }
        )
      }
    } else {
      // 새 구독 생성
      const { error: insertError } = await (supabase
        .from('subscriptions') as any)
        .insert({
          user_id: userId,
          plan: plan || 'pro',
          status: 'active',
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })

      if (insertError) {
        console.error('Subscription insert error:', insertError)
        return NextResponse.json(
          { success: false, error: '구독 생성에 실패했습니다' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pro 권한이 부여되었습니다.',
      data: {
        userId,
        plan: plan || 'pro',
        periodEnd: periodEnd.toISOString(),
      },
    })
  } catch (error) {
    console.error('Admin grant pro error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
