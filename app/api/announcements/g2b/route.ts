import { NextRequest, NextResponse } from 'next/server'

// 나라장터 API 설정 (공공데이터포털)
const G2B_API_URL = 'https://apis.data.go.kr/1230000/ad/BidPublicInfoService'
const G2B_API_KEY = process.env.G2B_API_KEY || ''

// 입찰 유형별 엔드포인트
const BID_ENDPOINTS = {
  thng: '/getBidPblancListInfoThng',     // 물품
  servc: '/getBidPblancListInfoServc',   // 용역
  cnstwk: '/getBidPblancListInfoCnstwk', // 공사
}

// API 응답 형식
interface G2BBidItem {
  bidNtceNo: string           // 입찰공고번호
  bidNtceOrd: string          // 입찰공고차수
  reNtceYn: string            // 재공고여부
  bidNtceNm: string           // 입찰공고명
  ntceInsttNm: string         // 공고기관명
  dminsttNm: string           // 수요기관명
  bidNtceDt: string           // 입찰공고일시
  bidClseDt: string           // 입찰마감일시
  opengDt: string             // 개찰일시
  bidNtceDtlUrl: string       // 입찰공고상세URL
  bidMethdNm: string          // 입찰방식명
  cntrctMthdNm: string        // 계약방법명
  ntceKindNm: string          // 공고종류명
  presmptPrce: string         // 추정가격
  asignBdgtAmt: string        // 배정예산금액
  rgstDt: string              // 등록일시
  bfSpecRgstNo: string        // 사전규격등록번호
  sucsfbidMthdNm: string      // 낙찰방법명
  bidQlfctRgstDt: string      // 입찰참가자격등록마감일시
  cmmnSpldmdAgrmntRcptdocMethd: string // 공동수급협정서접수방법
  indutyVAT: string           // 업종부가세
}

interface G2BResponse {
  response: {
    header: {
      resultCode: string
      resultMsg: string
    }
    body: {
      items: G2BBidItem[] | null
      numOfRows: number
      pageNo: number
      totalCount: number
    }
  }
}

// 날짜 포맷 변환 (YYYY-MM-DD HH:MM:SS 또는 YYYY/MM/DD HH:MM -> YYYY-MM-DD)
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  // "2025-01-06 08:19:02" 또는 "2025/01/17 10:00" 형식 처리
  const match = dateStr.match(/(\d{4})[-\/](\d{2})[-\/](\d{2})/)
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`
  }
  return dateStr.split(' ')[0].replace(/\//g, '-')
}

// 오늘 날짜 (YYYYMMDD)
function getTodayStr(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

// 30일 전 날짜 (YYYYMMDD)
function get30DaysAgoStr(): string {
  const date = new Date()
  date.setDate(date.getDate() - 30)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // API 키 확인
    if (!G2B_API_KEY) {
      return NextResponse.json(
        { success: false, error: '나라장터 API 키가 설정되지 않았어요. 공공데이터포털에서 발급받아주세요.' },
        { status: 500 }
      )
    }

    // 파라미터 파싱
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '50'
    const bidType = searchParams.get('bidType') || 'all' // thng, servc, cnstwk, all
    const keyword = searchParams.get('keyword') || ''

    // 조회 기간 설정 (최근 30일)
    const inqryBgnDt = searchParams.get('startDate') || get30DaysAgoStr()
    const inqryEndDt = searchParams.get('endDate') || getTodayStr()

    // 조회할 입찰 유형 결정
    const typesToFetch = bidType === 'all'
      ? Object.keys(BID_ENDPOINTS)
      : [bidType]

    const allBids: G2BBidItem[] = []

    // 각 유형별로 API 호출
    for (const type of typesToFetch) {
      const endpoint = BID_ENDPOINTS[type as keyof typeof BID_ENDPOINTS]
      if (!endpoint) continue

      const params = new URLSearchParams({
        serviceKey: G2B_API_KEY,
        pageNo: page,
        numOfRows: bidType === 'all' ? String(Math.ceil(Number(limit) / 3)) : limit,
        inqryDiv: '1', // 1: 공고일시 기준
        inqryBgnDt: inqryBgnDt + '0000', // YYYYMMDD0000
        inqryEndDt: inqryEndDt + '2359', // YYYYMMDD2359
        type: 'json',
      })

      const apiUrl = `${G2B_API_URL}${endpoint}?${params.toString()}`

      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 3600 } // 1시간 캐시
        })

        if (!response.ok) {
          console.error(`G2B API error (${type}):`, response.status)
          continue
        }

        const result: G2BResponse = await response.json()

        if (result.response?.body?.items) {
          const items = Array.isArray(result.response.body.items)
            ? result.response.body.items
            : [result.response.body.items]

          // 유형 태그 추가
          items.forEach(item => {
            (item as any).bidType = type
          })

          allBids.push(...items)
        }
      } catch (error) {
        console.error(`G2B API fetch error (${type}):`, error)
      }
    }

    // 키워드 필터링
    let filteredBids = allBids
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase()
      filteredBids = allBids.filter(item =>
        item.bidNtceNm?.toLowerCase().includes(lowerKeyword) ||
        item.ntceInsttNm?.toLowerCase().includes(lowerKeyword) ||
        item.dminsttNm?.toLowerCase().includes(lowerKeyword)
      )
    }

    // 데이터 변환
    const formattedData = filteredBids.map(item => ({
      id: `${item.bidNtceNo}-${item.bidNtceOrd}`,
      title: item.bidNtceNm || '',
      organization: item.ntceInsttNm || '',
      demandOrg: item.dminsttNm || '',
      bidType: getBidTypeName((item as any).bidType),
      bidMethod: item.bidMethdNm || '',
      contractMethod: item.cntrctMthdNm || '',
      noticeKind: item.ntceKindNm || '',
      startDate: formatDate(item.bidNtceDt),
      endDate: formatDate(item.bidClseDt),
      openDate: formatDate(item.opengDt),
      estimatedPrice: item.presmptPrce ? Number(item.presmptPrce) : null,
      budgetAmount: item.asignBdgtAmt ? Number(item.asignBdgtAmt) : null,
      detailUrl: item.bidNtceDtlUrl || `https://www.g2b.go.kr/pt/menu/selectSubFrame.do?framesrc=/pt/menu/frameTgong.do?url=https://www.g2b.go.kr:8101/ep/invitation/publish/bidInfoDtl.do?bidno=${item.bidNtceNo}%26bidseq=${item.bidNtceOrd}`,
      isReNotice: item.reNtceYn === 'Y',
      successBidMethod: item.sucsfbidMthdNm || '',
      createdAt: formatDate(item.rgstDt),
      source: 'g2b',
    }))

    // 마감일 기준 정렬 (가까운 순)
    formattedData.sort((a, b) => {
      if (!a.endDate) return 1
      if (!b.endDate) return -1
      return a.endDate.localeCompare(b.endDate)
    })

    return NextResponse.json({
      success: true,
      data: formattedData,
      meta: {
        total: formattedData.length,
        page: parseInt(page),
        limit: parseInt(limit),
        bidType,
        fetchedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('G2B API error:', error)
    return NextResponse.json(
      { success: false, error: '나라장터 API 연동 오류' },
      { status: 500 }
    )
  }
}

// 입찰 유형명 변환
function getBidTypeName(type: string): string {
  const names: Record<string, string> = {
    thng: '물품',
    servc: '용역',
    cnstwk: '공사',
  }
  return names[type] || type
}

// 입찰 유형 목록
export async function OPTIONS() {
  return NextResponse.json({
    bidTypes: [
      { code: 'all', name: '전체' },
      { code: 'thng', name: '물품' },
      { code: 'servc', name: '용역' },
      { code: 'cnstwk', name: '공사' },
    ]
  })
}
