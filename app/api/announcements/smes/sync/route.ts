import { NextRequest } from 'next/server'
import { createSyncHandler } from '@/lib/announcements/sync-handler'
import { fetchWithRetry } from '@/lib/api/retry'

// 중소벤처24 API 설정
const SMES_API_URL = 'https://www.smes.go.kr/main/fnct/apiReqst/extPblancInfo'
const SMES_API_TOKEN = process.env.SMES_API_TOKEN || ''

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
  ablbiz?: string
  emplyCnt?: string
  needCrtfn?: string
  pblancAttach?: string
  pblancAttachNm?: string
  sportAmt?: string
}

// 날짜 포맷 (YYYYMMDD)
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

// YYYY-MM-DD 형식으로 변환
function toDateFormat(dateStr: string): string | null {
  if (!dateStr || dateStr.length < 10) return null
  if (dateStr.includes('-')) return dateStr.substring(0, 10)
  if (dateStr.length >= 8) {
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
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
  source: 'smes24',
  logPrefix: 'smes-sync',
  fetchAndTransform: async () => {
    // 조회 기간: 최근 3개월 ~ 2개월 후
    const today = new Date()
    const startDate = new Date(today)
    startDate.setMonth(startDate.getMonth() - 3)
    const endDate = new Date(today)
    endDate.setMonth(endDate.getMonth() + 2)

    // SMES API 호출 (재시도 로직 포함)
    const apiUrl = `${SMES_API_URL}?token=${SMES_API_TOKEN}&strDt=${formatDate(startDate)}&endDt=${formatDate(endDate)}`

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

    const result = await response.json()

    if (result.resultCd !== '0') {
      throw new Error(result.resultMsg || 'SMES API 오류')
    }

    let allAnnouncements: SMESAnnouncement[] = result.data || []
    const totalFetched = allAnnouncements.length

    // 진행 중인 공고만 필터링
    const todayStr = getTodayStr()
    allAnnouncements = allAnnouncements.filter(item => {
      const endDt = item.pblancEndDt
      return endDt && endDt >= todayStr
    })

    // 중복 제거 (pblancSeq 기준)
    const seen = new Set<number>()
    const uniqueAnnouncements = allAnnouncements.filter(item => {
      if (seen.has(item.pblancSeq)) return false
      seen.add(item.pblancSeq)
      return true
    })

    // 데이터 변환
    const announcements = uniqueAnnouncements.map(item => {
      // 지원 대상 정보 구성
      const targetParts = [
        item.cmpScale,
        item.ablbiz ? `업종: ${item.ablbiz}` : '',
        item.emplyCnt ? `직원수: ${item.emplyCnt}` : '',
        item.needCrtfn ? `필요인증: ${item.needCrtfn}` : '',
      ].filter(Boolean)

      // 첨부파일 URL 배열 생성
      const attachmentUrls: string[] = []
      if (item.pblancAttach) {
        attachmentUrls.push(item.pblancAttach)
      }

      return {
        source: 'smes24',
        source_id: String(item.pblancSeq),
        title: item.pblancNm,
        organization: item.sportInsttNm || '',
        category: item.bizType || '',
        support_type: item.sportType || '',
        target_company: targetParts.join(' / ') || '',
        support_amount: item.sportAmt || '',
        application_start: toDateFormat(item.pblancBgnDt),
        application_end: toDateFormat(item.pblancEndDt),
        content: [
          item.policyCnts || '',
          item.sportCnts || '',
          item.sportTrget || '',
          item.areaNm ? `지역: ${item.areaNm}` : '',
          item.pblancDtlUrl ? `상세보기: ${item.pblancDtlUrl}` : ''
        ].filter(Boolean).join('\n\n'),
        attachment_urls: attachmentUrls.length > 0 ? attachmentUrls : null,
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
