import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  sections: z.array(z.object({
    sectionName: z.string(),
    content: z.string(),
  })).optional(),
  isDefault: z.boolean().optional(),
})

// GET: 템플릿 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { data, error } = await (supabase
      .from('application_templates') as any)
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: '템플릿을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Template GET error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// PUT: 템플릿 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const validationResult = updateTemplateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 템플릿 정보입니다' },
        { status: 400 }
      )
    }

    const { name, description, sections, isDefault } = validationResult.data

    // 템플릿 소유권 확인
    const { data: existing } = await (supabase
      .from('application_templates') as any)
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '템플릿을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (sections !== undefined) updateData.sections = sections
    if (isDefault !== undefined) updateData.is_default = isDefault

    const { data, error } = await (supabase
      .from('application_templates') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Template update error:', error)
      return NextResponse.json(
        { success: false, error: '템플릿 수정에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Template PUT error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// DELETE: 템플릿 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { error } = await (supabase
      .from('application_templates') as any)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Template delete error:', error)
      return NextResponse.json(
        { success: false, error: '템플릿 삭제에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '템플릿이 삭제되었습니다',
    })
  } catch (error) {
    console.error('Template DELETE error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
