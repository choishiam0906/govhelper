import { GoogleGenerativeAI } from '@google/generative-ai'
import { MatchAnalysis } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')

// 스트리밍 응답을 위한 제너레이터 함수
export async function* streamWithGemini(prompt: string): AsyncGenerator<string, void, unknown> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

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
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

  const prompt = `
당신은 정부지원사업 매칭 전문가입니다. 아래 정보를 바탕으로 **2단계 평가**를 수행해주세요.

## 공고 내용
${announcementContent}

## 기업 프로필
${companyProfile}

## 사업계획서 요약
${businessPlan}

---

# 평가 방법

## 1단계: 자격 조건 체크 (Pass/Fail)
공고의 지원 자격 요건과 기업 정보를 비교하여 각 조건의 충족 여부를 판단합니다.
- 업종 조건: 공고에서 요구하는 업종과 기업의 업종 일치 여부
- 지역 조건: 수도권/비수도권, 특정 지역 제한 여부
- 업력 조건: 창업 N년 이내, 설립 N년 이상 등
- 매출 조건: 연매출 상한/하한 제한
- 직원수 조건: 중소기업 기준 등

**중요**: 공고에 명시되지 않은 조건은 "제한 없음"으로 처리하고 passed: true로 설정하세요.

## 2단계: 적합도 점수 (총 100점)
자격 조건을 통과한 경우에만 점수를 부여합니다.
- 기술성 (25점): 기술의 혁신성, 차별성, 기술 역량
- 시장성 (20점): 시장 규모, 성장성, 경쟁력
- 사업성 (20점): 사업화 전략, 수익 모델, 실현 가능성
- 공고부합도 (25점): 공고 목적/취지와의 부합도, 지원 분야 적합성
- 가점 (10점): 벤처/이노비즈/여성기업/사회적기업 등 인증

---

# 응답 형식 (JSON만 반환)

{
  "eligibility": {
    "isEligible": true 또는 false,
    "checks": {
      "industry": {
        "passed": true/false,
        "requirement": "공고에서 요구하는 업종 조건",
        "companyValue": "기업의 업종",
        "reason": "판단 근거"
      },
      "region": {
        "passed": true/false,
        "requirement": "공고의 지역 조건",
        "companyValue": "기업 소재지",
        "reason": "판단 근거"
      },
      "companyAge": {
        "passed": true/false,
        "requirement": "공고의 업력 조건",
        "companyValue": "기업 설립연도/업력",
        "reason": "판단 근거"
      },
      "revenue": {
        "passed": true/false,
        "requirement": "공고의 매출 조건",
        "companyValue": "기업 연매출",
        "reason": "판단 근거"
      },
      "employeeCount": {
        "passed": true/false,
        "requirement": "공고의 직원수 조건",
        "companyValue": "기업 직원수",
        "reason": "판단 근거"
      }
    },
    "failedReasons": ["불합격 사유1", "불합격 사유2"]
  },
  "overallScore": 0-100,
  "technicalScore": 0-25,
  "marketScore": 0-20,
  "businessScore": 0-20,
  "fitScore": 0-25,
  "bonusPoints": 0-10,
  "strengths": ["강점1", "강점2", "강점3"],
  "weaknesses": ["보완점1", "보완점2"],
  "recommendations": ["추천사항1", "추천사항2"]
}

**주의사항**:
- 자격 미달(isEligible: false)인 경우에도 참고용으로 점수를 부여하되, overallScore는 0으로 설정
- failedReasons는 isEligible이 false일 때만 내용을 채움
- JSON만 응답하세요
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
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })

  try {
    const result = await model.embedContent(text)
    return result.embedding.values
  } catch (error) {
    console.error('Embedding generation error:', error)
    throw error
  }
}
