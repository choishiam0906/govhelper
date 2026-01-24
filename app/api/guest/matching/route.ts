import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { resend, FROM_EMAIL } from '@/lib/email/resend'
import { renderGuestMatchingEmail } from '@/lib/email/templates'
import {
  guestMatchingRateLimiter,
  checkRateLimit,
  getClientIP,
  getRateLimitHeaders,
  isRateLimitEnabled,
} from '@/lib/rate-limit'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')

// 요청 스키마
const guestMatchingSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  businessNumber: z.string().optional(),
  companyName: z.string().min(1, '회사명을 입력해주세요'),
  industry: z.string().min(1, '업종을 입력해주세요'),
  employeeCount: z.number().min(1, '직원수를 입력해주세요'),
  foundedDate: z.string().optional(),
  location: z.string().min(1, '소재지를 입력해주세요'),
  annualRevenue: z.number().optional(),
  certifications: z.array(z.string()).optional(),
  description: z.string().optional(),
  // UTM 파라미터
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
})

// 빠른 매칭 점수 계산 (Gemini 사용)
async function quickMatchScore(
  announcement: {
    id: string
    title: string
    organization: string | null
    category: string | null
    support_type: string | null
    support_amount: string | null
    content: string | null
    parsed_content: string | null
    eligibility_criteria: any
  },
  companyInfo: {
    companyName: string
    industry: string
    employeeCount: number
    location: string
    annualRevenue?: number
    certifications?: string[]
    foundedDate?: string
  }
): Promise<{ score: number; summary: string; strengths: string[]; weaknesses: string[] }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const announcementText = `
제목: ${announcement.title}
기관: ${announcement.organization || '미상'}
분야: ${announcement.category || '미상'}
지원유형: ${announcement.support_type || '미상'}
지원금액: ${announcement.support_amount || '미상'}
내용: ${(announcement.parsed_content || announcement.content || '').slice(0, 2000)}
`

  const companyText = `
회사명: ${companyInfo.companyName}
업종: ${companyInfo.industry}
직원수: ${companyInfo.employeeCount}명
소재지: ${companyInfo.location}
연매출: ${companyInfo.annualRevenue ? `${(companyInfo.annualRevenue / 100000000).toFixed(1)}억원` : '미입력'}
보유인증: ${companyInfo.certifications?.join(', ') || '없음'}
설립일: ${companyInfo.foundedDate || '미입력'}
`

  const prompt = `
기업과 정부지원사업 공고의 적합도를 빠르게 평가해주세요.

## 공고
${announcementText}

## 기업
${companyText}

## 응답 (JSON만, 다른 텍스트 없이)
{
  "score": 0-100 점수,
  "summary": "한 줄 요약 (30자 이내)",
  "strengths": ["강점1", "강점2"],
  "weaknesses": ["약점1"]
}
`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error('Quick match error:', error)
  }

  // 기본값 반환
  return {
    score: 50,
    summary: '분석 중 오류 발생',
    strengths: [],
    weaknesses: [],
  }
}

export async function POST(request: NextRequest) {
  // Rate Limit 체크 (남용 방지)
  if (isRateLimitEnabled()) {
    const ip = getClientIP(request)
    const result = await checkRateLimit(guestMatchingRateLimiter, ip)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: getRateLimitHeaders(result),
        }
      )
    }
  }

  try {
    const body = await request.json()
    const validatedData = guestMatchingSchema.parse(body)

    const supabase = await createServiceClient()

    // 1. 리드 저장 (guest_leads 테이블은 Supabase 타입 정의에 없으므로 any 캐스팅)
    const { data: lead, error: leadError } = await (supabase as any)
      .from('guest_leads')
      .insert({
        email: validatedData.email,
        business_number: validatedData.businessNumber,
        company_name: validatedData.companyName,
        industry: validatedData.industry,
        employee_count: validatedData.employeeCount,
        founded_date: validatedData.foundedDate || null,
        location: validatedData.location,
        annual_revenue: validatedData.annualRevenue || null,
        certifications: validatedData.certifications || [],
        description: validatedData.description || null,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
        // UTM 파라미터
        utm_source: validatedData.utm_source || null,
        utm_medium: validatedData.utm_medium || null,
        utm_campaign: validatedData.utm_campaign || null,
      })
      .select()
      .single()

    if (leadError || !lead) {
      console.error('Lead save error:', leadError)
      return NextResponse.json(
        { success: false, error: '정보 저장에 실패했어요' },
        { status: 500 }
      )
    }

    // 2. 활성 공고 조회 (최근 100개)
    const { data: announcementsData, error: announcementError } = await supabase
      .from('announcements')
      .select('id, title, organization, category, support_type, support_amount, content, parsed_content, eligibility_criteria, application_end')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(100)

    if (announcementError || !announcementsData) {
      console.error('Announcements fetch error:', announcementError)
      return NextResponse.json(
        { success: false, error: '공고 조회에 실패했어요' },
        { status: 500 }
      )
    }

    // 타입 캐스팅
    const announcements = announcementsData as Array<{
      id: string
      title: string
      organization: string | null
      category: string | null
      support_type: string | null
      support_amount: string | null
      content: string | null
      parsed_content: string | null
      eligibility_criteria: any
      application_end: string | null
    }>

    // 3. 각 공고와 매칭 점수 계산 (병렬로 최대 20개)
    const companyInfo = {
      companyName: validatedData.companyName,
      industry: validatedData.industry,
      employeeCount: validatedData.employeeCount,
      location: validatedData.location,
      annualRevenue: validatedData.annualRevenue,
      certifications: validatedData.certifications,
      foundedDate: validatedData.foundedDate,
    }

    // 상위 20개만 상세 분석
    const topAnnouncements = announcements.slice(0, 20)
    const matchResults = await Promise.all(
      topAnnouncements.map(async (announcement) => {
        const analysis = await quickMatchScore(announcement, companyInfo)
        return {
          announcement_id: announcement.id,
          title: announcement.title,
          organization: announcement.organization,
          category: announcement.category,
          support_type: announcement.support_type,
          support_amount: announcement.support_amount,
          application_end: announcement.application_end,
          score: analysis.score,
          summary: analysis.summary,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
        }
      })
    )

    // 4. 점수순 정렬 후 상위 5개 선택
    const sortedResults = matchResults
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((result, index) => ({
        rank: index + 1,
        ...result,
      }))

    // 5. 매칭 결과 저장 (guest_matches 테이블은 Supabase 타입 정의에 없으므로 any 캐스팅)
    const { data: matchData, error: matchError } = await (supabase as any)
      .from('guest_matches')
      .insert({
        lead_id: lead.id,
        matches: sortedResults,
      })
      .select()
      .single()

    if (matchError || !matchData) {
      console.error('Match save error:', matchError)
      return NextResponse.json(
        { success: false, error: '매칭 결과 저장에 실패했어요' },
        { status: 500 }
      )
    }

    // 6. 이메일 발송 (비동기로 처리, 실패해도 결과 반환)
    const resultUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://govhelpers.com'}/try/result/${matchData.id}`

    if (resend) {
      try {
        const emailMatches = sortedResults.map((m, index) => ({
          rank: m.rank,
          title: index < 2 ? '****** 지원사업' : m.title,
          organization: index < 2 ? '******' : (m.organization || ''),
          score: m.score,
          summary: index < 2 ? '회원가입 후 확인 가능' : m.summary,
          blurred: index < 2,
        }))

        const emailHtml = renderGuestMatchingEmail({
          companyName: validatedData.companyName,
          email: validatedData.email,
          resultUrl,
          matches: emailMatches,
        })

        await resend.emails.send({
          from: FROM_EMAIL,
          to: validatedData.email,
          subject: `[GovHelper] ${validatedData.companyName}님의 AI 매칭 분석 결과`,
          html: emailHtml,
        })

        // 이메일 발송 상태 업데이트
        await (supabase as any)
          .from('guest_matches')
          .update({
            email_sent: true,
            email_sent_at: new Date().toISOString(),
          })
          .eq('id', matchData.id)
      } catch (emailError) {
        console.error('Email send error:', emailError)
        // 이메일 실패해도 결과는 반환
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        resultId: matchData.id,
        leadId: lead.id,
        matchCount: sortedResults.length,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Guest matching error:', error)
    return NextResponse.json(
      { success: false, error: '매칭 분석 중 오류가 발생했어요' },
      { status: 500 }
    )
  }
}
