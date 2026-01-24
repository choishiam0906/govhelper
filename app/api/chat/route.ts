import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { CHATBOT_PROMPT } from '@/lib/ai/prompts'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')

// 기업 정보 타입
interface CompanyData {
  id: string
  name: string
  industry: string | null
  employee_count: number | null
  location: string | null
  certifications: string[] | null
  annual_revenue: string | null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: '로그인이 필요해요' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { message, context } = await request.json()

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: '메시지를 입력해주세요' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 기업 정보 조회
    let companyProfile = ''
    let companyId: string | null = null
    const { data: companyData } = await supabase
      .from('companies')
      .select('id, name, industry, employee_count, location, certifications, annual_revenue')
      .eq('user_id', user.id)
      .single()

    const company = companyData as CompanyData | null

    if (company) {
      companyId = company.id
      companyProfile = `
기업명: ${company.name}
업종: ${company.industry || '미입력'}
직원수: ${company.employee_count || '미입력'}명
소재지: ${company.location || '미입력'}
인증: ${company.certifications?.join(', ') || '없음'}
연매출: ${company.annual_revenue || '미입력'}
`.trim()
    }

    // 최근 매칭 결과 조회 (상위 3개)
    let recentMatches = ''
    if (companyId) {
      const { data: matches } = await supabase
        .from('matches')
        .select(`
          match_score,
          announcements (title, organization)
        `)
        .eq('company_id', companyId)
        .order('match_score', { ascending: false })
        .limit(3)

      if (matches && matches.length > 0) {
        recentMatches = matches.map((m: { match_score: number; announcements: { title: string; organization: string } | null }, i: number) =>
          `${i + 1}. ${m.announcements?.title} (${m.match_score}점)`
        ).join('\n')
      }
    }

    // AI 프롬프트 생성
    const prompt = CHATBOT_PROMPT(message, {
      companyProfile: companyProfile || undefined,
      recentMatches: recentMatches || undefined,
      currentAnnouncement: context?.currentAnnouncement,
    })

    // Gemini 모델 호출 (스트리밍)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await model.generateContentStream(prompt)

          for await (const chunk of result.stream) {
            const text = chunk.text()
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Chat streaming error:', error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: '응답 생성 중 오류가 발생했어요' })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(JSON.stringify({ error: '채팅 처리 중 오류가 발생했어요' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
