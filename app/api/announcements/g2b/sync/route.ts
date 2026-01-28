import { NextRequest } from 'next/server'
import { createSyncHandler } from '@/lib/announcements/sync-handler'
import { fetchWithRetry } from '@/lib/api/retry'

// 나라장터 API 설정
const G2B_API_URL = 'https://apis.data.go.kr/1230000/ad/BidPublicInfoService'
const G2B_API_KEY = process.env.G2B_API_KEY || ''

const BID_ENDPOINTS = {
  thng: '/getBidPblancListInfoThng',
  servc: '/getBidPblancListInfoServc',
  cnstwk: '/getBidPblancListInfoCnstwk',
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

// 공통 핸들러 생성
const handler = createSyncHandler({
  source: 'g2b',
  logPrefix: 'g2b-sync',
  fetchAndTransform: async () => {
    // API 키 확인
    if (!G2B_API_KEY) {
      throw new Error('나라장터 API 키가 설정되지 않았어요.')
    }

    const todayStr = getTodayStr()

    // 최근 7일 데이터 조회
    const inqryBgnDt = getDateStr(7) + '0000'
    const inqryEndDt = getDateStr(0) + '2359'

    const allBids: (G2BBidItem & { bidType: string })[] = []

    // 각 유형별로 API 호출 (물품, 용역, 공사)
    for (const [type, endpoint] of Object.entries(BID_ENDPOINTS)) {
      let page = 1
      let hasMore = true

      while (hasMore && page <= 3) {
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

        try {
          const response = await fetchWithRetry(
            apiUrl,
            {
              method: 'GET',
              headers: { 'Accept': 'application/json' },
            },
            {
              maxRetries: 3,
              baseDelay: 2000,
              backoff: 'exponential',
            }
          )

          const result: G2BResponse = await response.json()

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

    const totalFetched = allBids.length

    // 진행 중인 입찰만 필터링
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

    // 데이터 변환
    const announcements = uniqueBids.map(item => {
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
        support_type: item.cntrctMthdNm || '',
        target_company: targetParts.join(' / ') || '',
        support_amount: item.presmptPrce || '',
        application_start: formatDate(item.bidNtceDt),
        application_end: formatDate(item.bidClseDt),
        content: [
          `공고종류: ${item.ntceKindNm || ''}`,
          `입찰방식: ${item.bidMethdNm || ''}`,
          `계약방법: ${item.cntrctMthdNm || ''}`,
          `낙찰방법: ${item.sucsfbidMthdNm || ''}`,
          `수요기관: ${item.dminsttNm || ''}`,
          item.presmptPrce ? `추정가격: ${Number(item.presmptPrce).toLocaleString()}원` : '',
          item.asignBdgtAmt ? `배정예산: ${Number(item.asignBdgtAmt).toLocaleString()}원` : '',
          item.bidNtceDtlUrl ? `상세보기: ${item.bidNtceDtlUrl}` : '',
        ].filter(Boolean).join('\n\n'),
        status: 'active',
        updated_at: new Date().toISOString()
      }
    })

    return {
      announcements,
      totalFetched
    }
  }
})

export const POST = handler
export const GET = (request: NextRequest) => POST(request)
export const dynamic = 'force-dynamic'
export const maxDuration = 120
