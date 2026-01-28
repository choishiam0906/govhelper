import { NextRequest } from 'next/server'
import { createSyncHandler } from '@/lib/announcements/sync-handler'
import { fetchWithRetry } from '@/lib/api/retry'

// K-Startup API 설정 (공공데이터포털)
const KSTARTUP_API_URL = 'https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01'
const KSTARTUP_API_KEY = process.env.KSTARTUP_API_KEY || ''

// K-Startup API 응답 형식
interface KStartupAnnouncement {
  biz_pbanc_nm: string
  supt_biz_clsfc: string
  pbanc_sn: number
  pbanc_ntrp_nm: string
  sprv_inst: string
  pbanc_rcpt_bgng_dt: string
  pbanc_rcpt_end_dt: string
  detl_pg_url: string
  pbanc_ctnt: string
  intg_pbanc_yn: string
  aply_trgt: string
  supt_regin: string
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

// 공통 핸들러 생성
const handler = createSyncHandler({
  source: 'kstartup',
  logPrefix: 'kstartup-sync',
  fetchAndTransform: async () => {
    // API 키 확인
    if (!KSTARTUP_API_KEY) {
      throw new Error('K-Startup API 키가 설정되지 않았어요.')
    }

    const todayStr = getTodayStr()

    // 여러 페이지 조회 (최대 500건)
    const allAnnouncements: KStartupAnnouncement[] = []
    let page = 1
    const perPage = 100
    let hasMore = true

    while (hasMore && page <= 5) {
      const params = new URLSearchParams({
        serviceKey: KSTARTUP_API_KEY,
        page: String(page),
        perPage: String(perPage),
        returnType: 'json',
      })

      const apiUrl = `${KSTARTUP_API_URL}?${params.toString()}`

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

    const totalFetched = allAnnouncements.length

    // 진행 중인 공고만 필터링
    const activeAnnouncements = allAnnouncements.filter(item => {
      const endDate = formatDate(item.pbanc_rcpt_end_dt)
      if (!endDate) return true
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

    // 데이터 변환
    const announcements = uniqueAnnouncements.map(item => ({
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
