import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
  feedbackRateLimiter,
  checkRateLimit,
  getClientIP,
  getRateLimitHeaders,
  isRateLimitEnabled,
} from '@/lib/rate-limit'

// 요청 스키마
const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'general', 'other']).default('general'),
  subject: z.string().max(255).optional(),
  message: z.string().min(10, '피드백은 10자 이상 입력해 주세요').max(2000),
  email: z.string().email('올바른 이메일 형식이 아니에요').optional().or(z.literal('')),
  pageUrl: z.string().optional(),
})

export async function POST(request: NextRequest) {
  // Rate Limit 체크 (스팸 방지)
  if (isRateLimitEnabled()) {
    const ip = getClientIP(request)
    const result = await checkRateLimit(feedbackRateLimiter, ip)

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
    const body = await request.json()

    // 요청 검증
    const validationResult = feedbackSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const { type, subject, message, email, pageUrl } = validationResult.data

    // Supabase 클라이언트 (서비스 롤)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 사용자 정보 가져오기 (로그인한 경우)
    let userId: string | null = null
    let userEmail: string | null = email || null

    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) {
        userId = user.id
        userEmail = userEmail || user.email || null
      }
    }

    // User-Agent 가져오기
    const userAgent = request.headers.get('user-agent') || null

    // 피드백 저장
    const { data, error } = await supabase
      .from('feedbacks')
      .insert({
        user_id: userId,
        email: userEmail,
        type,
        subject: subject || null,
        message,
        page_url: pageUrl || null,
        user_agent: userAgent,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Feedback save error:', error)
      return NextResponse.json(
        { success: false, error: '피드백 저장에 실패했어요' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '소중한 피드백 감사해요!',
      data: { id: data.id },
    })
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했어요' },
      { status: 500 }
    )
  }
}
