import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: 개별 지원 이력 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('application_tracking')
      .select(`
        *,
        announcements (
          id,
          title,
          organization,
          application_start,
          application_end,
          support_amount,
          source,
          original_url
        ),
        applications (
          id,
          title,
          status,
          created_at
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: '지원 이력을 찾을 수 없어요' },
        { status: 404 }
      )
    }

    // 상태 변경 이력 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: history } = await (supabase as any)
      .from('application_tracking_history')
      .select('*')
      .eq('tracking_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      data: {
        ...(data as Record<string, unknown>),
        history,
      },
    })
  } catch (error) {
    console.error('Tracking GET error:', error)
    return NextResponse.json(
      { error: '지원 이력 조회 중 오류가 발생했어요' },
      { status: 500 }
    )
  }
}

// PATCH: 지원 이력 업데이트
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 })
    }

    const body = await request.json()
    const {
      status,
      memo,
      application_id,
      submitted_at,
      result_announced_at,
      result_note,
      notify_deadline,
      notify_result,
    } = body

    // 업데이트할 필드만 포함
    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (memo !== undefined) updateData.memo = memo
    if (application_id !== undefined) updateData.application_id = application_id
    if (submitted_at !== undefined) updateData.submitted_at = submitted_at
    if (result_announced_at !== undefined) updateData.result_announced_at = result_announced_at
    if (result_note !== undefined) updateData.result_note = result_note
    if (notify_deadline !== undefined) updateData.notify_deadline = notify_deadline
    if (notify_result !== undefined) updateData.notify_result = notify_result

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '업데이트할 내용이 없어요' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('application_tracking')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        announcements (
          id,
          title,
          organization
        )
      `)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: '지원 이력 업데이트에 실패했어요' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: '지원 이력을 업데이트했어요',
    })
  } catch (error) {
    console.error('Tracking PATCH error:', error)
    return NextResponse.json(
      { error: '지원 이력 업데이트 중 오류가 발생했어요' },
      { status: 500 }
    )
  }
}

// DELETE: 지원 이력 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('application_tracking')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        { error: '지원 이력 삭제에 실패했어요' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '지원 이력을 삭제했어요',
    })
  } catch (error) {
    console.error('Tracking DELETE error:', error)
    return NextResponse.json(
      { error: '지원 이력 삭제 중 오류가 발생했어요' },
      { status: 500 }
    )
  }
}
