import { NextRequest, NextResponse } from 'next/server'

// 중소벤처24 API 설정
const SMES_API_URL = 'https://www.smes.go.kr/main/fnct/apiReqst/extPblancInfo'
const SMES_API_TOKEN = process.env.SMES_API_TOKEN || 'H5GuGfgyhANoGm1y6%2FVnkb6oZnuEGdwT6p6OTvLg4FOqRU6sk2WaZHHZkP7BpVDG'

interface SMESAnnouncement {
  pblancSeq: number
  pblancNm: string
  sportInsttNm: string
  bizType: string
  sportType: string
  pblancBgnDt: string
  pblancEndDt: string
  areaNm: string
  cmpScale: string
  pblancDtlUrl: string
  creatDt: string
  updDt: string
  policyCnts?: string
  sportCnts?: string
  sportTrget?: string
  refrnc?: string
  // 추가 필드
  pblancAttach?: string
  pblancAttachNm?: string
  ablbiz?: string
  needCrtfn?: string
  emplyCnt?: string
}

// 날짜 포맷 (YYYYMMDD)
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

// 오늘 날짜 (YYYY-MM-DD)
function getTodayStr(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // 기본값: 최근 6개월 ~ 3개월 후
    const today = new Date()
    const defaultStartDate = new Date(today)
    defaultStartDate.setMonth(defaultStartDate.getMonth() - 6)
    const defaultEndDate = new Date(today)
    defaultEndDate.setMonth(defaultEndDate.getMonth() + 3)

    const startDate = searchParams.get('startDate') || formatDate(defaultStartDate)
    const endDate = searchParams.get('endDate') || formatDate(defaultEndDate)
    const activeOnly = searchParams.get('activeOnly') !== 'false' // 기본값: true

    // 중소벤처24 API 호출
    const apiUrl = `${SMES_API_URL}?token=${SMES_API_TOKEN}&strDt=${startDate}&endDt=${endDate}`


    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 } // 1시간 캐시
    })

    if (!response.ok) {
      throw new Error(`SMES API error: ${response.status}`)
    }

    const result = await response.json()

    if (result.resultCd !== '0') {
      return NextResponse.json(
        { success: false, error: result.resultMsg || 'API 오류' },
        { status: 500 }
      )
    }

    let announcements: SMESAnnouncement[] = result.data || []

    // 진행 중인 공고만 필터링 (마감일이 오늘 이후)
    if (activeOnly) {
      const todayStr = getTodayStr()
      announcements = announcements.filter(item => {
        const endDt = item.pblancEndDt
        return endDt && endDt >= todayStr
      })
    }

    // 중복 제거 (pblancSeq 기준)
    const seen = new Set<number>()
    const uniqueAnnouncements = announcements.filter(item => {
      if (seen.has(item.pblancSeq)) return false
      seen.add(item.pblancSeq)
      return true
    })

    // 데이터 변환
    const formattedData = uniqueAnnouncements.map(item => ({
      id: item.pblancSeq,
      title: item.pblancNm,
      organization: item.sportInsttNm,
      bizType: item.bizType,
      sportType: item.sportType,
      startDate: item.pblancBgnDt,
      endDate: item.pblancEndDt,
      area: item.areaNm,
      targetScale: item.cmpScale,
      detailUrl: item.pblancDtlUrl,
      content: item.policyCnts || '',
      supportContent: item.sportCnts || '',
      target: item.sportTrget || '',
      reference: item.refrnc || '',
      createdAt: item.creatDt,
      updatedAt: item.updDt,
      source: 'smes24',
      // 지원자격 관련
      eligibility: {
        target: item.sportTrget || '',
        companyScale: item.cmpScale || '',
        businessType: item.ablbiz || '',
        employeeCount: item.emplyCnt || '',
        requiredCertification: item.needCrtfn || ''
      },
      // 첨부파일
      attachments: item.pblancAttach ? [{
        url: item.pblancAttach,
        name: item.pblancAttachNm || '첨부파일'
      }] : []
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
        activeOnly,
        period: { startDate, endDate },
        fetchedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('SMES API error:', error)
    return NextResponse.json(
      { success: false, error: '중소벤처24 API 연동 오류' },
      { status: 500 }
    )
  }
}
