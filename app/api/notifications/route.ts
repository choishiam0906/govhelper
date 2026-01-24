import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 알림 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요해요' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unread') === 'true'

    let query = (supabase
      .from('notifications') as any)
      .select(
        `
        id,
        type,
        title,
        message,
        announcement_id,
        match_id,
        metadata,
        is_read,
        read_at,
        action_url,
        created_at
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 만료되지 않은 알림만
    query = query.or('expires_at.is.null,expires_at.gt.now()')

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error, count } = await query

    if (error) {
      console.error('알림 조회 오류:', error)
      throw error
    }

    // 읽지 않은 알림 수 조회
    const { count: unreadCount } = await (supabase
      .from('notifications') as any)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .or('expires_at.is.null,expires_at.gt.now()')

    return NextResponse.json({
      success: true,
      data: notifications || [],
      unreadCount: unreadCount || 0,
      total: count || 0,
      hasMore: (offset + limit) < (count || 0),
    })
  } catch (error) {
    console.error('알림 조회 실패:', error)
    return NextResponse.json({ success: false, error: '알림을 불러오지 못했어요' }, { status: 500 })
  }
}

// 알림 읽음 처리
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요해요' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds, markAllRead } = body

    if (markAllRead) {
      // 모든 알림 읽음 처리
      const { error } = await (supabase
        .from('notifications') as any)
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: '모든 알림을 읽음 처리했어요',
      })
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ success: false, error: '읽음 처리할 알림을 선택해주세요' }, { status: 400 })
    }

    // 특정 알림 읽음 처리
    const { error } = await (supabase
      .from('notifications') as any)
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .in('id', notificationIds)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `${notificationIds.length}개 알림을 읽음 처리했어요`,
    })
  } catch (error) {
    console.error('알림 읽음 처리 실패:', error)
    return NextResponse.json({ success: false, error: '알림을 읽음 처리하지 못했어요' }, { status: 500 })
  }
}

// 알림 삭제
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요해요' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const notificationId = searchParams.get('id')
    const deleteAll = searchParams.get('all') === 'true'
    const deleteRead = searchParams.get('read') === 'true'

    if (deleteAll) {
      // 모든 알림 삭제
      const { error } = await (supabase
        .from('notifications') as any)
        .delete()
        .eq('user_id', user.id)

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: '모든 알림을 삭제했어요',
      })
    }

    if (deleteRead) {
      // 읽은 알림만 삭제
      const { error } = await (supabase
        .from('notifications') as any)
        .delete()
        .eq('user_id', user.id)
        .eq('is_read', true)

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: '읽은 알림을 삭제했어요',
      })
    }

    if (!notificationId) {
      return NextResponse.json({ success: false, error: '삭제할 알림을 선택해주세요' }, { status: 400 })
    }

    // 특정 알림 삭제
    const { error } = await (supabase
      .from('notifications') as any)
      .delete()
      .eq('user_id', user.id)
      .eq('id', notificationId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: '알림을 삭제했어요',
    })
  } catch (error) {
    console.error('알림 삭제 실패:', error)
    return NextResponse.json({ success: false, error: '알림을 삭제하지 못했어요' }, { status: 500 })
  }
}
