import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { getVapidPublicKey } from '@/lib/push'

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
})

// GET: VAPID 공개 키 반환
export async function GET() {
  const vapidPublicKey = getVapidPublicKey()

  if (!vapidPublicKey) {
    return NextResponse.json(
      { success: false, error: 'VAPID 키가 설정되지 않았습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    vapidPublicKey,
  })
}

// POST: 푸시 구독 등록
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

    const body = await request.json()
    const validationResult = subscribeSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 구독 정보입니다' },
        { status: 400 }
      )
    }

    const { endpoint, keys } = validationResult.data
    const userAgent = request.headers.get('user-agent') || ''

    // 기존 구독이 있는지 확인
    const { data: existing } = await (supabase
      .from('push_subscriptions') as any)
      .select('id')
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)
      .single()

    if (existing) {
      // 기존 구독 업데이트
      const { error } = await (supabase
        .from('push_subscriptions') as any)
        .update({
          p256dh: keys.p256dh,
          auth: keys.auth,
          user_agent: userAgent,
        })
        .eq('id', existing.id)

      if (error) {
        console.error('Update subscription error:', error)
        return NextResponse.json(
          { success: false, error: '구독 업데이트에 실패했습니다' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: '푸시 구독이 업데이트되었습니다',
      })
    }

    // 새 구독 등록
    const { error } = await (supabase
      .from('push_subscriptions') as any)
      .insert({
        user_id: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: userAgent,
      })

    if (error) {
      console.error('Create subscription error:', error)
      return NextResponse.json(
        { success: false, error: '구독 등록에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '푸시 알림이 활성화되었습니다',
    })
  } catch (error) {
    console.error('Push subscribe error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// DELETE: 푸시 구독 해제
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'endpoint가 필요합니다' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)

    if (error) {
      console.error('Delete subscription error:', error)
      return NextResponse.json(
        { success: false, error: '구독 해제에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '푸시 알림이 비활성화되었습니다',
    })
  } catch (error) {
    console.error('Push unsubscribe error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
