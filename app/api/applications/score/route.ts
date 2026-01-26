import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { ApplicationScoreFeedback, EvaluationCriteria } from '@/types'
import { withRateLimit } from '@/lib/api-utils'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

interface ScoreRequest {
  announcementId: string
  sections: {
    section: string
    content: string
  }[]
}

interface ScoreResponse {
  success: boolean
  totalEstimatedScore: number
  totalMaxScore: number
  percentage: number
  sectionScores: ApplicationScoreFeedback[]
  overallFeedback: string
  error?: string
}

// 실시간 점수 분석 프롬프트
function getScorePrompt(
  sections: { section: string; content: string }[],
  evaluationCriteria: EvaluationCriteria
): string {
  const sectionsText = sections
    .map((s, i) => `### 섹션 ${i + 1}: ${s.section}\n${s.content || '(내용 없음)'}`)
    .join('\n\n')

  const criteriaText = evaluationCriteria.items
    .map(item => `- ${item.category}: ${item.name} (${item.maxScore}점)\n  ${item.description || ''}`)
    .join('\n')

  return `당신은 정부지원사업 평가 전문가입니다. 아래 지원서 내용을 평가기준에 따라 분석하고 예상 점수를 산정해주세요.

## 평가기준
총점: ${evaluationCriteria.totalScore}점
${evaluationCriteria.passingScore ? `합격기준: ${evaluationCriteria.passingScore}점 이상` : ''}

평가항목:
${criteriaText}

## 지원서 내용
${sectionsText}

---

# 분석 지침

1. 각 섹션이 어떤 평가항목과 관련되는지 파악하세요
2. 섹션 내용의 완성도, 구체성, 설득력을 평가하세요
3. 해당 평가항목에서 받을 수 있는 예상 점수를 산정하세요
4. 점수 향상을 위한 구체적인 피드백을 제공하세요

**평가 기준:**
- 내용이 없거나 매우 부족: 0-20% 득점
- 기본적인 내용만 있음: 30-50% 득점
- 적절한 내용이 있음: 50-70% 득점
- 잘 작성됨: 70-85% 득점
- 매우 우수함: 85-100% 득점

---

# 응답 형식 (JSON만 반환)

{
  "sectionScores": [
    {
      "section": "사업개요",
      "relatedEvalItems": ["기술성", "사업화 계획"],
      "estimatedScore": 25,
      "maxScore": 30,
      "feedback": "기술의 혁신성은 잘 설명되어 있으나, 기존 기술과의 차별점이 더 명확하면 좋겠어요",
      "suggestions": ["경쟁사 대비 기술적 우위 수치화", "특허/논문 등 기술력 근거 추가"]
    }
  ],
  "totalEstimatedScore": 75,
  "totalMaxScore": 100,
  "overallFeedback": "전반적으로 잘 작성되었으나, 사업화 전략 부분을 보강하면 더 높은 점수를 받을 수 있어요"
}

**주의사항:**
- 섹션별로 분석하되, 중복 평가는 피하세요
- 점수는 보수적으로 산정하세요 (실제 심사보다 낮게)
- 피드백은 구체적이고 실행 가능하게 작성하세요
- JSON만 응답하세요. 설명이나 마크다운 없이 순수 JSON만 출력`
}

// 평가기준 없을 때 기본 기준으로 분석
function getDefaultScorePrompt(
  sections: { section: string; content: string }[]
): string {
  const sectionsText = sections
    .map((s, i) => `### 섹션 ${i + 1}: ${s.section}\n${s.content || '(내용 없음)'}`)
    .join('\n\n')

  return `당신은 정부지원사업 평가 전문가입니다. 아래 지원서 내용을 일반적인 정부지원사업 평가기준에 따라 분석해주세요.

## 일반적인 평가기준 (총 100점)
- 기술성/기술개발역량 (30점): 기술의 혁신성, 차별성, 개발 계획의 적정성
- 사업성/사업화역량 (25점): 사업화 전략, 수익 모델, 시장 진입 전략
- 시장성 (20점): 목표 시장 규모, 성장성, 경쟁력
- 역량 (15점): 대표자 및 팀 역량, 관련 경험
- 정책부합도 (10점): 사업 목적과의 부합성

## 지원서 내용
${sectionsText}

---

# 응답 형식 (JSON만 반환)

{
  "sectionScores": [
    {
      "section": "사업개요",
      "relatedEvalItems": ["기술성", "사업성"],
      "estimatedScore": 25,
      "maxScore": 30,
      "feedback": "기술의 혁신성은 잘 설명되어 있으나, 기존 기술과의 차별점이 더 명확하면 좋겠어요",
      "suggestions": ["경쟁사 대비 기술적 우위 수치화", "특허/논문 등 기술력 근거 추가"]
    }
  ],
  "totalEstimatedScore": 75,
  "totalMaxScore": 100,
  "overallFeedback": "전반적으로 잘 작성되었으나, 사업화 전략 부분을 보강하면 더 높은 점수를 받을 수 있어요"
}

**주의:** JSON만 응답하세요`
}

async function handlePost(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: ScoreRequest = await request.json()
    const { announcementId, sections } = body

    if (!announcementId || !sections || sections.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 내용이 있는 섹션만 필터링
    const validSections = sections.filter(s => s.content && s.content.trim().length > 10)

    if (validSections.length === 0) {
      return NextResponse.json({
        success: true,
        totalEstimatedScore: 0,
        totalMaxScore: 100,
        percentage: 0,
        sectionScores: [],
        overallFeedback: '지원서 내용을 작성하면 예상 점수를 확인할 수 있어요'
      })
    }

    // 공고의 평가기준 조회
    const { data: announcementData } = await supabase
      .from('announcements')
      .select('evaluation_criteria, title')
      .eq('id', announcementId)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const announcement = announcementData as { evaluation_criteria?: any; title?: string } | null
    const evaluationCriteria = announcement?.evaluation_criteria as EvaluationCriteria | null

    // AI 분석
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = evaluationCriteria
      ? getScorePrompt(validSections, evaluationCriteria)
      : getDefaultScorePrompt(validSections)

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2000,
      },
    })

    const text = result.response.text()

    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json(
        { success: false, error: '분석 결과를 파싱할 수 없어요' },
        { status: 500 }
      )
    }

    const parsed = JSON.parse(jsonMatch[0])

    const response: ScoreResponse = {
      success: true,
      totalEstimatedScore: parsed.totalEstimatedScore || 0,
      totalMaxScore: parsed.totalMaxScore || 100,
      percentage: Math.round((parsed.totalEstimatedScore / (parsed.totalMaxScore || 100)) * 100),
      sectionScores: (parsed.sectionScores || []).map((s: ApplicationScoreFeedback) => ({
        section: s.section,
        relatedEvalItems: s.relatedEvalItems || [],
        estimatedScore: s.estimatedScore || 0,
        maxScore: s.maxScore || 0,
        feedback: s.feedback || '',
        suggestions: s.suggestions || []
      })),
      overallFeedback: parsed.overallFeedback || ''
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Score analysis error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// AI Rate Limit 적용 (분당 10회)
export const POST = withRateLimit(handlePost, 'ai')
