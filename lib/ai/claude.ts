import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

interface ApplicationSection {
  section: string
  content: string
}

export async function generateApplicationDraft(
  announcementContent: string,
  companyProfile: string,
  businessPlan: string,
  sections: string[]
): Promise<ApplicationSection[]> {
  const results: ApplicationSection[] = []

  for (const section of sections) {
    const content = await generateSection(
      section,
      announcementContent,
      companyProfile,
      businessPlan
    )
    results.push({ section, content })
  }

  return results
}

async function generateSection(
  section: string,
  announcementContent: string,
  companyProfile: string,
  businessPlan: string
): Promise<string> {
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
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const content = message.content[0]
    if (content.type === 'text') {
      return content.text
    }
    return ''
  } catch (error) {
    console.error('Claude generation error:', error)
    throw error
  }
}

export async function improveApplicationSection(
  currentContent: string,
  feedback: string
): Promise<string> {
  const prompt = `
현재 지원서 내용:
${currentContent}

수정 요청:
${feedback}

위 피드백을 반영하여 내용을 개선해주세요. 개선된 내용만 출력하세요.
`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const content = message.content[0]
    if (content.type === 'text') {
      return content.text
    }
    return currentContent
  } catch (error) {
    console.error('Claude improvement error:', error)
    throw error
  }
}
