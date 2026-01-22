import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// 요청 스키마
const lookupSchema = z.object({
  businessNumber: z.string().min(10, '사업자번호 10자리를 입력해 주세요'),
})

// 사업자번호 포맷팅 (하이픈 제거)
function formatBusinessNumber(input: string): string {
  return input.replace(/[^0-9]/g, '')
}

// 국세청 상태조회 API 응답 타입
interface NTSStatusResponse {
  request_cnt: number
  status_code: string
  data: Array<{
    b_no: string
    b_stt: string
    b_stt_cd: string
    tax_type: string
    tax_type_cd: string
    end_dt: string
    utcc_yn: string
    tax_type_change_dt: string
    invoice_apply_dt: string
    rbf_tax_type: string
    rbf_tax_type_cd: string
  }>
}

// 사업자 상태 코드 → 한글
function getStatusText(code: string): string {
  const statusMap: Record<string, string> = {
    '01': '계속사업자',
    '02': '휴업자',
    '03': '폐업자',
  }
  return statusMap[code] || '알 수 없음'
}

// 과세유형 코드 → 한글
function getTaxTypeText(code: string): string {
  const taxTypeMap: Record<string, string> = {
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

// 법인구분 코드 → 한글
function getCorpClsText(code: string | null): string {
  if (!code) return ''
  const corpClsMap: Record<string, string> = {
    'Y': '유가증권시장',
    'K': '코스닥',
    'N': '코넥스',
    'E': '기타',
  }
  return corpClsMap[code] || ''
}

// 지역 추출 (주소에서 시/도 추출)
function extractRegion(address: string | null): string {
  if (!address) return ''

  const regionPatterns = [
    /^(서울특별시|서울)/,
    /^(부산광역시|부산)/,
    /^(대구광역시|대구)/,
    /^(인천광역시|인천)/,
    /^(광주광역시|광주)/,
    /^(대전광역시|대전)/,
    /^(울산광역시|울산)/,
    /^(세종특별자치시|세종)/,
    /^(경기도|경기)/,
    /^(강원도|강원특별자치도|강원)/,
    /^(충청북도|충북)/,
    /^(충청남도|충남)/,
    /^(전라북도|전북특별자치도|전북)/,
    /^(전라남도|전남)/,
    /^(경상북도|경북)/,
    /^(경상남도|경남)/,
    /^(제주특별자치도|제주)/,
  ]

  const regionMap: Record<string, string> = {
    '서울특별시': '서울특별시',
    '서울': '서울특별시',
    '부산광역시': '부산광역시',
    '부산': '부산광역시',
    '대구광역시': '대구광역시',
    '대구': '대구광역시',
    '인천광역시': '인천광역시',
    '인천': '인천광역시',
    '광주광역시': '광주광역시',
    '광주': '광주광역시',
    '대전광역시': '대전광역시',
    '대전': '대전광역시',
    '울산광역시': '울산광역시',
    '울산': '울산광역시',
    '세종특별자치시': '세종특별자치시',
    '세종': '세종특별자치시',
    '경기도': '경기도',
    '경기': '경기도',
    '강원도': '강원도',
    '강원특별자치도': '강원도',
    '강원': '강원도',
    '충청북도': '충청북도',
    '충북': '충청북도',
    '충청남도': '충청남도',
    '충남': '충청남도',
    '전라북도': '전라북도',
    '전북특별자치도': '전라북도',
    '전북': '전라북도',
    '전라남도': '전라남도',
    '전남': '전라남도',
    '경상북도': '경상북도',
    '경북': '경상북도',
    '경상남도': '경상남도',
    '경남': '경상남도',
    '제주특별자치도': '제주특별자치도',
    '제주': '제주특별자치도',
  }

  for (const pattern of regionPatterns) {
    const match = address.match(pattern)
    if (match && match[1]) {
      return regionMap[match[1]] || match[1]
    }
  }

  return ''
}

// 직원수 범위 텍스트 변환
function getEmployeeRange(count: number): string {
  if (count < 5) return '1-4명'
  if (count < 10) return '5-9명'
  if (count < 20) return '10-19명'
  if (count < 50) return '20-49명'
  if (count < 100) return '50-99명'
  if (count < 300) return '100-299명'
  return '300명 이상'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 요청 검증
    const validationResult = lookupSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const businessNumber = formatBusinessNumber(validationResult.data.businessNumber)

    if (businessNumber.length !== 10) {
      return NextResponse.json(
        { success: false, error: '사업자번호는 10자리여야 해요' },
        { status: 400 }
      )
    }

    // Supabase 클라이언트 (서비스 롤)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. 국민연금 데이터에서 사업장 정보 조회 (사업자번호 기반)
    const { data: npsData } = await supabase
      .from('nps_business_registry')
      .select('*')
      .eq('business_number', businessNumber)
      .single()

    // 2. DART 기업 데이터에서 조회 (회사명 기반)
    let dartData = null
    if (npsData?.company_name) {
      const { data } = await supabase
        .from('dart_companies')
        .select('*')
        .eq('corp_name', npsData.company_name)
        .single()
      dartData = data
    }

    // 3. 국세청 상태조회 API 호출
    const ntsApiKey = process.env.NTS_API_KEY
    let ntsData: NTSStatusResponse['data'][0] | null = null

    if (ntsApiKey) {
      try {
        const ntsResponse = await fetch(
          `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${encodeURIComponent(ntsApiKey)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              b_no: [businessNumber],
            }),
          }
        )

        if (ntsResponse.ok) {
          const ntsResult: NTSStatusResponse = await ntsResponse.json()
          if (ntsResult.status_code === 'OK' && ntsResult.data?.length > 0) {
            ntsData = ntsResult.data[0]
          }
        }
      } catch (ntsError) {
        console.error('NTS API error:', ntsError)
        // 국세청 API 실패해도 계속 진행
      }
    }

    // 모든 데이터 소스에서 정보를 찾지 못한 경우
    if (!npsData && !dartData && (!ntsData || ntsData.tax_type?.includes('등록되지 않은'))) {
      return NextResponse.json({
        success: false,
        error: '등록되지 않은 사업자번호예요',
        data: {
          businessNumber,
          found: false,
        },
      })
    }

    // 국세청에서 미등록이지만 NPS/DART에는 있는 경우
    const isNtsRegistered = ntsData && !ntsData.tax_type?.includes('등록되지 않은')

    // 데이터 소스 기록
    const sources: string[] = []
    if (npsData) sources.push('nps')
    if (dartData) sources.push('dart')
    if (isNtsRegistered) sources.push('nts')

    // 응답 데이터 구성 (NPS 우선, DART 보완, NTS 상태 추가)
    const responseData: Record<string, any> = {
      businessNumber,
      found: true,
      sources,
    }

    // 국민연금 데이터 (회사명, 주소, 직원수)
    if (npsData) {
      responseData.companyName = npsData.company_name
      responseData.address = npsData.address
      responseData.location = npsData.location || extractRegion(npsData.address)
      responseData.employeeCount = npsData.employee_count
      responseData.employeeRange = getEmployeeRange(npsData.employee_count)
      responseData.subscriberCount = npsData.employee_count
    }

    // DART 데이터로 보완 (대표자, 설립일, 상장정보 등)
    if (dartData) {
      if (!responseData.companyName) {
        responseData.companyName = dartData.corp_name
      }
      responseData.companyNameEng = dartData.corp_name_eng || null
      responseData.ceoName = dartData.ceo_name || null
      if (!responseData.address) {
        responseData.address = dartData.corp_address || null
        responseData.location = extractRegion(dartData.corp_address)
      }
      responseData.homepage = dartData.homepage || null
      responseData.phone = dartData.phone_number || null
      responseData.industryCode = dartData.industry_code || null
      responseData.establishedDate = dartData.established_date || null
      responseData.stockCode = dartData.stock_code || null
      responseData.corpCls = getCorpClsText(dartData.stock_market)
    }

    // 국세청 데이터 추가 (사업자 상태, 과세유형)
    if (isNtsRegistered && ntsData) {
      responseData.ntsStatus = getStatusText(ntsData.b_stt_cd)
      responseData.ntsStatusCode = ntsData.b_stt_cd
      responseData.taxType = getTaxTypeText(ntsData.tax_type_cd)
      responseData.taxTypeCode = ntsData.tax_type_cd
      responseData.closedDate = ntsData.end_dt || null
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    })
  } catch (error) {
    console.error('Business lookup error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했어요' },
      { status: 500 }
    )
  }
}
