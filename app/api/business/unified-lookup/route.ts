import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  BusinessLookupOptions,
  BusinessLookupResult,
  UnifiedBusinessInfo,
  BusinessDataSource,
  NTSResult,
  NPSResult,
  DARTResult,
  NTSBusinessStatus,
  NTSTaxType,
  StockMarketType,
} from '@/lib/business/types'

// 사업자번호 포맷팅
function formatBusinessNumber(input: string): string {
  return input.replace(/[^0-9]/g, '')
}

// 사업자번호 유효성 검사
function isValidBusinessNumber(businessNumber: string): boolean {
  const formatted = formatBusinessNumber(businessNumber)
  if (formatted.length !== 10) return false

  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5]
  let sum = 0

  for (let i = 0; i < 9; i++) {
    sum += parseInt(formatted[i]) * weights[i]
  }

  sum += Math.floor((parseInt(formatted[8]) * 5) / 10)
  const checkDigit = (10 - (sum % 10)) % 10

  return checkDigit === parseInt(formatted[9])
}

// 국세청 상태 텍스트
function getStatusText(code: string): NTSBusinessStatus {
  const statusMap: Record<string, NTSBusinessStatus> = {
    '01': '계속사업자',
    '02': '휴업자',
    '03': '폐업자',
  }
  return statusMap[code] || '알 수 없음'
}

// 과세유형 텍스트
function getTaxTypeText(code: string): NTSTaxType {
  const taxTypeMap: Record<string, NTSTaxType> = {
    '01': '부가가치세 일반과세자',
    '02': '부가가치세 간이과세자',
    '03': '부가가치세 면세사업자',
    '04': '비영리법인 또는 국가기관',
    '05': '수익사업을 영위하지 않는 비영리법인',
    '06': '고유번호가 부여된 단체',
    '07': '부가가치세 간이과세자(세금계산서 발급사업자)',
  }
  return taxTypeMap[code] || '알 수 없음'
}

// 상장 시장 변환
function mapStockMarket(market: string | null): StockMarketType {
  if (!market) return ''
  const marketMap: Record<string, StockMarketType> = {
    Y: '유가증권시장',
    K: '코스닥',
    N: '코넥스',
  }
  return marketMap[market] || '비상장'
}

// 주소에서 시/도 추출
function extractLocation(address: string | null | undefined): string {
  if (!address) return ''

  const patterns = [
    { short: '서울', full: '서울특별시' },
    { short: '부산', full: '부산광역시' },
    { short: '대구', full: '대구광역시' },
    { short: '인천', full: '인천광역시' },
    { short: '광주', full: '광주광역시' },
    { short: '대전', full: '대전광역시' },
    { short: '울산', full: '울산광역시' },
    { short: '세종', full: '세종특별자치시' },
    { short: '경기', full: '경기도' },
    { short: '강원', full: '강원도' },
    { short: '충북', full: '충청북도' },
    { short: '충남', full: '충청남도' },
    { short: '전북', full: '전라북도' },
    { short: '전남', full: '전라남도' },
    { short: '경북', full: '경상북도' },
    { short: '경남', full: '경상남도' },
    { short: '제주', full: '제주특별자치도' },
  ]

  for (const { short, full } of patterns) {
    if (address.includes(full) || address.includes(short)) {
      return full
    }
  }

  return ''
}

// 국세청 API 조회
async function lookupFromNTS(businessNumber: string): Promise<NTSResult | null> {
  const key = process.env.NTS_API_KEY
  if (!key) return null

  const formatted = formatBusinessNumber(businessNumber)

  try {
    const response = await fetch(
      `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ b_no: [formatted] }),
      }
    )

    if (!response.ok) return null

    const result = await response.json()

    if (result.status_code !== 'OK' || !result.data?.length) {
      return null
    }

    const data = result.data[0]

    if (data.tax_type?.includes('등록되지 않은')) {
      return {
        source: 'nts',
        businessNumber: formatted,
        isValid: false,
        status: '알 수 없음',
        statusCode: '',
        taxType: '알 수 없음',
        taxTypeCode: '',
        closedDate: null,
        taxTypeChangeDate: null,
      }
    }

    return {
      source: 'nts',
      businessNumber: formatted,
      isValid: true,
      status: getStatusText(data.b_stt_cd),
      statusCode: data.b_stt_cd,
      taxType: getTaxTypeText(data.tax_type_cd),
      taxTypeCode: data.tax_type_cd,
      closedDate: data.end_dt || null,
      taxTypeChangeDate: data.tax_type_change_dt || null,
    }
  } catch {
    return null
  }
}

// NPS 테이블 타입
interface NPSCompanyRow {
  business_number: string
  company_name: string
  address: string
  location: string
  employee_count: number
}

// 국민연금 조회
async function lookupFromNPS(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessNumber: string
): Promise<NPSResult | null> {
  const { data, error } = await supabase
    .from('nps_business_registry')
    .select('*')
    .eq('business_number', formatBusinessNumber(businessNumber))
    .single()

  if (error || !data) return null

  const row = data as NPSCompanyRow

  return {
    source: 'nps',
    businessNumber: row.business_number,
    companyName: row.company_name,
    address: row.address,
    location: row.location,
    employeeCount: row.employee_count,
  }
}

// DART 테이블 타입
interface DARTCompanyRow {
  corp_code: string
  corp_name: string
  corp_name_eng: string | null
  stock_code: string | null
  stock_market: string | null
  ceo_name: string | null
  corp_address: string | null
  homepage: string | null
  phone_number: string | null
  fax_number: string | null
  industry_code: string | null
  established_date: string | null
  accounting_month: string | null
}

// DART 조회 (회사명 기반)
async function lookupFromDART(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyName: string
): Promise<DARTResult | null> {
  const { data, error } = await supabase
    .from('dart_companies')
    .select('*')
    .eq('corp_name', companyName)
    .single()

  if (error || !data) return null

  const row = data as DARTCompanyRow

  return {
    source: 'dart',
    corpCode: row.corp_code,
    corpName: row.corp_name,
    corpNameEng: row.corp_name_eng,
    stockCode: row.stock_code,
    stockMarket: mapStockMarket(row.stock_market),
    ceoName: row.ceo_name,
    address: row.corp_address,
    homepage: row.homepage,
    phone: row.phone_number,
    fax: row.fax_number,
    industryCode: row.industry_code,
    establishedDate: row.established_date,
    accountingMonth: row.accounting_month,
  }
}

// 결과 통합
function mergeResults(
  businessNumber: string,
  partialResults: {
    nts?: NTSResult | null
    nps?: NPSResult | null
    dart?: DARTResult | null
  }
): UnifiedBusinessInfo | null {
  const { nts, nps, dart } = partialResults

  if (!nts && !nps && !dart) return null

  const sources: BusinessDataSource[] = []
  if (nts) sources.push('nts')
  if (nps) sources.push('nps')
  if (dart) sources.push('dart')

  return {
    businessNumber: formatBusinessNumber(businessNumber),
    companyName: nps?.companyName || dart?.corpName || '',
    companyNameEng: dart?.corpNameEng || null,
    ceoName: dart?.ceoName || null,
    address: nps?.address || dart?.address || null,
    location: nps?.location || extractLocation(nps?.address || dart?.address) || '',
    industryCode: dart?.industryCode || null,
    employeeCount: nps?.employeeCount || null,
    establishedDate: dart?.establishedDate || null,
    homepage: dart?.homepage || null,
    phone: dart?.phone || null,
    ntsStatus: nts?.status || null,
    ntsStatusCode: nts?.statusCode || null,
    taxType: nts?.taxType || null,
    taxTypeCode: nts?.taxTypeCode || null,
    closedDate: nts?.closedDate || null,
    stockCode: dart?.stockCode || null,
    stockMarket: dart?.stockMarket || '',
    sources,
    foundAt: new Date().toISOString(),
  }
}

/**
 * POST /api/business/unified-lookup
 * 사업자번호로 통합 기업정보 조회
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessNumber, options } = body as {
      businessNumber: string
      options?: Partial<BusinessLookupOptions>
    }

    if (!businessNumber) {
      return NextResponse.json(
        { success: false, error: '사업자등록번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    const formatted = formatBusinessNumber(businessNumber)

    if (!isValidBusinessNumber(formatted)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 사업자등록번호입니다.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const sources = options?.sources || ['nts', 'nps', 'dart']

    const partialResults: {
      nts?: NTSResult | null
      nps?: NPSResult | null
      dart?: DARTResult | null
    } = {}

    // 병렬 조회
    const promises: Promise<void>[] = []

    if (sources.includes('nts')) {
      promises.push(
        lookupFromNTS(formatted).then((r) => {
          partialResults.nts = r
        })
      )
    }

    if (sources.includes('nps')) {
      promises.push(
        lookupFromNPS(supabase, formatted).then((r) => {
          partialResults.nps = r
        })
      )
    }

    await Promise.all(promises)

    // DART는 회사명 기반 조회
    if (sources.includes('dart') && partialResults.nps?.companyName) {
      partialResults.dart = await lookupFromDART(
        supabase,
        partialResults.nps.companyName
      )
    }

    const unified = mergeResults(formatted, partialResults)

    if (!unified) {
      const result: BusinessLookupResult = {
        success: false,
        data: null,
        error: '기업 정보를 찾을 수 없습니다.',
        partialResults,
      }
      return NextResponse.json(result)
    }

    const result: BusinessLookupResult = {
      success: true,
      data: unified,
      partialResults,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Unified lookup error:', error)
    return NextResponse.json(
      { success: false, error: '조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/business/unified-lookup?name=회사명&limit=10
 * 회사명으로 기업 검색
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const name = searchParams.get('name')
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: '검색어를 2자 이상 입력해주세요.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // NPS에서 검색
    const { data: rawNpsData } = await supabase
      .from('nps_business_registry')
      .select('*')
      .ilike('company_name', `%${name}%`)
      .limit(limit)

    // DART에서 검색
    const { data: rawDartData } = await supabase
      .from('dart_companies')
      .select('*')
      .ilike('corp_name', `%${name}%`)
      .limit(limit)

    const npsData = (rawNpsData || []) as NPSCompanyRow[]
    const dartData = (rawDartData || []) as DARTCompanyRow[]

    const results: UnifiedBusinessInfo[] = []

    // NPS 결과 처리
    for (const nps of npsData) {
      const matchingDart = dartData.find(
        (dart) =>
          dart.corp_name === nps.company_name ||
          dart.corp_name.includes(nps.company_name) ||
          nps.company_name.includes(dart.corp_name)
      )

      results.push({
        businessNumber: nps.business_number,
        companyName: nps.company_name,
        companyNameEng: matchingDart?.corp_name_eng || null,
        ceoName: matchingDart?.ceo_name || null,
        address: nps.address,
        location: nps.location,
        industryCode: matchingDart?.industry_code || null,
        employeeCount: nps.employee_count,
        establishedDate: matchingDart?.established_date || null,
        homepage: matchingDart?.homepage || null,
        phone: matchingDart?.phone_number || null,
        ntsStatus: null,
        ntsStatusCode: null,
        taxType: null,
        taxTypeCode: null,
        closedDate: null,
        stockCode: matchingDart?.stock_code || null,
        stockMarket: mapStockMarket(matchingDart?.stock_market ?? null),
        sources: matchingDart ? ['nps', 'dart'] : ['nps'],
        foundAt: new Date().toISOString(),
      })
    }

    // NPS에 없는 DART 결과 추가
    for (const dart of dartData) {
      const alreadyIncluded = results.some(
        (r) =>
          r.companyName === dart.corp_name ||
          r.companyName.includes(dart.corp_name)
      )

      if (!alreadyIncluded) {
        results.push({
          businessNumber: '',
          companyName: dart.corp_name,
          companyNameEng: dart.corp_name_eng,
          ceoName: dart.ceo_name,
          address: dart.corp_address,
          location: extractLocation(dart.corp_address),
          industryCode: dart.industry_code,
          employeeCount: null,
          establishedDate: dart.established_date,
          homepage: dart.homepage,
          phone: dart.phone_number,
          ntsStatus: null,
          ntsStatusCode: null,
          taxType: null,
          taxTypeCode: null,
          closedDate: null,
          stockCode: dart.stock_code,
          stockMarket: mapStockMarket(dart.stock_market),
          sources: ['dart'],
          foundAt: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({
      success: true,
      results: results.slice(0, limit),
      total: results.length,
    })
  } catch (error) {
    console.error('Business search error:', error)
    return NextResponse.json(
      { success: false, error: '검색 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
