import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { EvaluationCriteria } from '@/types'
import { withRateLimit } from '@/lib/api-utils'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

interface GuideRequest {
  announcementId: string
  sectionName: string
  companyInfo?: {
    name?: string
    industry?: string
    description?: string
  }
}

interface SectionGuide {
  sectionName: string
  purpose: string
  keyPoints: string[]
  structure: {
    title: string
    description: string
  }[]
  keywords: string[]
  examplePhrases: string[]
  doList: string[]
  dontList: string[]
  relatedCriteria: {
    name: string
    maxScore: number
    tips: string
  }[]
}

// 섹션별 작성 가이드 프롬프트
function getGuidePrompt(
  sectionName: string,
  evaluationCriteria: EvaluationCriteria | null,
  announcementTitle: string,
  companyInfo?: GuideRequest['companyInfo']
): string {
  const criteriaText = evaluationCriteria
    ? evaluationCriteria.items
        .map(item => `- ${item.category}: ${item.name} (${item.maxScore}점)\n  ${item.description || ''}`)
        .join('\n')
    : '평가기준 정보 없음 (일반적인 정부지원사업 기준으로 안내)'

  const companyText = companyInfo
    ? `
회사 정보:
- 회사명: ${companyInfo.name || '미입력'}
- 업종: ${companyInfo.industry || '미입력'}
- 소개: ${companyInfo.description || '미입력'}`
    : ''

  return `당신은 정부지원사업 지원서 작성 전문 컨설턴트입니다.
아래 정보를 바탕으로 "${sectionName}" 섹션 작성 가이드를 생성해주세요.

## 공고 정보
- 공고명: ${announcementTitle}

## 평가기준
${criteriaText}
${companyText}

---

# 가이드 작성 지침

1. 해당 섹션의 목적과 중요성 설명
2. 반드시 포함해야 할 핵심 내용 5-7개
3. 권장 구조 (소제목별 설명) 3-5개
4. 평가위원이 기대하는 키워드 5-10개
5. 바로 사용할 수 있는 예시 문구 3-5개
6. 하면 좋은 것(Do) 3-5개
7. 하면 안 되는 것(Don't) 3-5개
8. 관련 평가항목과 고득점 팁

---

# 응답 형식 (JSON만 반환)

{
  "sectionName": "${sectionName}",
  "purpose": "이 섹션의 목적과 중요성 설명 (2-3문장)",
  "keyPoints": [
    "반드시 포함해야 할 핵심 내용 1",
    "반드시 포함해야 할 핵심 내용 2"
  ],
  "structure": [
    {
      "title": "1. 소제목",
      "description": "이 부분에서 다룰 내용 설명"
    }
  ],
  "keywords": ["혁신", "차별성", "시장성"],
  "examplePhrases": [
    "본 기술은 기존 대비 30% 이상의 효율 향상을 실현합니다.",
    "국내 최초로 개발된 독자 기술로서..."
  ],
  "doList": [
    "구체적인 수치와 데이터를 활용하세요",
    "객관적인 근거(특허, 논문 등)를 제시하세요"
  ],
  "dontList": [
    "추상적이고 모호한 표현을 피하세요",
    "근거 없는 과장된 주장을 피하세요"
  ],
  "relatedCriteria": [
    {
      "name": "기술성 - 기술개발 계획의 적정성",
      "maxScore": 30,
      "tips": "기술의 혁신성과 차별성을 구체적으로 설명하세요"
    }
  ]
}

**주의:** JSON만 응답하세요. 설명이나 마크다운 없이 순수 JSON만 출력`
}

// 기본 가이드 (평가기준 없을 때)
function getDefaultGuide(sectionName: string): SectionGuide {
  const sectionGuides: Record<string, Partial<SectionGuide>> = {
    '사업개요': {
      purpose: '사업의 전체적인 방향과 목표를 명확하게 제시하는 핵심 섹션이에요. 평가위원이 가장 먼저 읽는 부분이므로 첫인상이 중요해요.',
      keyPoints: [
        '사업의 핵심 목표와 비전 제시',
        '해결하고자 하는 문제/기회 명확화',
        '예상 성과와 파급효과',
        '사업 추진 일정 개요',
        '필요 자원과 예산 규모'
      ],
      structure: [
        { title: '1. 사업 배경 및 필요성', description: '왜 이 사업이 필요한지, 시장/사회적 문제점 제시' },
        { title: '2. 사업 목표', description: '달성하고자 하는 구체적인 목표 (정량적 지표 포함)' },
        { title: '3. 추진 전략', description: '목표 달성을 위한 핵심 전략과 방법론' },
        { title: '4. 기대 효과', description: '사업 완료 시 예상되는 성과와 파급효과' }
      ],
      keywords: ['혁신', '차별성', '시장성', '성장성', '파급효과', '경쟁력'],
      doList: [
        '구체적인 수치 목표를 제시하세요',
        '시장 규모와 성장 가능성을 언급하세요',
        '경쟁 우위 요소를 강조하세요'
      ],
      dontList: [
        '너무 기술적인 용어로만 설명하지 마세요',
        '실현 불가능한 목표를 제시하지 마세요',
        '경쟁사 비방은 피하세요'
      ]
    },
    '기술개발 내용': {
      purpose: '개발하고자 하는 기술의 혁신성과 실현 가능성을 입증하는 섹션이에요. 기술성 평가에서 가장 중요한 부분이에요.',
      keyPoints: [
        '핵심 기술의 혁신성과 차별점',
        '기존 기술 대비 우위성',
        '기술 개발 방법론과 절차',
        '기술적 장애요인 및 해결방안',
        '지식재산권 확보 전략'
      ],
      structure: [
        { title: '1. 핵심 기술 개요', description: '개발 기술의 정의와 작동 원리' },
        { title: '2. 기술 차별성', description: '경쟁 기술 대비 우위점과 혁신성' },
        { title: '3. 개발 방법론', description: '단계별 개발 계획과 방법' },
        { title: '4. 기술적 리스크 관리', description: '예상 장애요인과 대응 방안' }
      ],
      keywords: ['혁신', '독자기술', '특허', '성능향상', '효율화', '자동화'],
      doList: [
        '기술 수준을 객관적으로 비교하세요 (TRL 등급 등)',
        '특허, 논문 등 객관적 근거를 제시하세요',
        '개발 일정을 구체적으로 제시하세요'
      ],
      dontList: [
        '검증되지 않은 기술을 과장하지 마세요',
        '전문용어만 나열하지 마세요',
        '개발 리스크를 숨기지 마세요'
      ]
    },
    '사업화 계획': {
      purpose: '기술이 어떻게 사업적 가치를 창출할 것인지 보여주는 섹션이에요. 투자 대비 수익성을 입증해야 해요.',
      keyPoints: [
        '목표 시장 정의와 규모',
        '수익 모델과 가격 전략',
        '판매/마케팅 전략',
        '예상 매출과 수익성',
        '성장 로드맵'
      ],
      structure: [
        { title: '1. 시장 분석', description: '목표 시장 규모, 성장률, 트렌드' },
        { title: '2. 비즈니스 모델', description: '수익 창출 방식과 가격 전략' },
        { title: '3. 마케팅 전략', description: '고객 확보 및 판매 전략' },
        { title: '4. 재무 계획', description: '예상 매출, 비용, 손익분기점' }
      ],
      keywords: ['시장규모', '성장률', '수익모델', 'ROI', '고객확보', '매출'],
      doList: [
        '신뢰할 수 있는 시장 데이터를 인용하세요',
        '구체적인 매출 목표를 제시하세요',
        '고객 확보 방안을 구체화하세요'
      ],
      dontList: [
        '비현실적인 매출 목표를 제시하지 마세요',
        '시장 데이터 출처를 생략하지 마세요',
        '경쟁 분석을 소홀히 하지 마세요'
      ]
    }
  }

  const defaultGuide = sectionGuides[sectionName] || {
    purpose: `${sectionName} 섹션은 지원서의 중요한 구성요소예요. 평가기준에 맞게 구체적으로 작성해주세요.`,
    keyPoints: [
      '명확한 목표와 방향 제시',
      '구체적인 실행 계획',
      '예상 성과와 효과',
      '실현 가능성 입증',
      '차별화 요소 강조'
    ],
    structure: [
      { title: '1. 개요', description: '핵심 내용 요약' },
      { title: '2. 상세 내용', description: '구체적인 계획과 방법' },
      { title: '3. 기대 효과', description: '예상 성과와 파급효과' }
    ],
    keywords: ['혁신', '차별성', '실현가능성', '효과성', '전문성'],
    doList: [
      '구체적인 수치와 데이터를 활용하세요',
      '객관적인 근거를 제시하세요',
      '논리적인 흐름을 유지하세요'
    ],
    dontList: [
      '추상적인 표현을 피하세요',
      '근거 없는 주장을 피하세요',
      '중복된 내용을 반복하지 마세요'
    ]
  }

  return {
    sectionName,
    purpose: defaultGuide.purpose || '',
    keyPoints: defaultGuide.keyPoints || [],
    structure: defaultGuide.structure || [],
    keywords: defaultGuide.keywords || [],
    examplePhrases: [
      '본 사업을 통해 [목표]를 달성하고자 합니다.',
      '기존 대비 [수치]% 이상의 [효과]를 실현할 수 있습니다.',
      '국내/세계 최초로 [기술/서비스]를 개발하여...'
    ],
    doList: defaultGuide.doList || [],
    dontList: defaultGuide.dontList || [],
    relatedCriteria: []
  }
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

    const body: GuideRequest = await request.json()
    const { announcementId, sectionName, companyInfo } = body

    if (!announcementId || !sectionName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 공고 정보 조회
    const { data: announcementData } = await supabase
      .from('announcements')
      .select('evaluation_criteria, title')
      .eq('id', announcementId)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const announcement = announcementData as { evaluation_criteria?: any; title?: string } | null
    const evaluationCriteria = announcement?.evaluation_criteria as EvaluationCriteria | null
    const announcementTitle = announcement?.title || '정부지원사업'

    // 평가기준이 없으면 기본 가이드 반환
    if (!evaluationCriteria) {
      return NextResponse.json({
        success: true,
        data: getDefaultGuide(sectionName),
        fromDefault: true
      })
    }

    // AI로 맞춤 가이드 생성
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = getGuidePrompt(sectionName, evaluationCriteria, announcementTitle, companyInfo)

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 2000,
      },
    })

    const text = result.response.text()

    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      // 파싱 실패 시 기본 가이드 반환
      return NextResponse.json({
        success: true,
        data: getDefaultGuide(sectionName),
        fromDefault: true
      })
    }

    const parsed = JSON.parse(jsonMatch[0]) as SectionGuide

    return NextResponse.json({
      success: true,
      data: {
        sectionName: parsed.sectionName || sectionName,
        purpose: parsed.purpose || '',
        keyPoints: parsed.keyPoints || [],
        structure: parsed.structure || [],
        keywords: parsed.keywords || [],
        examplePhrases: parsed.examplePhrases || [],
        doList: parsed.doList || [],
        dontList: parsed.dontList || [],
        relatedCriteria: parsed.relatedCriteria || []
      },
      fromDefault: false
    })
  } catch (error) {
    console.error('Guide generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// AI Rate Limit 적용 (분당 10회)
export const POST = withRateLimit(handlePost, 'ai')
