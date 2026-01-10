import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 중소벤처24 API 설정
const SMES_API_URL = 'https://www.smes.go.kr/main/fnct/apiReqst/extPblancInfo'
const SMES_API_TOKEN = process.env.SMES_API_TOKEN || ''

// Supabase Admin Client 생성 (런타임에 호출)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

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

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = getSupabaseAdmin()

    // 조회 기간: 최근 3개월 ~ 2개월 후 (짧게 조정)
    const today = new Date()
    const startDate = new Date(today)
    startDate.setMonth(startDate.getMonth() - 3)
    const endDate = new Date(today)
    endDate.setMonth(endDate.getMonth() + 2)

    // SMES API 호출
    const apiUrl = `${SMES_API_URL}?token=${SMES_API_TOKEN}&strDt=${formatDate(startDate)}&endDt=${formatDate(endDate)}`

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`SMES API error: ${response.status}`)
    }

    const result = await response.json()

    if (result.resultCd !== '0') {
      return NextResponse.json(
        { success: false, error: result.resultMsg || 'SMES API 오류' },
        { status: 500 }
      )
    }

    let announcements: SMESAnnouncement[] = result.data || []

    // 진행 중인 공고만 필터링
    const todayStr = getTodayStr()
    announcements = announcements.filter(item => {
      const endDt = item.pblancEndDt
      return endDt && endDt >= todayStr
    })

    // 중복 제거
    const seen = new Set<number>()
    const uniqueAnnouncements = announcements.filter(item => {
      if (seen.has(item.pblancSeq)) return false
      seen.add(item.pblancSeq)
      return true
    })

    // 데이터 변환 (배치용)
    const announcementsToUpsert = uniqueAnnouncements.map(item => ({
      source: 'smes24',
      source_id: String(item.pblancSeq),
      title: item.pblancNm,
      organization: item.sportInsttNm || '',
      category: item.bizType || '',
      support_type: item.sportType || '',
      target_company: item.cmpScale || '',
      support_amount: '',
      application_start: toDateFormat(item.pblancBgnDt),
      application_end: toDateFormat(item.pblancEndDt),
      content: [
        item.policyCnts || '',
        item.sportCnts || '',
        item.sportTrget || '',
        item.areaNm ? `지역: ${item.areaNm}` : '',
        item.pblancDtlUrl ? `상세보기: ${item.pblancDtlUrl}` : ''
      ].filter(Boolean).join('\n\n'),
      status: 'active',
      updated_at: new Date().toISOString()
    }))

    // 배치 upsert (한 번에 처리)
    const { error: upsertError, count } = await supabase
      .from('announcements')
      .upsert(announcementsToUpsert, {
        onConflict: 'source,source_id',
        count: 'exact'
      })

    if (upsertError) {
      console.error('Batch upsert error:', upsertError.message)
      return NextResponse.json(
        { success: false, error: upsertError.message },
        { status: 500 }
      )
    }

    // 마감된 SMES 공고 비활성화
    await supabase
      .from('announcements')
      .update({ status: 'expired' })
      .eq('source', 'smes24')
      .lt('application_end', todayStr)

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      message: '동기화 완료',
      stats: {
        total: uniqueAnnouncements.length,
        upserted: count,
        duration: `${duration}ms`,
        syncedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('SMES 동기화 오류:', error)
    return NextResponse.json(
      { success: false, error: '동기화 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
