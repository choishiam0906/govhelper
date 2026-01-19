import { GoogleGenerativeAI } from '@google/generative-ai'
import { MatchAnalysis, EligibilityCriteria } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')

// 스트리밍 응답을 위한 제너레이터 함수
export async function* streamWithGemini(prompt: string): AsyncGenerator<string, void, unknown> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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

// 지원자격 상세 파싱 함수
export async function parseEligibilityCriteria(
  announcementTitle: string,
  announcementContent: string,
  targetCompany: string | null
): Promise<EligibilityCriteria> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `
당신은 정부지원사업 공고 분석 전문가입니다. 아래 공고 내용에서 **지원자격 조건**을 상세하게 추출해주세요.

## 공고 제목
${announcementTitle}

## 기존 지원대상 정보
${targetCompany || '없음'}

## 공고 내용
${announcementContent}

---

# 추출 지침

1. **기업 유형**: 중소기업, 스타트업, 소상공인, 중견기업, 대기업, 예비창업자, 1인 창조기업 등
2. **직원수 조건**: "상시근로자 5인 이상", "50인 미만" 등의 표현에서 min/max 추출
3. **매출 조건**: "연매출 100억 이하", "매출액 10억 이상" 등에서 금액 추출 (원 단위로 변환)
4. **업력 조건**: "창업 7년 이내", "설립 3년 이상" 등에서 년수 추출
5. **업종 조건**: 지원 가능/불가능 업종 구분
6. **지역 조건**: 특정 지역 제한 여부 (수도권, 비수도권, 특정 시/도 등)
7. **필요 인증**: 벤처인증, 이노비즈, 메인비즈, ISO, 여성기업, 사회적기업 등
8. **기타 조건**: 고용보험 가입, 세금 체납 없음, 특정 사업 참여 이력 등
9. **지원 제외 대상**: 부도/파산, 세금 체납, 휴/폐업 등

**중요**:
- 공고에 명시되지 않은 조건은 빈 배열 [] 또는 null로 설정
- 숫자는 정확히 추출 (예: "5인 이상" → min: 5, max: null)
- 매출은 원 단위로 변환 (예: "100억" → 10000000000)
- 확실하지 않은 정보는 confidence를 낮게 설정

---

# 응답 형식 (JSON만 반환)

{
  "companyTypes": ["중소기업", "스타트업"],
  "employeeCount": {
    "min": 5,
    "max": 300,
    "description": "상시근로자 5인 이상 300인 미만"
  },
  "revenue": {
    "min": null,
    "max": 10000000000,
    "description": "연매출 100억 이하"
  },
  "businessAge": {
    "min": null,
    "max": 7,
    "description": "창업 7년 이내"
  },
  "industries": {
    "included": ["제조업", "IT서비스업"],
    "excluded": ["부동산업", "금융업"],
    "description": "제조업, IT서비스업 (부동산, 금융업 제외)"
  },
  "regions": {
    "included": ["전국"],
    "excluded": [],
    "description": "전국 (지역 제한 없음)"
  },
  "requiredCertifications": ["벤처인증"],
  "additionalRequirements": ["고용보험 가입 기업"],
  "exclusions": ["세금 체납 기업", "휴폐업 기업"],
  "summary": "창업 7년 이내 중소기업 및 스타트업 대상, 제조업/IT서비스업 분야, 상시근로자 5인 이상",
  "confidence": 0.85
}

**주의**: JSON만 응답하세요. 설명이나 마크다운 없이 순수 JSON만 출력하세요.
`

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
  businessPlan: string
): AsyncGenerator<string, void, unknown> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const sectionPrompts: Record<string, string> = {
    '사업 개요': `
사업의 필요성과 목적을 기술해주세요.
- 현재 시장/사회의 문제점
- 해당 사업이 필요한 이유
- 사업을 통해 달성하고자 하는 목표
`,
    '기술 현황': `
보유 기술에 대해 상세히 기술해주세요.
- 핵심 기술의 특징과 차별성
- 기술 개발 현황 및 수준
- 특허/지식재산권 현황
`,
    '시장 분석': `
목표 시장에 대해 분석해주세요.
- TAM/SAM/SOM 시장 규모
- 경쟁 현황 및 경쟁사 분석
- 시장 진입 전략
`,
    '사업화 전략': `
사업화 계획을 상세히 기술해주세요.
- 비즈니스 모델 및 수익 구조
- 마케팅/영업 전략
- 단계별 추진 계획
`,
    '기대 효과': `
사업 추진 시 기대되는 효과를 기술해주세요.
- 경제적 효과 (매출, 고용 등)
- 기술적 효과
- 사회적 효과
`,
  }

  const prompt = `
당신은 정부지원사업 지원서 작성 전문가입니다. 아래 정보를 바탕으로 "${section}" 섹션을 작성해주세요.

## 공고 요강
${announcementContent}

## 기업 정보
${companyProfile}

## 사업계획서
${businessPlan}

## 작성 지침
${sectionPrompts[section] || '해당 섹션의 내용을 작성해주세요.'}

## 주의사항
- 정부지원사업 평가위원의 관점에서 설득력 있게 작성
- 구체적인 수치와 데이터를 활용
- 공고 요강의 평가 기준에 맞춰 작성
- 전문적이면서도 이해하기 쉬운 문장 사용
- 한국어로 작성

내용만 작성하고, 섹션 제목은 포함하지 마세요.
`

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
