import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamWithGemini } from '@/lib/ai'
import { z } from 'zod'
import { getCompanyContextForApplication, hasCompanyDocuments } from '@/lib/company-documents/rag'

interface RouteParams {
  params: Promise<{ id: string }>
}

// AI 개선 요청 스키마
const improveSchema = z.object({
  sectionIndex: z.number().min(0).max(4),
  currentContent: z.string().min(1),
  feedback: z.string().min(1),
})

// POST: AI 섹션 개선 (스트리밍)
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: '인증이 필요합니다' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
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
      return new Response(
        JSON.stringify({ success: false, error: '지원서를 찾을 수 없습니다' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 기업 정보 조회 (RAG 컨텍스트용)
    const { data: companyResult } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const companyData = companyResult as { id: string } | null

    // RAG 컨텍스트 조회
    let companyContext = ''
    if (companyData?.id) {
      try {
        const hasDocuments = await hasCompanyDocuments(supabase, companyData.id)
        if (hasDocuments) {
          // 현재 섹션 이름 가져오기
          const contentJson = JSON.parse(application.content || '{}')
          const sectionName = contentJson.sections?.[validatedData.sectionIndex]?.section || ''
          companyContext = await getCompanyContextForApplication(supabase, companyData.id, sectionName)
        }
      } catch (ragError) {
        console.error('[Improve Stream] RAG context error (continuing without):', ragError)
      }
    }

    // 프롬프트 생성 (RAG 컨텍스트 포함)
    const contextSection = companyContext
      ? `

## 기업 관련 참고 자료
${companyContext}
`
      : ''

    const prompt = `
현재 지원서 내용:
${validatedData.currentContent}
${contextSection}
수정 요청:
${validatedData.feedback}

위 피드백을 반영하여 내용을 개선해주세요. ${companyContext ? '필요한 경우 기업 관련 참고 자료를 활용하세요. ' : ''}개선된 내용만 출력하세요.
`

    // 스트리밍 응답 생성
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = ''

          for await (const chunk of streamWithGemini(prompt)) {
            fullContent += chunk
            // SSE 형식으로 데이터 전송
            const data = JSON.stringify({ chunk, done: false })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          }

          // 완료 시 전체 콘텐츠와 함께 done 전송
          const doneData = JSON.stringify({
            chunk: '',
            done: true,
            fullContent,
            sectionIndex: validatedData.sectionIndex
          })
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`))

          // 지원서 내용 업데이트
          const contentJson = JSON.parse(application.content || '{}')
          if (contentJson.sections && contentJson.sections[validatedData.sectionIndex]) {
            contentJson.sections[validatedData.sectionIndex].content = fullContent
            contentJson.sections[validatedData.sectionIndex].improvedAt = new Date().toISOString()
          }

          await (supabase
            .from('applications') as any)
            .update({
              content: JSON.stringify(contentJson),
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)

          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          const errorData = JSON.stringify({
            error: 'AI 처리 중 오류가 발생했어요',
            done: true
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

    console.error('Application improve stream error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'AI 개선 처리 중 오류가 발생했어요' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
