// 국세청 사업자등록정보 조회 소스

import type { NTSResult, NTSBusinessStatus, NTSTaxType } from '../types'

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

// 사업자번호 포맷팅 (하이픈 제거)
export function formatBusinessNumber(input: string): string {
  return input.replace(/[^0-9]/g, '')
}

// 사업자번호 유효성 검사
export function isValidBusinessNumber(businessNumber: string): boolean {
  const formatted = formatBusinessNumber(businessNumber)
  if (formatted.length !== 10) return false

  // 체크섬 검증 (한국 사업자등록번호 검증 알고리즘)
  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5]
  let sum = 0

  for (let i = 0; i < 9; i++) {
    sum += parseInt(formatted[i]) * weights[i]
  }

  sum += Math.floor((parseInt(formatted[8]) * 5) / 10)
  const checkDigit = (10 - (sum % 10)) % 10

  return checkDigit === parseInt(formatted[9])
}

// 사업자 상태 코드 → 한글
export function getStatusText(code: string): NTSBusinessStatus {
  const statusMap: Record<string, NTSBusinessStatus> = {
    '01': '계속사업자',
    '02': '휴업자',
    '03': '폐업자',
  }
  return statusMap[code] || '알 수 없음'
}

// 과세유형 코드 → 한글
export function getTaxTypeText(code: string): NTSTaxType {
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

// 국세청 사업자 상태 조회
export async function lookupFromNTS(
  businessNumber: string,
  apiKey?: string
): Promise<NTSResult | null> {
  const key = apiKey || process.env.NTS_API_KEY
  if (!key) {
    console.warn('NTS API key not configured')
    return null
  }

  const formatted = formatBusinessNumber(businessNumber)
  if (formatted.length !== 10) {
    return null
  }

  try {
    const response = await fetch(
      `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          b_no: [formatted],
        }),
      }
    )

    if (!response.ok) {
      console.error('NTS API error:', response.status)
      return null
    }

    const result: NTSStatusResponse = await response.json()

    if (result.status_code !== 'OK' || !result.data || result.data.length === 0) {
      return null
    }

    const data = result.data[0]

    // 등록되지 않은 사업자
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
  } catch (error) {
    console.error('NTS lookup error:', error)
    return null
  }
}
