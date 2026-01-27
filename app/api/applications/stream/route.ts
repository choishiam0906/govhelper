import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamApplicationSection } from '@/lib/ai'
import { checkUsageLimit } from '@/lib/queries/dashboard'
import { Tables } from '@/types/database'
import {
  aiRateLimiter,
  checkRateLimit,
  getClientIP,
  isRateLimitEnabled,
} from '@/lib/rate-limit'
import { z } from 'zod'
import { getCompanyContextForApplication, hasCompanyDocuments } from '@/lib/company-documents/rag'

// 요청 스키마
const createApplicationSchema = z.object({
  matchId: z.string().uuid(),
})

// 섹션 목록
const SECTIONS = ['사업 개요', '기술 현황', '시장 분석', '사업화 전략', '기대 효과']

// POST: 지원서 생성 (스트리밍)
export async function POST(request: NextRequest) {
  try {
    // Rate Limit 체크
    if (isRateLimitEnabled()) {
      const ip = getClientIP(request)
      const result = await checkRateLimit(aiRateLimiter, ip)

      if (!result.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.',
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: '인증이 필요합니다' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await request.json()
    const validatedData = createApplicationSchema.parse(body)

    // 기업 정보 조회
    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const company = companyData as Tables<'companies'> | null

    if (!company) {
      return new Response(
        JSON.stringify({ success: false, error: '기업 정보가 필요합니다' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 사용량 체크
    const usage = await checkUsageLimit(supabase, user.id, company.id, 'application')
    if (!usage.allowed) {
      return new Response(
        JSON.stringify({ success: false, error: '이번 달 사용량을 초과했습니다' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 매칭 결과 조회 (공고 정보 포함)
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .select(`
        id,
        analysis,
        company_id,
        announcements (
          id,
          title,
          organization,
          category,
          support_type,
          support_amount,
          content,
          parsed_content
        )
      `)
      .eq('id', validatedData.matchId)
      .eq('company_id', company.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const match = matchData as any

    if (matchError || !match) {
      return new Response(
        JSON.stringify({ success: false, error: '매칭 결과를 찾을 수 없습니다' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 기존 지원서가 있는지 확인
    const { data: existingAppData } = await supabase
      .from('applications')
      .select('id')
      .eq('match_id', validatedData.matchId)
      .eq('user_id', user.id)
      .single()

    const existingApp = existingAppData as { id: string } | null

    if (existingApp) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '이미 지원서가 존재합니다',
          existingId: existingApp.id,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const announcement = match.announcements as any

    // 공고 내용 준비
    const announcementContent = announcement.parsed_content || announcement.content || `
제목: ${announcement.title}
주관기관: ${announcement.organization || '미상'}
분류: ${announcement.category || '미상'}
지원유형: ${announcement.support_type || '미상'}
지원금액: ${announcement.support_amount || '미상'}
`

    // 기업 프로필 준비
    const companyProfile = `
기업명: ${company.name}
업종: ${company.industry || '미상'}
직원수: ${company.employee_count || '미상'}명
설립일: ${company.founded_date || '미상'}
소재지: ${company.location || '미상'}
보유인증: ${(company.certifications as string[])?.join(', ') || '없음'}
연매출: ${company.annual_revenue ? `${company.annual_revenue.toLocaleString()}원` : '미상'}
기업소개: ${company.description || '없음'}
`

    // 사업계획서 조회 (있는 경우)
    const { data: businessPlanData } = await supabase
      .from('business_plans')
      .select('parsed_content, content')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const businessPlan = businessPlanData as { parsed_content: string | null; content: string | null } | null
    const businessPlanContent = businessPlan?.parsed_content || businessPlan?.content || '사업계획서 정보 없음'

    // RAG 컨텍스트 조회 (PDF 사업계획서 기반)
    let companyDocContext = ''
    try {
      const hasDocuments = await hasCompanyDocuments(supabase, company.id)
      if (hasDocuments) {
        // 공고 정보를 기반으로 관련 컨텍스트 조회
        companyDocContext = await getCompanyContextForApplication(
          supabase,
          company.id,
          announcement.title
        )
      }
    } catch (ragError) {
      console.error('[Application Stream] RAG context error (continuing without):', ragError)
    }

    // 스트리밍 응답 생성
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const sections: { section: string; content: string }[] = []

          // 시작 알림
          const startData = JSON.stringify({
            type: 'start',
            message: 'AI가 지원서를 작성합니다...',
            totalSections: SECTIONS.length,
          })
          controller.enqueue(encoder.encode(`data: ${startData}\n\n`))

          // 각 섹션 생성
          for (let i = 0; i < SECTIONS.length; i++) {
            const sectionName = SECTIONS[i]
            let sectionContent = ''

            // 섹션 시작 알림
            const sectionStartData = JSON.stringify({
              type: 'section_start',
              sectionIndex: i,
              sectionName,
              progress: Math.round((i / SECTIONS.length) * 100),
            })
            controller.enqueue(encoder.encode(`data: ${sectionStartData}\n\n`))

            // 섹션 스트리밍 생성 (RAG 컨텍스트 포함)
            for await (const chunk of streamApplicationSection(
              sectionName,
              announcementContent,
              companyProfile,
              businessPlanContent,
              companyDocContext || undefined
            )) {
              sectionContent += chunk

              // 청크 전송
              const chunkData = JSON.stringify({
                type: 'chunk',
                sectionIndex: i,
                chunk,
              })
              controller.enqueue(encoder.encode(`data: ${chunkData}\n\n`))
            }

            // 섹션 완료
            sections.push({ section: sectionName, content: sectionContent })

            const sectionCompleteData = JSON.stringify({
              type: 'section_complete',
              sectionIndex: i,
              sectionName,
              content: sectionContent,
              progress: Math.round(((i + 1) / SECTIONS.length) * 100),
            })
            controller.enqueue(encoder.encode(`data: ${sectionCompleteData}\n\n`))
          }

          // 지원서 저장
          const contentJson = {
            sections,
            metadata: {
              announcementId: announcement.id,
              announcementTitle: announcement.title,
              generatedAt: new Date().toISOString(),
            },
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: application, error: insertError } = await (supabase
            .from('applications') as any)
            .insert({
              match_id: validatedData.matchId,
              user_id: user.id,
              content: JSON.stringify(contentJson),
              status: 'draft',
            })
            .select()
            .single()

          if (insertError) {
            throw new Error('지원서 저장에 실패했습니다')
          }

          // 완료 신호 전송
          const doneData = JSON.stringify({
            type: 'complete',
            done: true,
            applicationId: application.id,
            progress: 100,
          })
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`))

          controller.close()
        } catch (error) {
          console.error('Application streaming error:', error)
          const errorData = JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'AI 지원서 작성 중 오류가 발생했어요',
            done: true,
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ success: false, error: '잘못된 요청입니다' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.error('Application stream error:', error)
    return new Response(
      JSON.stringify({ success: false, error: '서버 오류가 발생했습니다' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
