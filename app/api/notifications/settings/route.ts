import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 알림 설정 조회
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요해요' }, { status: 401 })
    }

    // 기존 설정 조회
    const { data: preferences, error } = await (supabase
      .from('notification_preferences') as any)
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116: no rows returned
      throw error
    }

    // 설정이 없으면 기본값 반환
    const defaultPreferences = {
      email_enabled: true,
      deadline_7_days: true,
      deadline_3_days: true,
      deadline_1_day: true,
      notification_email: user.email,
    }

    return NextResponse.json({
      success: true,
      data: preferences || defaultPreferences,
    })
  } catch (error) {
    console.error('알림 설정 조회 오류:', error)
    return NextResponse.json({ success: false, error: '알림 설정을 불러오지 못했어요' }, { status: 500 })
  }
}

// 알림 설정 저장
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요해요' }, { status: 401 })
    }

    const body = await request.json()
    const { email_enabled, deadline_7_days, deadline_3_days, deadline_1_day, notification_email } = body

    // upsert로 생성 또는 업데이트
    const { data, error } = await (supabase
      .from('notification_preferences') as any)
      .upsert(
        {
          user_id: user.id,
          email_enabled: email_enabled ?? true,
          deadline_7_days: deadline_7_days ?? true,
          deadline_3_days: deadline_3_days ?? true,
          deadline_1_day: deadline_1_day ?? true,
          notification_email: notification_email || user.email,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('알림 설정 저장 오류:', error)
    return NextResponse.json({ success: false, error: '알림 설정을 저장하지 못했어요' }, { status: 500 })
  }
}
