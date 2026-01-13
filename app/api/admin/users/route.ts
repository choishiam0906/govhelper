import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 관리자 이메일 목록
const ADMIN_EMAILS = ['choishiam@gmail.com']

// GET: 사용자 목록 조회 (구독 정보 포함)
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

    // 구독 정보 조회
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (subError) {
      console.error('Subscriptions fetch error:', subError)
    }

    // 회사 정보 조회 (사용자 정보로 활용)
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('id, user_id, name, created_at')
      .order('created_at', { ascending: false })

    if (compError) {
      console.error('Companies fetch error:', compError)
    }

    // 데이터 병합
    const usersMap = new Map()

    // 회사 정보로 사용자 목록 구성
    companies?.forEach((company: any) => {
      if (!usersMap.has(company.user_id)) {
        usersMap.set(company.user_id, {
          user_id: company.user_id,
          company_name: company.name,
          created_at: company.created_at,
          subscription: null,
        })
      }
    })

    // 구독 정보 병합
    subscriptions?.forEach((sub: any) => {
      if (usersMap.has(sub.user_id)) {
        usersMap.get(sub.user_id).subscription = sub
      } else {
        usersMap.set(sub.user_id, {
          user_id: sub.user_id,
          company_name: null,
          created_at: sub.created_at,
          subscription: sub,
        })
      }
    })

    const users = Array.from(usersMap.values())

    return NextResponse.json({
      success: true,
      data: users,
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
