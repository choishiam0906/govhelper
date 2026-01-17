import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// HRD Korea API 설정 (공공데이터포털 - 국민내일배움카드 훈련과정)
const HRD_API_URL = 'https://apis.data.go.kr/B552474/SrvcList/getJobTrainingList'
const HRD_API_KEY = process.env.HRD_API_KEY || ''

// Supabase Admin Client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// API 응답 타입
interface HRDTraining {
  trprId: string           // 훈련과정 ID
  trprNm: string           // 훈련과정명
  trainstCstId: string     // 훈련기관 ID
  inoNm: string            // 훈련기관명
  trprDegr: string         // 훈련차수
  traStartDate: string     // 훈련시작일
  traEndDate: string       // 훈련종료일
  trainTime: string        // 총훈련시간
  trainTimeDaylot: string  // 1일 훈련시간
  ncsCd: string            // NCS 코드
  ncsNm: string            // NCS명
  realExpAmt: string       // 실제 훈련비
  perTrco: string          // 정부지원금
  selfBurden: string       // 자부담금
  regCourseMan: string     // 수강신청인원
  yardMan: string          // 정원
  eiEmplRate3: string      // 취업률
  address: string          // 훈련기관 주소
  titleLink: string        // 상세 링크
  contents: string         // 훈련내용
  subTitle: string         // 부제목
  grade: string            // 등급
  trainTargetCd: string    // 훈련대상코드
  trainTarget: string      // 훈련대상명
}

interface HRDResponse {
  response: {
    header: {
      resultCode: string
      resultMsg: string
    }
    body: {
      items: {
        item: HRDTraining[] | HRDTraining
      } | null
      numOfRows: number
      pageNo: number
      totalCount: number
    }
  }
}

// 날짜 포맷 (YYYYMMDD -> YYYY-MM-DD)
function formatDate(dateStr: string): string | null {
  if (!dateStr) return null
  const clean = dateStr.replace(/[.\-\/\s]/g, '')
  if (clean.length >= 8) {
    return `${clean.substring(0, 4)}-${clean.substring(4, 6)}-${clean.substring(6, 8)}`
  }
  return null
}

// 오늘 날짜
function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

// 금액 포맷
function formatAmount(amount: string | number): string {
  if (!amount) return ''
  const num = typeof amount === 'string' ? parseInt(amount.replace(/,/g, '')) : amount
  if (isNaN(num)) return ''
  return num.toLocaleString() + '원'
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    if (!HRD_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'HRD Korea API 키가 설정되지 않았어요.' },
        { status: 500 }
      )
    }

    const supabase = getSupabaseAdmin()
    const todayStr = getTodayStr()

    console.log('📡 HRD Korea 동기화 시작')

    const allTrainings: HRDTraining[] = []
    let page = 1
    const numOfRows = 100
    let hasMore = true

    // 여러 페이지 조회 (최대 5페이지)
    while (hasMore && page <= 5) {
      const params = new URLSearchParams({
        serviceKey: HRD_API_KEY,
        pageNo: String(page),
        numOfRows: String(numOfRows),
        returnType: 'json',
        outType: '1', // 리스트 조회
        srchTraStDt: todayStr.replace(/-/g, ''), // 오늘 이후 시작 과정
        sort: 'ASC',
        sortCol: 'TRNG_BGDE', // 훈련시작일 기준 정렬
      })

      const apiUrl = `${HRD_API_URL}?${params.toString()}`

      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        })

        if (!response.ok) {
          console.error('HRD API error:', response.status)
          break
        }

        const result: HRDResponse = await response.json()

        if (result.response?.body?.items) {
          const items = result.response.body.items.item
          const itemArray = Array.isArray(items) ? items : [items]
          allTrainings.push(...itemArray.filter(Boolean))

          if (itemArray.length < numOfRows || allTrainings.length >= result.response.body.totalCount) {
            hasMore = false
          } else {
            page++
          }
        } else {
          hasMore = false
        }
      } catch (fetchError) {
        console.error('HRD fetch error:', fetchError)
        break
      }
    }

    // 진행 중인 훈련과정만 필터링
    const activeTrainings = allTrainings.filter(item => {
      const endDate = formatDate(item.traEndDate)
      if (!endDate) return true
      return endDate >= todayStr
    })

    // 중복 제거 (trprId + trainstCstId + trprDegr 기준)
    const seen = new Set<string>()
    const uniqueTrainings = activeTrainings.filter(item => {
      if (!item.trprId) return false
      const id = `${item.trprId}-${item.trainstCstId}-${item.trprDegr}`
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })

    // DB 저장 형식으로 변환
    const trainingsToUpsert = uniqueTrainings.map(item => ({
      source: 'hrd',
      source_id: `${item.trprId}-${item.trainstCstId}-${item.trprDegr}`,
      title: item.trprNm || '',
      organization: item.inoNm || '',
      category: item.ncsNm || '직업훈련',
      support_type: item.trainTarget || '국민내일배움카드',
      target_company: item.trainTarget || '구직자/재직자',
      support_amount: item.perTrco ? `정부지원 ${formatAmount(item.perTrco)}` : '',
      application_start: formatDate(item.traStartDate),
      application_end: formatDate(item.traEndDate),
      content: [
        item.contents || item.subTitle || '',
        `훈련기간: ${item.traStartDate} ~ ${item.traEndDate}`,
        `총 훈련시간: ${item.trainTime || '-'}시간`,
        `정원: ${item.yardMan || '-'}명`,
        item.realExpAmt ? `훈련비: ${formatAmount(item.realExpAmt)}` : '',
        item.perTrco ? `정부지원금: ${formatAmount(item.perTrco)}` : '',
        item.selfBurden ? `자부담금: ${formatAmount(item.selfBurden)}` : '',
        item.eiEmplRate3 ? `취업률: ${item.eiEmplRate3}%` : '',
        item.address ? `훈련장소: ${item.address}` : '',
        item.grade ? `등급: ${item.grade}` : '',
        item.titleLink || `https://www.hrd.go.kr/hrdp/ti/ptiap/PTIAP0410D.do?tracseId=${item.trprId}&tracseTme=${item.trprDegr}&trainstCstId=${item.trainstCstId}`
      ].filter(Boolean).join('\n\n'),
      status: 'active',
      updated_at: new Date().toISOString()
    }))

    // 배치 upsert
    const { error: upsertError, count } = await supabase
      .from('announcements')
      .upsert(trainingsToUpsert, {
        onConflict: 'source,source_id',
        count: 'exact'
      })

    if (upsertError) {
      console.error('HRD upsert error:', upsertError.message)
      return NextResponse.json(
        { success: false, error: upsertError.message },
        { status: 500 }
      )
    }

    // 종료된 훈련과정 비활성화
    await supabase
      .from('announcements')
      .update({ status: 'expired' })
      .eq('source', 'hrd')
      .lt('application_end', todayStr)

    const duration = Date.now() - startTime

    console.log(`✅ HRD Korea 동기화 완료: ${uniqueTrainings.length}건, ${duration}ms`)

    return NextResponse.json({
      success: true,
      message: 'HRD Korea 동기화 완료',
      stats: {
        fetched: allTrainings.length,
        active: activeTrainings.length,
        unique: uniqueTrainings.length,
        upserted: count,
        pages: page,
        duration: `${duration}ms`,
        syncedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('HRD 동기화 오류:', error)
    return NextResponse.json(
      { success: false, error: '동기화 중 오류가 발생했어요.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
