import { GoogleGenerativeAI } from '@google/generative-ai'
import { MatchAnalysis, EligibilityCriteria, EvaluationCriteria, EvaluationExtractionResult } from '@/types'
import {
  MATCHING_ANALYSIS_PROMPT,
  ELIGIBILITY_PARSING_PROMPT,
  APPLICATION_SECTION_PROMPT,
  SECTION_IMPROVEMENT_PROMPT,
  EVALUATION_EXTRACTION_PROMPT,
} from './prompts'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')

// 모델 설정
const MODEL_NAME = 'gemini-2.5-flash'
const EMBEDDING_MODEL = 'text-embedding-004'

// 스트리밍 응답을 위한 제너레이터 함수
export async function* streamWithGemini(prompt: string): AsyncGenerator<string, void, unknown> {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME })

  try {
    const result = await model.generateContentStream(prompt)

    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) {
        yield text
      }
    }
  } catch (error) {
    console.error('Gemini streaming error:', error)
    throw error
  }
}

export async function analyzeMatchWithGemini(
  announcementContent: string,
  companyProfile: string,
  businessPlan: string
): Promise<MatchAnalysis> {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME })

  const prompt = MATCHING_ANALYSIS_PROMPT(announcementContent, companyProfile, businessPlan)

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response')
    }

    const analysis: MatchAnalysis = JSON.parse(jsonMatch[0])
    return analysis
  } catch (error) {
    console.error('Gemini analysis error:', error)
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

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL })

  try {
    const result = await model.embedContent(text)
    return result.embedding.values
  } catch (error) {
    console.error('Embedding generation error:', error)
    throw error
  }
}

// 지원자격 상세 파싱 함수
export async function parseEligibilityCriteria(
  announcementTitle: string,
  announcementContent: string,
  targetCompany: string | null
): Promise<EligibilityCriteria> {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME })

  const prompt = ELIGIBILITY_PARSING_PROMPT(announcementTitle, announcementContent, targetCompany)

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

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
    console.error('Eligibility parsing error:', error)
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
export async function* streamApplicationSection(
  section: string,
  announcementContent: string,
  companyProfile: string,
  businessPlan: string,
  companyContext?: string
): AsyncGenerator<string, void, unknown> {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME })

  // RAG 컨텍스트가 있으면 companyProfile에 추가
  const enrichedCompanyProfile = companyContext
    ? `${companyProfile}

## 사업계획서 참고 자료 (RAG)
${companyContext}`
    : companyProfile

  const prompt = APPLICATION_SECTION_PROMPT(section, announcementContent, enrichedCompanyProfile, businessPlan)

  try {
    const result = await model.generateContentStream(prompt)

    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) {
        yield text
      }
    }
  } catch (error) {
    console.error('Gemini section streaming error:', error)
    throw error
  }
}

// 섹션 개선 스트리밍 함수
export async function* streamSectionImprovement(
  section: string,
  currentContent: string,
  announcementContent: string,
  companyProfile: string
): AsyncGenerator<string, void, unknown> {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME })

  const prompt = SECTION_IMPROVEMENT_PROMPT(section, currentContent, announcementContent, companyProfile)

  try {
    const result = await model.generateContentStream(prompt)

    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) {
        yield text
      }
    }
  } catch (error) {
    console.error('Gemini improvement streaming error:', error)
    throw error
  }
}

// 배치 파싱 함수 (여러 공고를 한 번에 처리)
export async function parseEligibilityCriteriaBatch(
  announcements: Array<{
    id: string
    title: string
    content: string | null
    target_company: string | null
  }>
): Promise<Map<string, EligibilityCriteria>> {
  const results = new Map<string, EligibilityCriteria>()

  // 순차 처리 (Rate Limit 고려)
  for (const ann of announcements) {
    try {
      const criteria = await parseEligibilityCriteria(
        ann.title,
        ann.content || '',
        ann.target_company
      )
      results.set(ann.id, criteria)

      // Rate limiting: 요청 간 딜레이
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error(`Failed to parse eligibility for ${ann.id}:`, error)
    }
  }

  return results
}

// 평가기준 추출 함수
export async function extractEvaluationCriteria(
  announcementTitle: string,
  announcementContent: string
): Promise<EvaluationExtractionResult> {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME })

  const prompt = EVALUATION_EXTRACTION_PROMPT(announcementTitle, announcementContent)

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return {
        success: false,
        error: '평가기준을 추출할 수 없습니다.',
        rawText: text.substring(0, 500)
      }
    }

    const parsed = JSON.parse(jsonMatch[0])

    // found가 false인 경우
    if (!parsed.found) {
      return {
        success: false,
        error: '공고에서 평가기준 정보를 찾을 수 없습니다.',
        rawText: parsed.rawText || null
      }
    }

    // 평가기준 구조화
    const criteria: EvaluationCriteria = {
      totalScore: parsed.totalScore || 100,
      passingScore: parsed.passingScore || null,
      items: (parsed.items || []).map((item: {
        category?: string
        name?: string
        description?: string
        maxScore?: number
        weight?: number
        subItems?: Array<{
          name?: string
          description?: string
          maxScore?: number
          keywords?: string[]
        }>
      }) => ({
        category: item.category || '기타',
        name: item.name || '',
        description: item.description || '',
        maxScore: item.maxScore || 0,
        weight: item.weight || null,
        subItems: (item.subItems || []).map((sub: {
          name?: string
          description?: string
          maxScore?: number
          keywords?: string[]
        }) => ({
          name: sub.name || '',
          description: sub.description || '',
          maxScore: sub.maxScore || 0,
          keywords: sub.keywords || []
        }))
      })),
      bonusItems: (parsed.bonusItems || []).map((bonus: {
        name?: string
        score?: number
        condition?: string
        type?: 'bonus' | 'penalty'
      }) => ({
        name: bonus.name || '',
        score: bonus.score || 0,
        condition: bonus.condition || '',
        type: bonus.type || 'bonus'
      })),
      evaluationMethod: parsed.evaluationMethod ? {
        type: parsed.evaluationMethod.type || 'absolute',
        stages: parsed.evaluationMethod.stages || null,
        stageNames: parsed.evaluationMethod.stageNames || []
      } : undefined,
      extractedAt: new Date().toISOString(),
      confidence: parsed.confidence || 0.5,
      source: parsed.source || '본문'
    }

    // 요약 정보 생성
    const summary = {
      totalScore: criteria.totalScore,
      categories: criteria.items.reduce((acc: { name: string; maxScore: number; percentage: number }[], item) => {
        const existing = acc.find(c => c.name === item.category)
        if (existing) {
          existing.maxScore += item.maxScore
          existing.percentage = Math.round((existing.maxScore / criteria.totalScore) * 100)
        } else {
          acc.push({
            name: item.category,
            maxScore: item.maxScore,
            percentage: Math.round((item.maxScore / criteria.totalScore) * 100)
          })
        }
        return acc
      }, []),
      hasBonusItems: (criteria.bonusItems?.length || 0) > 0,
      passingScore: criteria.passingScore
    }

    return {
      success: true,
      criteria,
      summary,
      rawText: parsed.rawText || null
    }
  } catch (error) {
    console.error('평가기준 추출 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '평가기준 추출 중 오류가 발생했습니다.'
    }
  }
}

// 평가기준 배치 추출 함수
export async function extractEvaluationCriteriaBatch(
  announcements: Array<{
    id: string
    title: string
    content: string | null
  }>
): Promise<Map<string, EvaluationExtractionResult>> {
  const results = new Map<string, EvaluationExtractionResult>()

  // 순차 처리 (Rate Limit 고려)
  for (const ann of announcements) {
    try {
      const result = await extractEvaluationCriteria(
        ann.title,
        ann.content || ''
      )
      results.set(ann.id, result)

      // Rate limiting: 요청 간 딜레이
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error(`평가기준 추출 실패 (${ann.id}):`, error)
      results.set(ann.id, {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      })
    }
  }

  return results
}
