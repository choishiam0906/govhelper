import { NextRequest } from 'next/server'
import { createSyncHandler } from '@/lib/announcements/sync-handler'
import { fetchWithRetry } from '@/lib/api/retry'

// 기업마당 API 설정
const BIZINFO_API_URL = 'https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do'
const BIZINFO_API_KEY = process.env.BIZINFO_API_KEY || ''

// 기업마당 API 응답 형식
interface BizinfoAnnouncement {
  pblancId: string
  pblancNm: string
  bsnsSumryCn: string
  reqstBeginEndDe: string
  jrsdInsttNm: string
  excInsttNm: string
  pldirSportRealmLclasCodeNm: string
  pldirSportRealmMlsfcCodeNm: string
  trgetNm: string
  pblancUrl: string
  refrncNm: string
  creatPnttm: string
  hashtags: string
  totCnt: number
}

interface BizinfoResponse {
  jsonArray: BizinfoAnnouncement[]
}

// 신청기간 파싱 (예: "20260105 ~ 20260123" -> { startDate, endDate })
function parseRequestDate(reqstDt: string): { startDate: string | null; endDate: string | null } {
  const defaultDate = { startDate: null, endDate: null }

  if (!reqstDt) return defaultDate
  if (!reqstDt.includes('~')) return defaultDate

  const parts = reqstDt.split('~').map(s => s.trim())

  if (parts.length >= 2) {
    const formatDate = (d: string): string | null => {
      const clean = d.replace(/[.\-\/]/g, '')
      if (clean.length >= 8) {
        return `${clean.substring(0, 4)}-${clean.substring(4, 6)}-${clean.substring(6, 8)}`
      }
      return null
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

// HTML 태그 제거
function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() || ''
}

// 공통 핸들러 생성
const handler = createSyncHandler({
  source: 'bizinfo',
  logPrefix: 'bizinfo-sync',
  fetchAndTransform: async () => {
    // API 키 확인
    if (!BIZINFO_API_KEY) {
      throw new Error('기업마당 API 키가 설정되지 않았어요.')
    }

    const todayStr = getTodayStr()

    // 전체 분야 조회 (최대 500건)
    const params = new URLSearchParams({
      crtfcKey: BIZINFO_API_KEY,
      dataType: 'json',
      searchCnt: '500',
    })

    const apiUrl = `${BIZINFO_API_URL}?${params.toString()}`

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

    const result: BizinfoResponse = await response.json()

    // jsonArray에서 데이터 추출
    const allAnnouncements = result.jsonArray || []
    const totalFetched = allAnnouncements.length

    // 진행 중인 공고만 필터링
    const activeAnnouncements = allAnnouncements.filter(item => {
      const { endDate } = parseRequestDate(item.reqstBeginEndDe)
      if (!endDate) return true // 마감일 없으면 포함
      return endDate >= todayStr
    })

    // 중복 제거 (pblancId 기준)
    const seen = new Set<string>()
    const uniqueAnnouncements = activeAnnouncements.filter(item => {
      if (seen.has(item.pblancId)) return false
      seen.add(item.pblancId)
      return true
    })

    // 데이터 변환
    const announcements = uniqueAnnouncements.map(item => {
      const { startDate, endDate } = parseRequestDate(item.reqstBeginEndDe)
      const cleanContent = stripHtml(item.bsnsSumryCn)

      return {
        source: 'bizinfo',
        source_id: item.pblancId,
        title: item.pblancNm,
        organization: item.jrsdInsttNm || '',
        category: item.pldirSportRealmLclasCodeNm || '',
        support_type: item.pldirSportRealmMlsfcCodeNm || '',
        target_company: item.trgetNm || '',
        support_amount: '',
        application_start: startDate,
        application_end: endDate,
        content: [
          cleanContent,
          item.refrncNm ? `문의: ${item.refrncNm}` : '',
          item.hashtags ? `#${item.hashtags.split(',').join(' #')}` : '',
          `상세보기: https://www.bizinfo.go.kr${item.pblancUrl}`
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
