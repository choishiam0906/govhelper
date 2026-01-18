import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  syncRateLimiter,
  checkRateLimit,
  getClientIP,
  getRateLimitHeaders,
  isRateLimitEnabled,
} from '@/lib/rate-limit'

// HRD Korea API 설정 (work24.go.kr - 국민내일배움카드 훈련과정)
const HRD_API_URL = 'https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo310L01.do'
const HRD_AUTH_KEY = process.env.HRD_AUTH_KEY || ''

// Supabase Admin Client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// work24.go.kr API 응답 타입
interface HRDTraining {
  trprId: string           // 훈련과정 ID
  trprNm: string           // 훈련과정명
  trainstCstId: string     // 훈련기관 ID
  inoNm: string            // 훈련기관명
  trprDegr: string         // 훈련차수
  traStartDate: string     // 훈련시작일
  traEndDate: string       // 훈련종료일
  trainTime: string        // 총훈련시간
  trainTimeDaylot: string  // 1일 훈련시간
  ncsCd: string            // NCS 코드
  ncsNm: string            // NCS명
  realExpAmt: string       // 실제 훈련비
  perTrco: string          // 정부지원금
  selfBurden: string       // 자부담금
  regCourseMan: string     // 수강신청인원
  yardMan: string          // 정원
  eiEmplRate3: string      // 취업률
  address: string          // 훈련기관 주소
  titleLink: string        // 상세 링크
  contents: string         // 훈련내용
  subTitle: string         // 부제목
  grade: string            // 등급
  trainTargetCd: string    // 훈련대상코드
  trainTarget: string      // 훈련대상명
  instIno: string          // 기관코드
  addr1: string            // 주소
  subTitleLink: string     // 상세링크
  title: string            // 제목
}

interface HRDResponse {
  returnCode: string
  returnMsg: string
  scn_cnt: number          // 검색된 총 건수
  pageNum: number          // 현재페이지
  pageSize: number         // 페이지당 출력개수
  srchList: HRDTraining[]  // 훈련과정 목록
}

// 날짜 포맷 (YYYYMMDD -> YYYY-MM-DD)
function formatDate(dateStr: string): string | null {
  if (!dateStr) return null
  const clean = dateStr.replace(/[.\-\/\s]/g, '')
  if (clean.length >= 8) {
    return `${clean.substring(0, 4)}-${clean.substring(4, 6)}-${clean.substring(6, 8)}`
  }
  return null
}

// 오늘 날짜 (YYYYMMDD)
function getTodayStr(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

// 3개월 후 날짜 (YYYYMMDD)
function get3MonthsLaterStr(): string {
  const date = new Date()
  date.setMonth(date.getMonth() + 3)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

// 금액 포맷
function formatAmount(amount: string | number): string {
  if (!amount) return ''
  const num = typeof amount === 'string' ? parseInt(amount.replace(/,/g, '')) : amount
  if (isNaN(num)) return ''
  return num.toLocaleString() + '원'
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
    if (!HRD_AUTH_KEY) {
      return NextResponse.json(
        { success: false, error: 'HRD Korea 인증키(authKey)가 설정되지 않았어요.' },
        { status: 500 }
      )
    }

    const supabase = getSupabaseAdmin()
    const todayStr = getTodayStr()
    const todayFormatted = formatDate(todayStr)!

    console.log('📡 HRD Korea 동기화 시작')

    const allTrainings: HRDTraining[] = []
    let page = 1
    const pageSize = 100
    let hasMore = true

    // 여러 페이지 조회 (최대 5페이지)
    while (hasMore && page <= 5) {
      const params = new URLSearchParams({
        authKey: HRD_AUTH_KEY,
        returnType: 'JSON',
        outType: '1',           // 1: 리스트
        pageNum: String(page),
        pageSize: String(pageSize),
        srchTraStDt: todayStr,           // 훈련시작일 From (오늘부터)
        srchTraEndDt: get3MonthsLaterStr(), // 훈련시작일 To (3개월 후까지)
        sort: 'ASC',
        sortCol: 'TRNG_BGDE',   // 훈련시작일 기준 정렬
      })

      const apiUrl = `${HRD_API_URL}?${params.toString()}`

      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        })

        if (!response.ok) {
          console.error('HRD API error:', response.status)
          break
        }

        const result: HRDResponse = await response.json()

        if (result.srchList && result.srchList.length > 0) {
          allTrainings.push(...result.srchList)

          if (result.srchList.length < pageSize || allTrainings.length >= result.scn_cnt) {
            hasMore = false
          } else {
            page++
          }
        } else {
          hasMore = false
        }
      } catch (fetchError) {
        console.error('HRD fetch error:', fetchError)
        break
      }
    }

    // 진행 중인 훈련과정만 필터링
    const activeTrainings = allTrainings.filter(item => {
      const endDate = formatDate(item.traEndDate)
      if (!endDate) return true
      return endDate >= todayFormatted
    })

    // 중복 제거 (trprId + trainstCstId + trprDegr 기준)
    const seen = new Set<string>()
    const uniqueTrainings = activeTrainings.filter(item => {
      if (!item.trprId) return false
      const id = `${item.trprId}-${item.trainstCstId || item.instIno}-${item.trprDegr}`
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })

    // DB 저장 형식으로 변환
    const trainingsToUpsert = uniqueTrainings.map(item => ({
      source: 'hrd',
      source_id: `${item.trprId}-${item.trainstCstId || item.instIno}-${item.trprDegr}`,
      title: item.title || item.trprNm || '',
      organization: item.inoNm || '',
      category: item.ncsNm || '직업훈련',
      support_type: item.trainTarget || '국민내일배움카드',
      target_company: item.trainTarget || '구직자/재직자',
      support_amount: item.perTrco ? `정부지원 ${formatAmount(item.perTrco)}` : '',
      application_start: formatDate(item.traStartDate),
      application_end: formatDate(item.traEndDate),
      content: [
        item.contents || item.subTitle || '',
        `훈련기간: ${formatDate(item.traStartDate) || '-'} ~ ${formatDate(item.traEndDate) || '-'}`,
        `총 훈련시간: ${item.trainTime || '-'}시간`,
        `정원: ${item.yardMan || '-'}명`,
        item.realExpAmt ? `훈련비: ${formatAmount(item.realExpAmt)}` : '',
        item.perTrco ? `정부지원금: ${formatAmount(item.perTrco)}` : '',
        item.selfBurden ? `자부담금: ${formatAmount(item.selfBurden)}` : '',
        item.eiEmplRate3 ? `취업률: ${item.eiEmplRate3}%` : '',
        item.address || item.addr1 ? `훈련장소: ${item.address || item.addr1}` : '',
        item.grade ? `등급: ${item.grade}` : '',
        item.titleLink || item.subTitleLink || `https://www.work24.go.kr/wk/a/b/1200/retriveDtlNtcInfo.do?wantedAuthNo=${item.trprId}`
      ].filter(Boolean).join('\n\n'),
      status: 'active',
      updated_at: new Date().toISOString()
    }))

    // 배치 upsert
    if (trainingsToUpsert.length > 0) {
      const { error: upsertError, count } = await supabase
        .from('announcements')
        .upsert(trainingsToUpsert, {
          onConflict: 'source,source_id',
          count: 'exact'
        })

      if (upsertError) {
        console.error('HRD upsert error:', upsertError.message)
        return NextResponse.json(
          { success: false, error: upsertError.message },
          { status: 500 }
        )
      }
    }

    // 종료된 훈련과정 비활성화
    await supabase
      .from('announcements')
      .update({ status: 'expired' })
      .eq('source', 'hrd')
      .lt('application_end', todayFormatted)

    const duration = Date.now() - startTime

    console.log(`✅ HRD Korea 동기화 완료: ${uniqueTrainings.length}건, ${duration}ms`)

    return NextResponse.json({
      success: true,
      message: 'HRD Korea 동기화 완료',
      stats: {
        fetched: allTrainings.length,
        active: activeTrainings.length,
        unique: uniqueTrainings.length,
        upserted: trainingsToUpsert.length,
        pages: page,
        duration: `${duration}ms`,
        syncedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('HRD 동기화 오류:', error)
    return NextResponse.json(
      { success: false, error: '동기화 중 오류가 발생했어요.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
