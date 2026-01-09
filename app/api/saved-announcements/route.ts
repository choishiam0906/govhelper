import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const saveSchema = z.object({
  announcementId: z.string().uuid(),
})

// GET: 저장된 공고 목록 조회
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('saved_announcements')
      .select(`
        id,
        created_at,
        announcements (
          id,
          title,
          organization,
          category,
          support_type,
          support_amount,
          application_end,
          source,
          status
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Saved announcements error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Saved announcements GET error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// POST: 공고 저장
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
    const validationResult = saveSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 요청입니다' },
        { status: 400 }
      )
    }

    const { announcementId } = validationResult.data

    // 이미 저장되어 있는지 확인
    const { data: existing } = await supabase
      .from('saved_announcements')
      .select('id')
      .eq('user_id', user.id)
      .eq('announcement_id', announcementId)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: '이미 저장된 공고입니다' },
        { status: 400 }
      )
    }

    const { data, error } = await (supabase
      .from('saved_announcements') as any)
      .insert({
        user_id: user.id,
        announcement_id: announcementId,
      })
      .select()
      .single()

    if (error) {
      console.error('Save announcement error:', error)
      return NextResponse.json(
        { success: false, error: '저장에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: '관심 공고로 저장되었습니다',
    })
  } catch (error) {
    console.error('Save announcement POST error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// DELETE: 저장된 공고 삭제
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
    const validationResult = saveSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 요청입니다' },
        { status: 400 }
      )
    }

    const { announcementId } = validationResult.data

    const { error } = await supabase
      .from('saved_announcements')
      .delete()
      .eq('user_id', user.id)
      .eq('announcement_id', announcementId)

    if (error) {
      console.error('Delete saved announcement error:', error)
      return NextResponse.json(
        { success: false, error: '삭제에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '관심 공고가 삭제되었습니다',
    })
  } catch (error) {
    console.error('Delete saved announcement error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
