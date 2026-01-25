import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  sections: z.array(z.object({
    sectionName: z.string(),
    content: z.string(),
  })),
  isDefault: z.boolean().optional(),
})

// GET: 템플릿 목록 조회
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

    const { data, error } = await (supabase
      .from('application_templates') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('use_count', { ascending: false })
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Templates fetch error:', error)
      return NextResponse.json(
        { success: false, error: '템플릿 목록 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Templates GET error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// POST: 새 템플릿 생성
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
    const validationResult = createTemplateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 템플릿 정보입니다' },
        { status: 400 }
      )
    }

    const { name, description, sections, isDefault } = validationResult.data

    // 템플릿 개수 제한 (최대 10개)
    const { count } = await (supabase
      .from('application_templates') as any)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (count && count >= 10) {
      return NextResponse.json(
        { success: false, error: '템플릿은 최대 10개까지 저장할 수 있어요' },
        { status: 400 }
      )
    }

    const { data, error } = await (supabase
      .from('application_templates') as any)
      .insert({
        user_id: user.id,
        name,
        description,
        sections,
        is_default: isDefault || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Template create error:', error)
      return NextResponse.json(
        { success: false, error: '템플릿 생성에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Templates POST error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
