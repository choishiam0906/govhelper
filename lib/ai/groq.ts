import Groq from 'groq-sdk'
import { MatchAnalysis, EligibilityCriteria } from '@/types'
import {
  MATCHING_ANALYSIS_PROMPT,
  ELIGIBILITY_PARSING_PROMPT,
  APPLICATION_SECTION_PROMPT,
  SECTION_IMPROVEMENT_PROMPT,
} from './prompts'

// Groq 클라이언트 초기화
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
})

// 모델 설정 - Llama 3.3 70B (무료, 고성능)
const MODEL_NAME = 'llama-3.3-70b-versatile'

// Groq 사용 가능 여부 확인
export function isGroqAvailable(): boolean {
  return !!process.env.GROQ_API_KEY
}

// 스트리밍 응답을 위한 제너레이터 함수
export async function* streamWithGroq(prompt: string): AsyncGenerator<string, void, unknown> {
  try {
    const stream = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: '당신은 정부지원사업 매칭 전문가입니다. 정확하고 유용한 분석을 제공합니다.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: true,
      temperature: 0.3,
      max_tokens: 4096,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  } catch (error) {
    console.error('Groq streaming error:', error)
    throw error
  }
}

// 매칭 분석 함수
export async function analyzeMatchWithGroq(
  announcementContent: string,
  companyProfile: string,
  businessPlan: string
): Promise<MatchAnalysis> {
  const prompt = MATCHING_ANALYSIS_PROMPT(announcementContent, companyProfile, businessPlan)

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: '당신은 정부지원사업 매칭 전문가입니다. JSON 형식으로만 응답해야 합니다.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4096,
    })

    const text = completion.choices[0]?.message?.content || ''

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response')
    }

    const analysis: MatchAnalysis = JSON.parse(jsonMatch[0])
    return analysis
  } catch (error) {
    console.error('Groq analysis error:', error)
    // Return default analysis on error
    return {
      eligibility: {
        isEligible: false,
        checks: {
          industry: { passed: false, requirement: '확인 불가', companyValue: '-', reason: '분석 오류' },
          region: { passed: false, requirement: '확인 불가', companyValue: '-', reason: '분석 오류' },
          companyAge: { passed: false, requirement: '확인 불가', companyValue: '-', reason: '분석 오류' },
          revenue: { passed: false, requirement: '확인 불가', companyValue: '-', reason: '분석 오류' },
          employeeCount: { passed: false, requirement: '확인 불가', companyValue: '-', reason: '분석 오류' },
        },
        failedReasons: ['분석 중 오류가 발생했습니다.']
      },
      overallScore: 0,
      technicalScore: 0,
      marketScore: 0,
      businessScore: 0,
      fitScore: 0,
      bonusPoints: 0,
      strengths: [],
      weaknesses: ['분석 중 오류가 발생했습니다.'],
      recommendations: ['다시 시도해주세요.']
    }
  }
}

// 지원자격 상세 파싱 함수
export async function parseEligibilityCriteriaWithGroq(
  announcementTitle: string,
  announcementContent: string,
  targetCompany: string | null
): Promise<EligibilityCriteria> {
  const prompt = ELIGIBILITY_PARSING_PROMPT(announcementTitle, announcementContent, targetCompany)

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: '당신은 정부지원사업 지원자격 분석 전문가입니다. JSON 형식으로만 응답해야 합니다.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 2048,
    })

    const text = completion.choices[0]?.message?.content || ''

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse eligibility criteria')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Add metadata
    const criteria: EligibilityCriteria = {
      companyTypes: parsed.companyTypes || [],
      employeeCount: parsed.employeeCount || null,
      revenue: parsed.revenue || null,
      businessAge: parsed.businessAge || null,
      industries: parsed.industries || { included: [], excluded: [], description: '' },
      regions: parsed.regions || { included: [], excluded: [], description: '' },
      requiredCertifications: parsed.requiredCertifications || [],
      additionalRequirements: parsed.additionalRequirements || [],
      exclusions: parsed.exclusions || [],
      summary: parsed.summary || '',
      confidence: parsed.confidence || 0.5,
      parsedAt: new Date().toISOString()
    }

    return criteria
  } catch (error) {
    console.error('Groq eligibility parsing error:', error)
    // Return default empty criteria on error
    return {
      companyTypes: [],
      employeeCount: null,
      revenue: null,
      businessAge: null,
      industries: { included: [], excluded: [], description: '' },
      regions: { included: [], excluded: [], description: '' },
      requiredCertifications: [],
      additionalRequirements: [],
      exclusions: [],
      summary: '지원자격 정보를 파싱할 수 없습니다.',
      confidence: 0,
      parsedAt: new Date().toISOString()
    }
  }
}

// 지원서 섹션 스트리밍 생성 함수
export async function* streamApplicationSectionWithGroq(
  section: string,
  announcementContent: string,
  companyProfile: string,
  businessPlan: string
): AsyncGenerator<string, void, unknown> {
  const prompt = APPLICATION_SECTION_PROMPT(section, announcementContent, companyProfile, businessPlan)

  try {
    const stream = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: '당신은 정부지원사업 지원서 작성 전문가입니다. 전문적이고 설득력 있는 내용을 작성합니다.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: true,
      temperature: 0.5,
      max_tokens: 4096,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  } catch (error) {
    console.error('Groq section streaming error:', error)
    throw error
  }
}

// 섹션 개선 스트리밍 함수
export async function* streamSectionImprovementWithGroq(
  section: string,
  currentContent: string,
  announcementContent: string,
  companyProfile: string
): AsyncGenerator<string, void, unknown> {
  const prompt = SECTION_IMPROVEMENT_PROMPT(section, currentContent, announcementContent, companyProfile)

  try {
    const stream = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: '당신은 정부지원사업 지원서 개선 전문가입니다. 기존 내용을 더 설득력 있게 개선합니다.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: true,
      temperature: 0.5,
      max_tokens: 4096,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  } catch (error) {
    console.error('Groq improvement streaming error:', error)
    throw error
  }
}

// 배치 파싱 함수 (여러 공고를 한 번에 처리)
export async function parseEligibilityCriteriaBatchWithGroq(
  announcements: Array<{
    id: string
    title: string
    content: string | null
    target_company: string | null
  }>
): Promise<Map<string, EligibilityCriteria>> {
  const results = new Map<string, EligibilityCriteria>()

  // 순차 처리 (Rate Limit 고려 - Groq는 더 관대함)
  for (const ann of announcements) {
    try {
      const criteria = await parseEligibilityCriteriaWithGroq(
        ann.title,
        ann.content || '',
        ann.target_company
      )
      results.set(ann.id, criteria)

      // Rate limiting: 요청 간 딜레이 (Groq는 200ms면 충분)
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (error) {
      console.error(`Failed to parse eligibility for ${ann.id}:`, error)
    }
  }

  return results
}
