import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  syncRateLimiter,
  checkRateLimit,
  getClientIP,
  getRateLimitHeaders,
  isRateLimitEnabled,
} from '@/lib/rate-limit'
import { parseEligibilityCriteria } from '@/lib/ai/gemini'

// 기업마당 API 설정
const BIZINFO_API_URL = 'https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do'
const BIZINFO_API_KEY = process.env.BIZINFO_API_KEY || ''

// Supabase Admin Client 생성 (런타임에 호출)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// 실제 기업마당 API 응답 형식
interface BizinfoAnnouncement {
  pblancId: string           // 공고 ID
  pblancNm: string           // 공고명
  bsnsSumryCn: string        // 사업개요 (HTML)
  reqstBeginEndDe: string    // 신청기간 (예: "20260105 ~ 20260123")
  jrsdInsttNm: string        // 소관기관
  excInsttNm: string         // 수행기관
  pldirSportRealmLclasCodeNm: string  // 분야 대분류
  pldirSportRealmMlsfcCodeNm: string  // 분야 중분류
  trgetNm: string            // 지원대상
  pblancUrl: string          // 상세페이지 URL
  refrncNm: string           // 문의처
  creatPnttm: string         // 등록일시
  hashtags: string           // 해시태그
  totCnt: number             // 전체 건수
}

interface BizinfoResponse {
  jsonArray: BizinfoAnnouncement[]
}

// 신청기간 파싱 (예: "20260105 ~ 20260123" -> { startDate, endDate })
function parseRequestDate(reqstDt: string): { startDate: string | null; endDate: string | null } {
  const defaultDate = { startDate: null, endDate: null }

  if (!reqstDt) return defaultDate

  // "예산 소진시까지" 같은 경우
  if (!reqstDt.includes('~')) return defaultDate

  const parts = reqstDt.split('~').map(s => s.trim())

  if (parts.length >= 2) {
    // YYYYMMDD -> YYYY-MM-DD 변환
    const formatDate = (d: string): string | null => {
      const clean = d.replace(/[.\-\/]/g, '')
      if (clean.length >= 8) {
        return `${clean.substring(0, 4)}-${clean.substring(4, 6)}-${clean.substring(6, 8)}`
      }
      return null
    }

    return {
      startDate: formatDate(parts[0]),
      endDate: formatDate(parts[1]),
    }
  }

  return defaultDate
}

// 오늘 날짜 (YYYY-MM-DD)
function getTodayStr(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// HTML 태그 제거
function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() || ''
}

export async function POST(request: NextRequest) {
  // Vercel Cron 요청은 Rate Limiting 제외
  const isCronRequest = request.headers.get('x-vercel-cron') === '1'

  if (!isCronRequest && isRateLimitEnabled()) {
    const ip = getClientIP(request)
    const result = await checkRateLimit(syncRateLimiter, ip)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: '동기화 요청이 너무 많아요. 잠시 후 다시 시도해주세요.',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: getRateLimitHeaders(result),
        }
      )
    }
  }

  const startTime = Date.now()

  try {
    // API 키 확인
    if (!BIZINFO_API_KEY) {
      return NextResponse.json(
        { success: false, error: '기업마당 API 키가 설정되지 않았어요.' },
        { status: 500 }
      )
    }

    const supabase = getSupabaseAdmin()
    const todayStr = getTodayStr()

    // 전체 분야 조회 (최대 500건)
    const params = new URLSearchParams({
      crtfcKey: BIZINFO_API_KEY,
      dataType: 'json',
      searchCnt: '500',
    })

    const apiUrl = `${BIZINFO_API_URL}?${params.toString()}`

    console.log('📡 기업마당 API 동기화 시작')

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`Bizinfo API error: ${response.status}`)
    }

    const result: BizinfoResponse = await response.json()

    // jsonArray에서 데이터 추출
    const allAnnouncements = result.jsonArray || []

    // 진행 중인 공고만 필터링
    const activeAnnouncements = allAnnouncements.filter(item => {
      const { endDate } = parseRequestDate(item.reqstBeginEndDe)
      if (!endDate) return true // 마감일 없으면 포함 (예산 소진시까지 등)
      return endDate >= todayStr
    })

    // 중복 제거 (pblancId 기준)
    const seen = new Set<string>()
    const uniqueAnnouncements = activeAnnouncements.filter(item => {
      if (seen.has(item.pblancId)) return false
      seen.add(item.pblancId)
      return true
    })

    // 데이터 변환 (배치용)
    const announcementsToUpsert = uniqueAnnouncements.map(item => {
      const { startDate, endDate } = parseRequestDate(item.reqstBeginEndDe)
      const cleanContent = stripHtml(item.bsnsSumryCn)

      return {
        source: 'bizinfo',
        source_id: item.pblancId,
        title: item.pblancNm,
        organization: item.jrsdInsttNm || '',
        category: item.pldirSportRealmLclasCodeNm || '',
        support_type: item.pldirSportRealmMlsfcCodeNm || '',
        target_company: item.trgetNm || '',
        support_amount: '',
        application_start: startDate,
        application_end: endDate,
        content: [
          cleanContent,
          item.refrncNm ? `문의: ${item.refrncNm}` : '',
          item.hashtags ? `#${item.hashtags.split(',').join(' #')}` : '',
          `상세보기: https://www.bizinfo.go.kr${item.pblancUrl}`
        ].filter(Boolean).join('\n\n'),
        status: 'active',
        updated_at: new Date().toISOString()
      }
    })

    // 배치 upsert (한 번에 처리)
    const { error: upsertError, count } = await supabase
      .from('announcements')
      .upsert(announcementsToUpsert, {
        onConflict: 'source,source_id',
        count: 'exact'
      })

    if (upsertError) {
      console.error('Batch upsert error:', upsertError.message)
      return NextResponse.json(
        { success: false, error: upsertError.message },
        { status: 500 }
      )
    }

    // 마감된 기업마당 공고 비활성화
    await supabase
      .from('announcements')
      .update({ status: 'expired' })
      .eq('source', 'bizinfo')
      .lt('application_end', todayStr)

    // AI 자동 분류: eligibility_criteria가 null인 새 공고들 파싱
    let aiParsed = 0
    try {
      // 파싱되지 않은 최근 공고 조회 (최대 10개, API 비용 및 시간 제한)
      const { data: unparsedAnnouncements } = await supabase
        .from('announcements')
        .select('id, title, content, target_company')
        .eq('source', 'bizinfo')
        .eq('status', 'active')
        .is('eligibility_criteria', null)
        .order('created_at', { ascending: false })
        .limit(10)

      if (unparsedAnnouncements && unparsedAnnouncements.length > 0) {
        console.log(`🤖 AI 자동 분류 시작: ${unparsedAnnouncements.length}건`)

        for (const ann of unparsedAnnouncements) {
          try {
            const criteria = await parseEligibilityCriteria(
              ann.title,
              ann.content || '',
              ann.target_company
            )

            await supabase
              .from('announcements')
              .update({ eligibility_criteria: criteria })
              .eq('id', ann.id)

            aiParsed++
            console.log(`✅ AI 분류 완료: ${ann.id} (신뢰도: ${criteria.confidence})`)

            // Rate limiting: Gemini API 요청 간 딜레이
            await new Promise(resolve => setTimeout(resolve, 1000))
          } catch (parseError) {
            console.error(`AI 분류 실패 (${ann.id}):`, parseError)
          }
        }
      }
    } catch (aiError) {
      console.error('AI 자동 분류 중 오류:', aiError)
    }

    const duration = Date.now() - startTime

    console.log(`✅ 기업마당 동기화 완료: ${uniqueAnnouncements.length}건, AI 분류: ${aiParsed}건, ${duration}ms`)

    return NextResponse.json({
      success: true,
      message: '기업마당 동기화 완료',
      stats: {
        fetched: allAnnouncements.length,
        active: activeAnnouncements.length,
        unique: uniqueAnnouncements.length,
        upserted: count,
        aiParsed,
        duration: `${duration}ms`,
        syncedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('기업마당 동기화 오류:', error)
    return NextResponse.json(
      { success: false, error: '동기화 중 오류가 발생했어요.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
