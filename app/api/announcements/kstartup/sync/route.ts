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

// K-Startup API 설정 (공공데이터포털)
const KSTARTUP_API_URL = 'https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01'
const KSTARTUP_API_KEY = process.env.KSTARTUP_API_KEY || ''

// Supabase Admin Client 생성
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// K-Startup API 응답 형식 (실제 API 응답 기준)
interface KStartupAnnouncement {
  biz_pbanc_nm: string        // 공고명
  supt_biz_clsfc: string      // 지원사업 분류
  pbanc_sn: number            // 공고 번호
  pbanc_ntrp_nm: string       // 소관기관명
  sprv_inst: string           // 수행기관명
  pbanc_rcpt_bgng_dt: string  // 접수 시작일
  pbanc_rcpt_end_dt: string   // 접수 종료일
  detl_pg_url: string         // 상세 URL
  pbanc_ctnt: string          // 공고 내용
  intg_pbanc_yn: string       // 통합공고 여부 (Y/N)
  aply_trgt: string           // 지원대상
  supt_regin: string          // 지원지역
}

interface KStartupResponse {
  currentCount: number
  data: KStartupAnnouncement[]
  matchCount: number
  page: number
  perPage: number
  totalCount: number
}

// 날짜 포맷 변환 (YYYYMMDD -> YYYY-MM-DD)
function formatDate(dateStr: string): string | null {
  if (!dateStr) return null
  const clean = dateStr.replace(/[.\-\/]/g, '')
  if (clean.length >= 8) {
    return `${clean.substring(0, 4)}-${clean.substring(4, 6)}-${clean.substring(6, 8)}`
  }
  return null
}

// 오늘 날짜 (YYYY-MM-DD)
function getTodayStr(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
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
    if (!KSTARTUP_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'K-Startup API 키가 설정되지 않았어요.' },
        { status: 500 }
      )
    }

    const supabase = getSupabaseAdmin()
    const todayStr = getTodayStr()

    // 여러 페이지 조회 (최대 500건)
    const allAnnouncements: KStartupAnnouncement[] = []
    let page = 1
    const perPage = 100
    let hasMore = true

    console.log('📡 K-Startup API 동기화 시작')

    while (hasMore && page <= 5) { // 최대 5페이지 (500건)
      const params = new URLSearchParams({
        serviceKey: KSTARTUP_API_KEY,
        page: String(page),
        perPage: String(perPage),
        returnType: 'json',
      })

      const apiUrl = `${KSTARTUP_API_URL}?${params.toString()}`

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`K-Startup API error: ${response.status}`)
      }

      const result: KStartupResponse = await response.json()
      const data = result.data || []

      allAnnouncements.push(...data)

      // 다음 페이지 확인
      if (data.length < perPage || allAnnouncements.length >= result.totalCount) {
        hasMore = false
      } else {
        page++
      }
    }

    // 진행 중인 공고만 필터링
    const activeAnnouncements = allAnnouncements.filter(item => {
      const endDate = formatDate(item.pbanc_rcpt_end_dt)
      if (!endDate) return true // 마감일 없으면 포함
      return endDate >= todayStr
    })

    // 중복 제거 (pbanc_sn 기준)
    const seen = new Set<string>()
    const uniqueAnnouncements = activeAnnouncements.filter(item => {
      if (!item.pbanc_sn) return false
      const id = String(item.pbanc_sn)
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })

    // 데이터 변환 (배치용)
    const announcementsToUpsert = uniqueAnnouncements.map(item => ({
      source: 'kstartup',
      source_id: String(item.pbanc_sn),
      title: item.biz_pbanc_nm,
      organization: item.pbanc_ntrp_nm || '',
      category: item.supt_biz_clsfc || '창업',
      support_type: item.intg_pbanc_yn === 'Y' ? '통합공고' : '',
      target_company: item.aply_trgt || '창업기업',
      support_amount: '',
      application_start: formatDate(item.pbanc_rcpt_bgng_dt),
      application_end: formatDate(item.pbanc_rcpt_end_dt),
      content: [
        item.pbanc_ctnt || '',
        item.sprv_inst ? `수행기관: ${item.sprv_inst}` : '',
        item.supt_regin ? `지원지역: ${item.supt_regin}` : '',
        item.detl_pg_url || `상세보기: https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${item.pbanc_sn}`
      ].filter(Boolean).join('\n\n'),
      status: 'active',
      updated_at: new Date().toISOString()
    }))

    // 배치 upsert
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

    // 마감된 K-Startup 공고 비활성화
    await supabase
      .from('announcements')
      .update({ status: 'expired' })
      .eq('source', 'kstartup')
      .lt('application_end', todayStr)

    // AI 자동 분류: eligibility_criteria가 null인 새 공고들 파싱
    let aiParsed = 0
    try {
      // 파싱되지 않은 최근 공고 조회 (최대 10개, API 비용 및 시간 제한)
      const { data: unparsedAnnouncements } = await supabase
        .from('announcements')
        .select('id, title, content, target_company')
        .eq('source', 'kstartup')
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

    console.log(`✅ K-Startup 동기화 완료: ${uniqueAnnouncements.length}건, AI 분류: ${aiParsed}건, ${duration}ms`)

    return NextResponse.json({
      success: true,
      message: 'K-Startup 동기화 완료',
      stats: {
        fetched: allAnnouncements.length,
        active: activeAnnouncements.length,
        unique: uniqueAnnouncements.length,
        upserted: count,
        aiParsed,
        pages: page,
        duration: `${duration}ms`,
        syncedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('K-Startup 동기화 오류:', error)
    return NextResponse.json(
      { success: false, error: '동기화 중 오류가 발생했어요.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
