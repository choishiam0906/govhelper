import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

// 지원서 업데이트 스키마
const updateApplicationSchema = z.object({
  content: z.string().optional(),
  status: z.enum(['draft', 'completed']).optional(),
})

// GET: 지원서 상세 조회
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 지원서 조회
    const { data, error } = await supabase
      .from('applications')
      .select(`
        id,
        content,
        status,
        created_at,
        updated_at,
        matches (
          id,
          match_score,
          analysis,
          announcements (
            id,
            title,
            organization,
            category,
            support_type,
            support_amount,
            application_end
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: '지원서를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Application GET error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// PUT: 지원서 업데이트
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateApplicationSchema.parse(body)

    // 지원서 소유권 확인
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '지원서를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 업데이트
    const { data, error } = await (supabase
      .from('applications') as any)
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Application update error:', error)
      return NextResponse.json(
        { success: false, error: '업데이트에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '잘못된 요청입니다', details: (error as any).errors },
        { status: 400 }
      )
    }

    console.error('Application PUT error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// DELETE: 지원서 삭제
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Application delete error:', error)
      return NextResponse.json(
        { success: false, error: '삭제에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '지원서가 삭제되었습니다',
    })
  } catch (error) {
    console.error('Application DELETE error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
