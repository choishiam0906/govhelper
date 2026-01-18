import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { improveApplicationSection } from '@/lib/ai/claude'
import { z } from 'zod'
import {
  aiRateLimiter,
  checkRateLimit,
  getClientIP,
  getRateLimitHeaders,
  isRateLimitEnabled,
} from '@/lib/rate-limit'

interface RouteParams {
  params: Promise<{ id: string }>
}

// AI 개선 요청 스키마
const improveSchema = z.object({
  sectionIndex: z.number().min(0).max(4),
  currentContent: z.string().min(1),
  feedback: z.string().min(1),
})

// POST: AI 섹션 개선
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  // Rate Limiting 체크
  if (isRateLimitEnabled()) {
    const ip = getClientIP(request)
    const result = await checkRateLimit(aiRateLimiter, ip)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: getRateLimitHeaders(result),
        }
      )
    }
  }

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
    const validatedData = improveSchema.parse(body)

    // 지원서 소유권 확인
    const { data: applicationData } = await supabase
      .from('applications')
      .select('id, content')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    const application = applicationData as { id: string; content: string | null } | null

    if (!application) {
      return NextResponse.json(
        { success: false, error: '지원서를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // AI로 섹션 개선
    const improvedContent = await improveApplicationSection(
      validatedData.currentContent,
      validatedData.feedback
    )

    // 지원서 내용 업데이트
    const contentJson = JSON.parse(application.content || '{}')
    if (contentJson.sections && contentJson.sections[validatedData.sectionIndex]) {
      contentJson.sections[validatedData.sectionIndex].content = improvedContent
      contentJson.sections[validatedData.sectionIndex].improvedAt = new Date().toISOString()
    }

    const { error: updateError } = await (supabase
      .from('applications') as any)
      .update({
        content: JSON.stringify(contentJson),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Application update error:', updateError)
      return NextResponse.json(
        { success: false, error: '저장에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        improvedContent,
        sectionIndex: validatedData.sectionIndex,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '잘못된 요청입니다', details: (error as any).errors },
        { status: 400 }
      )
    }

    console.error('Application improve error:', error)
    return NextResponse.json(
      { success: false, error: 'AI 개선 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
