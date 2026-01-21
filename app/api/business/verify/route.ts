import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// 사업자번호 상태조회 스키마
const statusSchema = z.object({
  businessNumber: z.string().min(10, '사업자번호 10자리를 입력해 주세요'),
})

// 사업자번호 진위확인 스키마
const validateSchema = z.object({
  businessNumber: z.string().min(10, '사업자번호 10자리를 입력해 주세요'),
  companyName: z.string().min(1, '상호명을 입력해 주세요'),
  representativeName: z.string().optional(),
  startDate: z.string().optional(), // YYYYMMDD 또는 YYYY-MM-DD
})

// 국세청 상태조회 API 응답 타입
interface NTSStatusResponse {
  request_cnt: number
  status_code: string
  data: Array<{
    b_no: string           // 사업자번호
    b_stt: string          // 납세자상태 (계속사업자, 휴업자, 폐업자)
    b_stt_cd: string       // 납세자상태코드 (01: 계속, 02: 휴업, 03: 폐업)
    tax_type: string       // 과세유형 메시지
    tax_type_cd: string    // 과세유형코드 (01: 일반, 02: 간이, 03: 면세 등)
    end_dt: string         // 폐업일
    utcc_yn: string        // 단위과세전환폐업여부
    tax_type_change_dt: string  // 과세유형전환일자
    invoice_apply_dt: string    // 세금계산서적용일자
    rbf_tax_type: string        // 직전과세유형 메시지
    rbf_tax_type_cd: string     // 직전과세유형코드
  }>
}

// 국세청 진위확인 API 응답 타입
interface NTSValidateResponse {
  request_cnt: number
  status_code: string
  data: Array<{
    b_no: string           // 사업자번호
    valid: string          // 01: 일치, 02: 불일치
    valid_msg: string      // 확인 결과 메시지
    request_param: {
      b_no: string
      start_dt: string
      p_nm: string
      p_nm2: string
      b_nm: string
      corp_no: string
      b_sector: string
      b_type: string
      b_adr: string
    }
    status: {
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
    }
  }>
}

// 사업자번호 포맷팅 (하이픈 제거)
function formatBusinessNumber(input: string): string {
  return input.replace(/[^0-9]/g, '')
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 국세청 API 키 확인
    const apiKey = process.env.NTS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: '국세청 API 키가 설정되지 않았어요' },
        { status: 500 }
      )
    }

    // companyName이 있으면 진위확인, 없으면 상태조회
    if (body.companyName) {
      return handleValidate(body, apiKey)
    } else {
      return handleStatus(body, apiKey)
    }
  } catch (error) {
    console.error('Business verify error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했어요' },
      { status: 500 }
    )
  }
}

// 상태조회 처리
async function handleStatus(body: any, apiKey: string) {
  const validationResult = statusSchema.safeParse(body)

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

  // 국세청 사업자등록상태 조회 API 호출
  const response = await fetch(
    `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${encodeURIComponent(apiKey)}`,
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

  const responseText = await response.text()

  if (!response.ok) {
    console.error('NTS API error:', response.status, responseText)
    // 더 상세한 에러 메시지 제공
    let errorMessage = '국세청 API 호출에 실패했어요'
    if (response.status === 401 || response.status === 403) {
      errorMessage = 'API 인증에 실패했어요. 관리자에게 문의해 주세요.'
    } else if (response.status === 400) {
      errorMessage = '잘못된 요청이에요. 입력 정보를 확인해 주세요.'
    } else if (response.status === 429) {
      errorMessage = '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.'
    }
    return NextResponse.json(
      { success: false, error: errorMessage, detail: `Status: ${response.status}` },
      { status: 500 }
    )
  }

  let result: NTSStatusResponse
  try {
    result = JSON.parse(responseText)
  } catch (parseError) {
    console.error('NTS API parse error:', parseError)
    return NextResponse.json(
      { success: false, error: '국세청 API 응답 파싱에 실패했어요' },
      { status: 500 }
    )
  }

  if (result.status_code !== 'OK' || !result.data || result.data.length === 0) {
    return NextResponse.json(
      { success: false, error: '사업자 정보를 조회할 수 없어요' },
      { status: 404 }
    )
  }

  const businessData = result.data[0]

  if (businessData.tax_type.includes('등록되지 않은')) {
    return NextResponse.json({
      success: false,
      error: '국세청에 등록되지 않은 사업자번호예요',
      data: {
        businessNumber: businessData.b_no,
        isValid: false,
      },
    })
  }

  return NextResponse.json({
    success: true,
    data: {
      businessNumber: businessData.b_no,
      isValid: true,
      status: getStatusText(businessData.b_stt_cd),
      statusCode: businessData.b_stt_cd,
      taxType: getTaxTypeText(businessData.tax_type_cd),
      taxTypeCode: businessData.tax_type_cd,
      closedDate: businessData.end_dt || null,
      taxTypeChangeDate: businessData.tax_type_change_dt || null,
    },
  })
}

// 진위확인 처리
async function handleValidate(body: any, apiKey: string) {
  const validationResult = validateSchema.safeParse(body)

  if (!validationResult.success) {
    return NextResponse.json(
      { success: false, error: validationResult.error.issues[0].message },
      { status: 400 }
    )
  }

  const { businessNumber, companyName, representativeName, startDate } = validationResult.data
  const formattedBizNum = formatBusinessNumber(businessNumber)

  if (formattedBizNum.length !== 10) {
    return NextResponse.json(
      { success: false, error: '사업자번호는 10자리여야 해요' },
      { status: 400 }
    )
  }

  // 날짜 형식 변환 (YYYY-MM-DD → YYYYMMDD)
  const formattedStartDate = startDate ? startDate.replace(/-/g, '') : ''

  // 국세청 진위확인 API 호출
  const response = await fetch(
    `https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        businesses: [{
          b_no: formattedBizNum,
          start_dt: formattedStartDate,
          p_nm: representativeName || '',
          p_nm2: '',
          b_nm: companyName,
          corp_no: '',
          b_sector: '',
          b_type: '',
          b_adr: '',
        }],
      }),
    }
  )

  const responseText = await response.text()

  if (!response.ok) {
    console.error('NTS Validate API error:', response.status, responseText)
    // 더 상세한 에러 메시지 제공
    let errorMessage = '국세청 API 호출에 실패했어요'
    if (response.status === 401 || response.status === 403) {
      errorMessage = 'API 인증에 실패했어요. 관리자에게 문의해 주세요.'
    } else if (response.status === 400) {
      errorMessage = '잘못된 요청이에요. 입력 정보를 확인해 주세요.'
    } else if (response.status === 429) {
      errorMessage = '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.'
    }
    return NextResponse.json(
      { success: false, error: errorMessage, detail: `Status: ${response.status}` },
      { status: 500 }
    )
  }

  let result: NTSValidateResponse
  try {
    result = JSON.parse(responseText)
  } catch (parseError) {
    console.error('NTS Validate API parse error:', parseError)
    return NextResponse.json(
      { success: false, error: '국세청 API 응답 파싱에 실패했어요' },
      { status: 500 }
    )
  }

  if (result.status_code !== 'OK' || !result.data || result.data.length === 0) {
    return NextResponse.json(
      { success: false, error: '사업자 정보를 확인할 수 없어요' },
      { status: 404 }
    )
  }

  const validateData = result.data[0]
  const isMatched = validateData.valid === '01'
  const statusData = validateData.status

  return NextResponse.json({
    success: true,
    data: {
      businessNumber: formattedBizNum,
      companyName: companyName,
      isValid: true,
      isMatched: isMatched,
      matchMessage: validateData.valid_msg,
      status: statusData ? getStatusText(statusData.b_stt_cd) : null,
      statusCode: statusData?.b_stt_cd || null,
      taxType: statusData ? getTaxTypeText(statusData.tax_type_cd) : null,
      taxTypeCode: statusData?.tax_type_cd || null,
    },
  })
}
