import { GoogleGenerativeAI } from '@google/generative-ai'
import { MatchAnalysis } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')

export async function analyzeMatchWithGemini(
  announcementContent: string,
  companyProfile: string,
  businessPlan: string
): Promise<MatchAnalysis> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

  const prompt = `
당신은 정부지원사업 매칭 전문가입니다. 아래 정보를 바탕으로 해당 기업이 지원사업에 얼마나 적합한지 분석해주세요.

## 공고 내용
${announcementContent}

## 기업 프로필
${companyProfile}

## 사업계획서 요약
${businessPlan}

## 평가 기준
1. 기술성 (30점): 기술의 혁신성, 차별성, 완성도
2. 시장성 (25점): 시장 규모, 성장성, 경쟁력
3. 사업성 (25점): 사업화 전략, 수익 모델, 실현 가능성
4. 가점 항목 (20점): 벤처 인증, 이노비즈, 여성기업, 사회적기업 등

다음 JSON 형식으로 응답해주세요:
{
  "overallScore": 0-100 사이의 종합 점수,
  "technicalScore": 0-30 사이의 기술성 점수,
  "marketScore": 0-25 사이의 시장성 점수,
  "businessScore": 0-25 사이의 사업성 점수,
  "bonusPoints": 0-20 사이의 가점,
  "strengths": ["강점1", "강점2", "강점3"],
  "weaknesses": ["약점1", "약점2"],
  "recommendations": ["추천사항1", "추천사항2"]
}

JSON만 응답하세요.
`

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
      overallScore: 0,
      technicalScore: 0,
      marketScore: 0,
      businessScore: 0,
      bonusPoints: 0,
      strengths: [],
      weaknesses: ['분석 중 오류가 발생했습니다.'],
      recommendations: ['다시 시도해주세요.']
    }
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })

  try {
    const result = await model.embedContent(text)
    return result.embedding.values
  } catch (error) {
    console.error('Embedding generation error:', error)
    throw error
  }
}
