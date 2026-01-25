import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createFolderSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().default('gray'),
  icon: z.string().default('folder'),
})

const updateFolderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  position: z.number().optional(),
})

// GET: 폴더 목록 조회
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
      .from('saved_announcement_folders')
      .select('*')
      .eq('user_id', user.id)
      .order('position', { ascending: true })

    if (error) {
      console.error('Get folders error:', error)
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
    console.error('Get folders error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// POST: 폴더 생성
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
    const validationResult = createFolderSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 요청입니다' },
        { status: 400 }
      )
    }

    const { name, color, icon } = validationResult.data

    // 같은 이름의 폴더가 있는지 확인
    const { data: existing } = await supabase
      .from('saved_announcement_folders')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', name)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: '같은 이름의 폴더가 이미 있습니다' },
        { status: 400 }
      )
    }

    // 현재 최대 position 조회
    const { data: maxPositionData } = await supabase
      .from('saved_announcement_folders')
      .select('position')
      .eq('user_id', user.id)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nextPosition = ((maxPositionData as any)?.position ?? -1) + 1

    const { data, error } = await (supabase
      .from('saved_announcement_folders') as any)
      .insert({
        user_id: user.id,
        name,
        color,
        icon,
        position: nextPosition,
      })
      .select()
      .single()

    if (error) {
      console.error('Create folder error:', error)
      return NextResponse.json(
        { success: false, error: '폴더 생성에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: '폴더가 생성되었습니다',
    })
  } catch (error) {
    console.error('Create folder error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// PATCH: 폴더 수정
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
    const validationResult = updateFolderSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 요청입니다' },
        { status: 400 }
      )
    }

    const { id, ...updateData } = validationResult.data

    const { data, error } = await (supabase
      .from('saved_announcement_folders') as any)
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Update folder error:', error)
      return NextResponse.json(
        { success: false, error: '폴더 수정에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: '폴더가 수정되었습니다',
    })
  } catch (error) {
    console.error('Update folder error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// DELETE: 폴더 삭제
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
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: '폴더 ID가 필요합니다' },
        { status: 400 }
      )
    }

    // 폴더 삭제 (해당 폴더의 공고는 folder_id가 NULL로 설정됨 - ON DELETE SET NULL)
    const { error } = await supabase
      .from('saved_announcement_folders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Delete folder error:', error)
      return NextResponse.json(
        { success: false, error: '폴더 삭제에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '폴더가 삭제되었습니다',
    })
  } catch (error) {
    console.error('Delete folder error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
