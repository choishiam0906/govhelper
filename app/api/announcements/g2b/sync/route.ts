import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  syncRateLimiter,
  checkRateLimit,
  getClientIP,
  getRateLimitHeaders,
  isRateLimitEnabled,
} from '@/lib/rate-limit'

// 나라장터 API 설정
const G2B_API_URL = 'https://apis.data.go.kr/1230000/ad/BidPublicInfoService'
const G2B_API_KEY = process.env.G2B_API_KEY || ''

const BID_ENDPOINTS = {
  thng: '/getBidPblancListInfoThng',
  servc: '/getBidPblancListInfoServc',
  cnstwk: '/getBidPblancListInfoCnstwk',
}

// Supabase Admin Client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface G2BBidItem {
  bidNtceNo: string
  bidNtceOrd: string
  reNtceYn: string
  bidNtceNm: string
  ntceInsttNm: string
  dminsttNm: string
  bidNtceDt: string
  bidClseDt: string
  opengDt: string
  bidNtceDtlUrl: string
  bidMethdNm: string
  cntrctMthdNm: string
  ntceKindNm: string
  presmptPrce: string
  asignBdgtAmt: string
  rgstDt: string
  sucsfbidMthdNm: string
}

interface G2BResponse {
  response: {
    header: { resultCode: string; resultMsg: string }
    body: {
      items: G2BBidItem[] | null
      numOfRows: number
      pageNo: number
      totalCount: number
    }
  }
}

function formatDate(dateStr: string): string | null {
  if (!dateStr) return null
  // "2025-01-06 08:19:02" 또는 "2025/01/06 08:19" 형식 처리
  const match = dateStr.match(/(\d{4})[-\/](\d{2})[-\/](\d{2})/)
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`
  }
  return null
}

function getTodayStr(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

function getDateStr(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

function getBidTypeName(type: string): string {
  const names: Record<string, string> = {
    thng: '물품',
    servc: '용역',
    cnstwk: '공사',
  }
  return names[type] || type
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
    if (!G2B_API_KEY) {
      return NextResponse.json(
        { success: false, error: '나라장터 API 키가 설정되지 않았어요.' },
        { status: 500 }
      )
    }

    const supabase = getSupabaseAdmin()
    const todayStr = getTodayStr()

    // 최근 7일 데이터 조회
    const inqryBgnDt = getDateStr(7) + '0000'
    const inqryEndDt = getDateStr(0) + '2359'

    console.log('📡 나라장터 동기화 시작', { inqryBgnDt, inqryEndDt, hasApiKey: !!G2B_API_KEY })

    const allBids: (G2BBidItem & { bidType: string })[] = []

    // 각 유형별로 API 호출
    for (const [type, endpoint] of Object.entries(BID_ENDPOINTS)) {
      let page = 1
      let hasMore = true

      while (hasMore && page <= 3) { // 최대 3페이지
        const params = new URLSearchParams({
          serviceKey: G2B_API_KEY,
          pageNo: String(page),
          numOfRows: '100',
          inqryDiv: '1',
          inqryBgnDt,
          inqryEndDt,
          type: 'json',
        })

        const apiUrl = `${G2B_API_URL}${endpoint}?${params.toString()}`
        console.log(`🔍 G2B API 호출: ${type} page ${page}`)

        try {
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
          })

          console.log(`📥 G2B API 응답: ${type} status ${response.status}`)

          if (!response.ok) {
            const errorText = await response.text()
            console.error(`G2B API error (${type}):`, response.status, errorText.slice(0, 200))
            break
          }

          const result: G2BResponse = await response.json()
          console.log(`📊 G2B 결과: ${type} items=${result.response?.body?.items?.length ?? 0} total=${result.response?.body?.totalCount ?? 0}`)

          if (result.response?.body?.items) {
            const items = Array.isArray(result.response.body.items)
              ? result.response.body.items
              : [result.response.body.items]

            items.forEach(item => {
              allBids.push({ ...item, bidType: type })
            })

            if (items.length < 100) {
              hasMore = false
            } else {
              page++
            }
          } else {
            hasMore = false
          }
        } catch (error) {
          console.error(`G2B fetch error (${type}):`, error)
          break
        }
      }
    }

    // 진행 중인 입찰만 필터링 (마감일이 오늘 이후)
    const activeBids = allBids.filter(item => {
      const endDate = formatDate(item.bidClseDt)
      if (!endDate) return true
      return endDate >= todayStr
    })

    // 중복 제거
    const seen = new Set<string>()
    const uniqueBids = activeBids.filter(item => {
      const id = `${item.bidNtceNo}-${item.bidNtceOrd}`
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })

    // DB 저장 형식으로 변환
    const bidsToUpsert = uniqueBids.map(item => {
      // 참가자격 정보 조합 (공고종류 + 입찰방식)
      const targetParts = [
        item.ntceKindNm,
        item.bidMethdNm,
      ].filter(Boolean)

      return {
        source: 'g2b',
        source_id: `${item.bidNtceNo}-${item.bidNtceOrd}`,
        title: item.bidNtceNm || '',
        organization: item.ntceInsttNm || '',
        category: getBidTypeName(item.bidType),
        support_type: item.cntrctMthdNm || '', // 계약방법 → support_type으로 이동
        target_company: targetParts.join(' / ') || '', // 공고종류 + 입찰방식
        support_amount: item.presmptPrce ? `추정가 ${Number(item.presmptPrce).toLocaleString()}원` : '',
        application_start: formatDate(item.bidNtceDt),
        application_end: formatDate(item.bidClseDt),
        content: [
          `공고종류: ${item.ntceKindNm || ''}`,
          `입찰방식: ${item.bidMethdNm || ''}`,
          `계약방법: ${item.cntrctMthdNm || ''}`,
          `낙찰방법: ${item.sucsfbidMthdNm || ''}`,
          `수요기관: ${item.dminsttNm || ''}`,
          item.asignBdgtAmt ? `배정예산: ${Number(item.asignBdgtAmt).toLocaleString()}원` : '',
          item.bidNtceDtlUrl ? `상세보기: ${item.bidNtceDtlUrl}` : '',
        ].filter(Boolean).join('\n\n'),
        status: 'active',
        updated_at: new Date().toISOString()
      }
    })

    // 배치 upsert
    const { error: upsertError, count } = await supabase
      .from('announcements')
      .upsert(bidsToUpsert, {
        onConflict: 'source,source_id',
        count: 'exact'
      })

    if (upsertError) {
      console.error('G2B upsert error:', upsertError.message)
      return NextResponse.json(
        { success: false, error: upsertError.message },
        { status: 500 }
      )
    }

    // 마감된 입찰 비활성화
    await supabase
      .from('announcements')
      .update({ status: 'expired' })
      .eq('source', 'g2b')
      .lt('application_end', todayStr)

    const duration = Date.now() - startTime

    console.log(`✅ 나라장터 동기화 완료: ${uniqueBids.length}건, ${duration}ms`)

    return NextResponse.json({
      success: true,
      message: '나라장터 동기화 완료',
      stats: {
        fetched: allBids.length,
        active: activeBids.length,
        unique: uniqueBids.length,
        upserted: count,
        duration: `${duration}ms`,
        syncedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('G2B 동기화 오류:', error)
    return NextResponse.json(
      { success: false, error: '동기화 중 오류가 발생했어요.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
