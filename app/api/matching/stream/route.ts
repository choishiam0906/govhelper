import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { streamWithAI } from '@/lib/ai'
import { Tables } from '@/types/database'
import { MatchAnalysis } from '@/types'
import {
  aiRateLimiter,
  checkRateLimit,
  getClientIP,
  isRateLimitEnabled,
} from '@/lib/rate-limit'
import { z } from 'zod'

// 요청 스키마
const matchingSchema = z.object({
  announcementId: z.string().uuid(),
  companyId: z.string().uuid(),
  businessPlanId: z.string().uuid().optional(),
})

// POST: AI 매칭 분석 (스트리밍)
export async function POST(request: NextRequest) {
  try {
    // Rate Limit 체크
    if (isRateLimitEnabled()) {
      const ip = getClientIP(request)
      const result = await checkRateLimit(aiRateLimiter, ip)

      if (!result.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.',
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: '인증이 필요합니다' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await request.json()
    const validatedData = matchingSchema.parse(body)
    const { announcementId, companyId, businessPlanId } = validatedData

    // 공고 조회
    const { data: announcementData, error: announcementError } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', announcementId)
      .single()

    if (announcementError || !announcementData) {
      return new Response(
        JSON.stringify({ success: false, error: '공고를 찾을 수 없습니다' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }
    const announcement = announcementData as Tables<'announcements'>

    // 기업 프로필 조회
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (companyError || !companyData) {
      return new Response(
        JSON.stringify({ success: false, error: '기업 정보를 찾을 수 없습니다' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }
    const company = companyData as Tables<'companies'>

    // 사업계획서 조회 (선택사항)
    let businessPlan: Tables<'business_plans'> | null = null
    if (businessPlanId) {
      const { data, error } = await supabase
        .from('business_plans')
        .select('*')
        .eq('id', businessPlanId)
        .single()

      if (!error && data) {
        businessPlan = data as Tables<'business_plans'>
      }
    }

    // AI 분석용 콘텐츠 준비
    // support_amount 안전하게 형식화 (숫자 또는 문자열 처리)
    const formatSupportAmount = (amount: string | null | undefined): string => {
      if (!amount) return '미정'
      // 이미 형식화된 경우 그대로 반환
      if (amount.includes('원') || amount.includes('억')) return amount
      // 숫자만 있는 경우 형식화
      const numericValue = Number(amount.replace(/[^0-9]/g, ''))
      if (!isNaN(numericValue) && numericValue > 0) {
        return `${numericValue.toLocaleString()}원`
      }
      return amount || '미정'
    }

    const announcementContent = `
제목: ${announcement.title}
기관: ${announcement.organization}
분야: ${announcement.category}
지원유형: ${announcement.support_type}
지원금액: ${formatSupportAmount(announcement.support_amount)}
내용: ${announcement.content || announcement.parsed_content || ''}
    `.trim()

    const companyProfile = `
회사명: ${company.name}
업종: ${company.industry}
설립일: ${company.founded_date}
직원수: ${company.employee_count}명
소재지: ${company.location}
연매출: ${company.annual_revenue}
인증현황: ${(company.certifications as string[])?.join(', ') || '없음'}
회사 소개: ${company.description || ''}
    `.trim()

    const businessPlanContent = businessPlan
      ? `
제목: ${businessPlan.title}
내용: ${businessPlan.content || businessPlan.parsed_content || ''}
      `.trim()
      : '사업계획서 없음'

    // AI 분석 프롬프트
    const prompt = `
당신은 정부지원사업 매칭 전문가입니다. 아래 정보를 바탕으로 **2단계 평가**를 수행해주세요.

## 공고 내용
${announcementContent}

## 기업 프로필
${companyProfile}

## 사업계획서 요약
${businessPlanContent}

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

    // 스트리밍 응답 생성
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = ''
          let chunkCount = 0

          // 분석 시작 알림
          const startData = JSON.stringify({
            type: 'start',
            message: 'AI 분석을 시작합니다...',
          })
          controller.enqueue(encoder.encode(`data: ${startData}\n\n`))

          for await (const chunk of streamWithAI(prompt)) {
            fullContent += chunk
            chunkCount++

            // 청크 전송 (진행 상황 표시용)
            const chunkData = JSON.stringify({
              type: 'chunk',
              chunk,
              progress: Math.min(chunkCount * 2, 90), // 최대 90%까지만
            })
            controller.enqueue(encoder.encode(`data: ${chunkData}\n\n`))
          }

          // JSON 파싱
          const jsonMatch = fullContent.match(/\{[\s\S]*\}/)
          if (!jsonMatch) {
            throw new Error('AI 응답에서 JSON을 추출할 수 없습니다')
          }

          const analysis: MatchAnalysis = JSON.parse(jsonMatch[0])

          // overallScore 유효성 검사 및 정규화
          let validScore = 0
          if (typeof analysis.overallScore === 'number' && !isNaN(analysis.overallScore)) {
            validScore = Math.max(0, Math.min(100, Math.round(analysis.overallScore)))
          } else if (typeof analysis.overallScore === 'string') {
            // 문자열에서 숫자 추출 시도
            const numMatch = String(analysis.overallScore).match(/\d+/)
            if (numMatch) {
              validScore = Math.max(0, Math.min(100, parseInt(numMatch[0], 10)))
            }
          }
          analysis.overallScore = validScore

          // DB에 매칭 결과 저장 (Service Client로 RLS 우회)
          const serviceClient = await createServiceClient()
          const matchInsert = {
            company_id: companyId,
            announcement_id: announcementId,
            business_plan_id: businessPlanId || null,
            match_score: analysis.overallScore,
            analysis: analysis,
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: matchResult, error: matchError } = await (serviceClient as any)
            .from('matches')
            .insert(matchInsert)
            .select()
            .single()

          if (matchError) {
            console.error('Match save error:', matchError)
            throw new Error(`분석 결과 저장에 실패했습니다: ${matchError.message || matchError.code || JSON.stringify(matchError)}`)
          }

          // 완료 신호 전송
          const doneData = JSON.stringify({
            type: 'complete',
            done: true,
            matchId: matchResult.id,
            analysis,
            progress: 100,
          })
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`))

          controller.close()
        } catch (error) {
          console.error('Matching streaming error:', error)
          const errorData = JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'AI 분석 중 오류가 발생했어요',
            done: true,
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

    console.error('Matching stream error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'AI 분석 처리 중 오류가 발생했어요' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
