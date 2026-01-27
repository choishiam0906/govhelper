import { NextRequest, NextResponse } from 'next/server'

// K-Startup API 설정 (공공데이터포털)
const KSTARTUP_API_URL = 'https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01'
const KSTARTUP_API_KEY = process.env.KSTARTUP_API_KEY || ''

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
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const clean = dateStr.replace(/[.\-\/]/g, '')
  if (clean.length >= 8) {
    return `${clean.substring(0, 4)}-${clean.substring(4, 6)}-${clean.substring(6, 8)}`
  }
  return dateStr
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
    if (!KSTARTUP_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'K-Startup API 키가 설정되지 않았어요. 공공데이터포털에서 발급받아주세요.' },
        { status: 500 }
      )
    }

    // 파라미터 파싱
    const page = searchParams.get('page') || '1'
    const perPage = searchParams.get('limit') || '50'
    const category = searchParams.get('category') || ''
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    // K-Startup API 호출
    const params = new URLSearchParams({
      serviceKey: KSTARTUP_API_KEY,
      page,
      perPage,
      returnType: 'json',
    })

    // 분야 필터
    if (category) {
      params.set('cond[supt_biz_clsfc::LIKE]', category)
    }

    const apiUrl = `${KSTARTUP_API_URL}?${params.toString()}`


    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 } // 1시간 캐시
    })

    if (!response.ok) {
      throw new Error(`K-Startup API error: ${response.status}`)
    }

    const result: KStartupResponse = await response.json()

    let announcements: KStartupAnnouncement[] = result.data || []

    // 진행 중인 공고만 필터링 (마감일이 오늘 이후)
    if (activeOnly) {
      const todayStr = getTodayStr()
      announcements = announcements.filter(item => {
        const endDate = formatDate(item.pbanc_rcpt_end_dt)
        if (!endDate) return true // 마감일 없으면 포함
        return endDate >= todayStr
      })
    }

    // 데이터 변환
    const formattedData = announcements.map(item => ({
      id: String(item.pbanc_sn),
      title: item.biz_pbanc_nm,
      organization: item.pbanc_ntrp_nm || '',
      bizType: item.supt_biz_clsfc || '',
      sportType: '',
      startDate: formatDate(item.pbanc_rcpt_bgng_dt),
      endDate: formatDate(item.pbanc_rcpt_end_dt),
      area: item.supt_regin || '',
      targetScale: item.aply_trgt || '',
      detailUrl: item.detl_pg_url || `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${item.pbanc_sn}`,
      content: item.pbanc_ctnt || '',
      supportContent: '',
      target: item.aply_trgt || '',
      reference: '',
      createdAt: formatDate(item.pbanc_rcpt_bgng_dt),
      updatedAt: formatDate(item.pbanc_rcpt_bgng_dt),
      source: 'kstartup',
      eligibility: {
        target: item.aply_trgt || '',
        companyScale: '',
        businessType: '',
        employeeCount: '',
        requiredCertification: ''
      },
      attachments: [],
      isIntegrated: item.intg_pbanc_yn === 'Y', // 통합공고 여부
      executor: item.sprv_inst || '', // 수행기관
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
        total: result.totalCount || 0,
        returned: formattedData.length,
        page: parseInt(page),
        limit: parseInt(perPage),
        activeOnly,
        fetchedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('K-Startup API error:', error)
    return NextResponse.json(
      { success: false, error: 'K-Startup API 연동 오류' },
      { status: 500 }
    )
  }
}

// 지원사업 분류 목록
export async function OPTIONS() {
  return NextResponse.json({
    categories: [
      { code: '시설·공간·보육', name: '시설·공간·보육' },
      { code: '멘토링·컨설팅', name: '멘토링·컨설팅' },
      { code: '사업화', name: '사업화' },
      { code: 'R&D', name: 'R&D' },
      { code: '판로·해외진출', name: '판로·해외진출' },
      { code: '인력', name: '인력' },
      { code: '융자', name: '융자' },
      { code: '행사·네트워크', name: '행사·네트워크' },
    ]
  })
}
