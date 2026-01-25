import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateSchema = z.object({
  id: z.string().uuid(),
  folderId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
  memo: z.string().nullable().optional(),
  notifyDeadline: z.boolean().optional(),
})

// PATCH: 저장된 공고 업데이트
export async function PATCH(request: NextRequest) {
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
    const validationResult = updateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 요청입니다' },
        { status: 400 }
      )
    }

    const { id, ...updateData } = validationResult.data

    // 소유권 확인
    const { data: existing } = await supabase
      .from('saved_announcements')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '저장된 공고를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 업데이트할 필드 구성
    const updateFields: Record<string, unknown> = {}

    if ('folderId' in updateData) {
      updateFields.folder_id = updateData.folderId
    }
    if ('tags' in updateData) {
      updateFields.tags = updateData.tags
    }
    if ('memo' in updateData) {
      updateFields.memo = updateData.memo
    }
    if ('notifyDeadline' in updateData) {
      updateFields.notify_deadline = updateData.notifyDeadline
    }

    const { data, error } = await (supabase
      .from('saved_announcements') as any)
      .update(updateFields)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Update saved announcement error:', error)
      return NextResponse.json(
        { success: false, error: '업데이트에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: '저장된 공고가 업데이트되었습니다',
    })
  } catch (error) {
    console.error('Update saved announcement error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
