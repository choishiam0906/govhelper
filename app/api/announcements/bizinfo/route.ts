import { NextRequest, NextResponse } from 'next/server'

// 기업마당 API 설정
const BIZINFO_API_URL = 'https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do'
const BIZINFO_API_KEY = process.env.BIZINFO_API_KEY || ''

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
function parseRequestDate(reqstDt: string): { startDate: string; endDate: string } {
  const defaultDate = { startDate: '', endDate: '' }

  if (!reqstDt) return defaultDate

  // "예산 소진시까지" 같은 경우
  if (!reqstDt.includes('~')) return defaultDate

  const parts = reqstDt.split('~').map(s => s.trim())

  if (parts.length >= 2) {
    // YYYYMMDD -> YYYY-MM-DD 변환
    const formatDate = (d: string) => {
      const clean = d.replace(/[.\-\/]/g, '')
      if (clean.length >= 8) {
        return `${clean.substring(0, 4)}-${clean.substring(4, 6)}-${clean.substring(6, 8)}`
      }
      return ''
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // API 키 확인
    if (!BIZINFO_API_KEY) {
      return NextResponse.json(
        { success: false, error: '기업마당 API 키가 설정되지 않았어요.' },
        { status: 500 }
      )
    }

    // 파라미터 파싱
    const pageIndex = searchParams.get('page') || '1'
    const pageUnit = searchParams.get('limit') || '50'
    const categoryCode = searchParams.get('category') || '' // 01~08
    const hashtags = searchParams.get('hashtags') || ''
    const activeOnly = searchParams.get('activeOnly') !== 'false' // 기본값: true

    // 기업마당 API 호출
    const params = new URLSearchParams({
      crtfcKey: BIZINFO_API_KEY,
      dataType: 'json',
      pageUnit,
      pageIndex,
    })

    if (categoryCode) {
      params.set('searchLclasId', categoryCode)
    }

    if (hashtags) {
      params.set('hashtags', hashtags)
    }

    const apiUrl = `${BIZINFO_API_URL}?${params.toString()}`

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 } // 1시간 캐시
    })

    if (!response.ok) {
      throw new Error(`Bizinfo API error: ${response.status}`)
    }

    const result: BizinfoResponse = await response.json()

    // jsonArray에서 데이터 추출
    let announcements: BizinfoAnnouncement[] = result.jsonArray || []
    const totalCount = announcements.length > 0 ? announcements[0].totCnt : 0

    // 진행 중인 공고만 필터링 (마감일이 오늘 이후)
    if (activeOnly) {
      const todayStr = getTodayStr()
      announcements = announcements.filter(item => {
        const { endDate } = parseRequestDate(item.reqstBeginEndDe)
        if (!endDate) return true // 마감일 없으면 포함 (예산 소진시까지 등)
        return endDate >= todayStr
      })
    }

    // 데이터 변환 (SMES API와 동일한 포맷으로)
    const formattedData = announcements.map(item => {
      const { startDate, endDate } = parseRequestDate(item.reqstBeginEndDe)
      // HTML 태그 제거
      const cleanContent = item.bsnsSumryCn?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() || ''

      return {
        id: item.pblancId,
        title: item.pblancNm,
        organization: item.jrsdInsttNm,
        bizType: item.pldirSportRealmLclasCodeNm || '',
        sportType: item.pldirSportRealmMlsfcCodeNm || '',
        startDate,
        endDate,
        area: '',
        targetScale: item.trgetNm || '',
        detailUrl: `https://www.bizinfo.go.kr${item.pblancUrl}`,
        content: cleanContent,
        supportContent: '',
        target: item.trgetNm || '',
        reference: item.refrncNm || '',
        createdAt: item.creatPnttm,
        updatedAt: item.creatPnttm,
        source: 'bizinfo',
        // 지원자격 관련
        eligibility: {
          target: item.trgetNm || '',
          companyScale: '',
          businessType: '',
          employeeCount: '',
          requiredCertification: ''
        },
        // 첨부파일
        attachments: [],
        // 추가 정보
        hashtags: item.hashtags || '',
        executor: item.excInsttNm || '', // 수행기관
      }
    })

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
        total: totalCount,
        returned: formattedData.length,
        page: parseInt(pageIndex),
        limit: parseInt(pageUnit),
        activeOnly,
        fetchedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('기업마당 API error:', error)
    return NextResponse.json(
      { success: false, error: '기업마당 API 연동 오류' },
      { status: 500 }
    )
  }
}

// 분야 목록 (기업마당 기준)
export async function OPTIONS() {
  return NextResponse.json({
    categories: [
      { code: '01', name: '금융' },
      { code: '02', name: '기술' },
      { code: '03', name: '인력' },
      { code: '04', name: '수출' },
      { code: '05', name: '내수' },
      { code: '06', name: '창업' },
      { code: '07', name: '경영' },
      { code: '08', name: '기타' },
    ]
  })
}
