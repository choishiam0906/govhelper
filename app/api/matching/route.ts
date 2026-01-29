import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { analyzeMatch } from '@/lib/ai'
import { Tables, InsertTables, Json } from '@/types/database'
import { withRateLimit } from '@/lib/api-utils'
import { getMatchingCache, setMatchingCache } from '@/lib/cache'
import { getCompanyContextForMatching, hasCompanyDocuments } from '@/lib/company-documents/rag'
import { createRequestLogger } from '@/lib/logger'
import { apiSuccess, apiError, unauthorized, notFound, badRequest } from '@/lib/api/error-handler'
import { withMetrics } from '@/lib/metrics/with-metrics'

async function handlePost(request: NextRequest) {
  const log = createRequestLogger(request, 'matching')

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      log.warn('인증되지 않은 요청')
      return unauthorized('로그인이 필요해요')
    }

    const body = await request.json()
    const { announcementId, companyId, businessPlanId } = body

    log.info('매칭 요청 시작', { userId: user.id, announcementId, companyId, businessPlanId })

    if (!announcementId || !companyId) {
      log.warn('필수 필드 누락', { announcementId, companyId })
      return badRequest('공고 ID와 기업 ID는 필수예요')
    }


    // 1. 캐시 확인
    try {
      const cachedResult = await getMatchingCache(companyId, announcementId)
      if (cachedResult) {
        log.info('캐시 히트', { companyId, announcementId })
        const response = apiSuccess({ ...cachedResult, fromCache: true })
        response.headers.set('X-Matching-Cache', 'HIT')
        return response
      }
      log.debug('캐시 미스', { companyId, announcementId })
    } catch (cacheError) {
      log.warn('캐시 조회 실패 (계속 진행)', {
        error: cacheError instanceof Error ? cacheError.message : 'Unknown error'
      })
      // 캐시 실패 시 기존 로직으로 fallback
    }

    // 2. Fetch announcement
    const { data: announcementData, error: announcementError } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', announcementId)
      .single()

    if (announcementError || !announcementData) {
      log.warn('공고 조회 실패', { announcementId, error: announcementError?.message })
      return notFound('공고를 찾을 수 없어요')
    }
    const announcement = announcementData as Tables<'announcements'>
    log.debug('공고 조회 완료', { announcementId, title: announcement.title })

    // 3. Fetch company profile
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (companyError || !companyData) {
      log.warn('기업 조회 실패', { companyId, error: companyError?.message })
      return notFound('기업 정보를 찾을 수 없어요')
    }
    const company = companyData as Tables<'companies'>
    log.debug('기업 조회 완료', { companyId, name: company.name })

    // 4. Fetch business plan if provided
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

    // 5. Prepare content for AI analysis
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

    // 평가기준 정보 포맷팅
    const formatEvaluationCriteria = (): string => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const evalCriteria = (announcement as any).evaluation_criteria
      if (!evalCriteria) return ''

      let result = '\n\n## 평가기준\n'
      result += `총점: ${evalCriteria.totalScore || 100}점\n`
      if (evalCriteria.passingScore) {
        result += `합격기준: ${evalCriteria.passingScore}점 이상\n`
      }

      if (evalCriteria.items && evalCriteria.items.length > 0) {
        result += '\n평가항목:\n'
        for (const item of evalCriteria.items) {
          result += `- ${item.category || '기타'}: ${item.name} (${item.maxScore}점)\n`
          if (item.description) {
            result += `  설명: ${item.description}\n`
          }
        }
      }

      if (evalCriteria.bonusItems && evalCriteria.bonusItems.length > 0) {
        result += '\n가점항목:\n'
        for (const bonus of evalCriteria.bonusItems) {
          const sign = bonus.type === 'bonus' ? '+' : '-'
          result += `- ${bonus.name}: ${sign}${Math.abs(bonus.score)}점 (${bonus.condition})\n`
        }
      }

      return result
    }

    const announcementContent = `
제목: ${announcement.title}
기관: ${announcement.organization}
분야: ${announcement.category}
지원유형: ${announcement.support_type}
지원금액: ${formatSupportAmount(announcement.support_amount)}
내용: ${announcement.content || announcement.parsed_content || ''}${formatEvaluationCriteria()}
    `.trim()

    // 사업계획서 RAG 컨텍스트 조회
    let companyDocumentContext = ''
    try {
      const hasDocuments = await hasCompanyDocuments(supabase, companyId)
      if (hasDocuments) {
        log.debug('RAG 컨텍스트 조회 시작', { companyId })
        companyDocumentContext = await getCompanyContextForMatching(
          supabase,
          companyId,
          announcement.title,
          announcement.content || announcement.parsed_content || ''
        )
        log.info('RAG 컨텍스트 조회 완료', {
          companyId,
          contextLength: companyDocumentContext.length
        })
      }
    } catch (ragError) {
      log.warn('RAG 컨텍스트 조회 실패 (계속 진행)', {
        error: ragError instanceof Error ? ragError.message : 'Unknown error'
      })
    }

    const companyProfile = `
회사명: ${company.name}
업종: ${company.industry}
설립일: ${company.founded_date}
직원수: ${company.employee_count}명
소재지: ${company.location}
연매출: ${company.annual_revenue}
인증현황: ${company.certifications?.join(', ') || '없음'}
회사 소개: ${company.description || ''}
${companyDocumentContext ? `\n${companyDocumentContext}` : ''}
    `.trim()

    const businessPlanContent = businessPlan
      ? `
제목: ${businessPlan.title}
내용: ${businessPlan.content || businessPlan.parsed_content || ''}
      `.trim()
      : '사업계획서 없음'

    // 6. Perform AI analysis
    log.info('AI 매칭 분석 시작', {
      announcementId,
      companyId,
      hasBusinessPlan: !!businessPlan,
      hasRAGContext: !!companyDocumentContext
    })
    const analysis = await analyzeMatch(
      announcementContent,
      companyProfile,
      businessPlanContent
    )
    log.info('AI 매칭 분석 완료', { score: analysis.overallScore })

    // overallScore 유효성 검사 및 정규화
    let validScore = 0
    if (typeof analysis.overallScore === 'number' && !isNaN(analysis.overallScore)) {
      validScore = Math.max(0, Math.min(100, Math.round(analysis.overallScore)))
    } else if (typeof analysis.overallScore === 'string') {
      const numMatch = String(analysis.overallScore).match(/\d+/)
      if (numMatch) {
        validScore = Math.max(0, Math.min(100, parseInt(numMatch[0], 10)))
      }
    }
    analysis.overallScore = validScore

    // 7. Save match result (Service Client로 RLS 우회)
    const serviceClient = await createServiceClient()
    const matchInsert = {
      company_id: companyId,
      announcement_id: announcementId,
      business_plan_id: businessPlanId || null,
      match_score: validScore,
      analysis: analysis,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: matchResult, error: matchError } = await (serviceClient as any)
      .from('matches')
      .insert(matchInsert)
      .select()
      .single()

    if (matchError) {
      log.error('매칭 결과 저장 실패', {
        error: matchError.message,
        companyId,
        announcementId
      })
      return apiError('매칭 결과 저장에 실패했어요', 'DATABASE_ERROR', 500)
    }

    log.debug('매칭 결과 저장 완료', { matchId: matchResult.id })


    // 8. 결과 데이터 준비
    const resultData = {
      match: matchResult,
      analysis,
    }

    // 9. 캐시에 저장 (7일 TTL)
    try {
      await setMatchingCache(companyId, announcementId, resultData)
      log.debug('캐시 저장 완료', { companyId, announcementId })
    } catch (cacheError) {
      log.warn('캐시 저장 실패 (결과는 정상 반환)', {
        error: cacheError instanceof Error ? cacheError.message : 'Unknown error'
      })
      // 캐시 저장 실패는 무시 (결과는 정상 반환)
    }

    log.info('매칭 요청 완료', {
      companyId,
      announcementId,
      score: validScore
    })

    const response = apiSuccess({ ...resultData, fromCache: false })
    response.headers.set('X-Matching-Cache', 'MISS')
    return response
  } catch (error) {
    log.error('매칭 요청 실패', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return apiError('매칭 분석 중 오류가 발생했어요', 'INTERNAL_SERVER_ERROR', 500)
  }
}

// AI Rate Limit 적용 (분당 10회) + 메트릭 수집
export const POST = withMetrics(withRateLimit(handlePost, 'ai'))
