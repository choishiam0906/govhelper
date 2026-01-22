// 통합 기업정보 조회 시스템

import type {
  BusinessDataSource,
  BusinessLookupOptions,
  BusinessLookupResult,
  UnifiedBusinessInfo,
  NTSResult,
  NPSResult,
  DARTResult,
} from './types'

import {
  lookupFromNTS,
  isValidBusinessNumber,
  formatBusinessNumber,
} from './sources/nts'
import { lookupFromNPS, searchNPSByCompanyName } from './sources/nps'
import {
  lookupFromDARTByName,
  searchDARTByCompanyName,
} from './sources/dart'

// 기본 옵션
const DEFAULT_OPTIONS: BusinessLookupOptions = {
  sources: ['nts', 'nps', 'dart'],
  timeout: 10000,
  useCache: true,
}

/**
 * 사업자번호로 통합 기업정보 조회
 *
 * @param businessNumber - 사업자등록번호 (10자리, 하이픈 포함 가능)
 * @param options - 조회 옵션
 * @returns 통합 기업정보 결과
 *
 * @example
 * const result = await lookupBusiness('123-45-67890')
 * if (result.success) {
 *   console.log(result.data.companyName)
 * }
 */
export async function lookupBusiness(
  businessNumber: string,
  options?: Partial<BusinessLookupOptions>
): Promise<BusinessLookupResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const formatted = formatBusinessNumber(businessNumber)

  // 사업자번호 유효성 검사
  if (!isValidBusinessNumber(businessNumber)) {
    return {
      success: false,
      data: null,
      error: '유효하지 않은 사업자등록번호입니다.',
    }
  }

  const partialResults: {
    nts?: NTSResult | null
    nps?: NPSResult | null
    dart?: DARTResult | null
  } = {}

  // 병렬 조회 실행
  const promises: Promise<void>[] = []

  if (opts.sources?.includes('nts')) {
    promises.push(
      lookupFromNTS(formatted).then((result) => {
        partialResults.nts = result
      })
    )
  }

  if (opts.sources?.includes('nps')) {
    promises.push(
      lookupFromNPS(formatted).then((result) => {
        partialResults.nps = result
      })
    )
  }

  // 타임아웃 처리
  try {
    await Promise.race([
      Promise.all(promises),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('조회 시간이 초과되었습니다.')), opts.timeout)
      ),
    ])
  } catch (error) {
    console.error('Business lookup timeout or error:', error)
  }

  // DART는 회사명 기반 검색이므로 NPS에서 회사명을 가져온 후 조회
  if (opts.sources?.includes('dart') && partialResults.nps?.companyName) {
    try {
      const dartResult = await lookupFromDARTByName(partialResults.nps.companyName)
      partialResults.dart = dartResult
    } catch (error) {
      console.error('DART lookup error:', error)
    }
  }

  // 결과 통합
  const unifiedInfo = mergeResults(formatted, partialResults)

  if (!unifiedInfo) {
    return {
      success: false,
      data: null,
      error: '기업 정보를 찾을 수 없습니다.',
      partialResults,
    }
  }

  return {
    success: true,
    data: unifiedInfo,
    partialResults,
  }
}

/**
 * 회사명으로 기업정보 검색
 *
 * @param companyName - 검색할 회사명
 * @param limit - 최대 결과 수
 * @returns 검색된 기업 목록
 */
export async function searchBusinessByName(
  companyName: string,
  limit: number = 10
): Promise<UnifiedBusinessInfo[]> {
  if (!companyName || companyName.trim().length < 2) {
    return []
  }

  // NPS와 DART에서 병렬 검색
  const [npsResults, dartResults] = await Promise.all([
    searchNPSByCompanyName(companyName, limit),
    searchDARTByCompanyName(companyName, limit),
  ])

  // 결과 통합 (NPS 기준으로 DART 정보 매칭)
  const results: UnifiedBusinessInfo[] = []

  for (const nps of npsResults) {
    const matchingDart = dartResults.find(
      (dart) =>
        dart.corpName === nps.companyName ||
        dart.corpName.includes(nps.companyName) ||
        nps.companyName.includes(dart.corpName)
    )

    results.push(
      mergeResults(nps.businessNumber, { nps, dart: matchingDart }) ||
        createBasicInfo(nps)
    )
  }

  // NPS에 없는 DART 결과 추가
  for (const dart of dartResults) {
    const alreadyIncluded = results.some(
      (r) =>
        r.companyName === dart.corpName ||
        r.companyName.includes(dart.corpName)
    )

    if (!alreadyIncluded) {
      results.push(createFromDart(dart))
    }
  }

  return results.slice(0, limit)
}

/**
 * 사업자번호 유효성만 검사
 */
export { isValidBusinessNumber, formatBusinessNumber }

/**
 * 개별 소스 조회 함수 내보내기
 */
export { lookupFromNTS } from './sources/nts'
export { lookupFromNPS, searchNPSByCompanyName } from './sources/nps'
export {
  lookupFromDARTByName,
  searchDARTByCompanyName,
  lookupFromDARTByCorpCode,
} from './sources/dart'

// ===== 내부 헬퍼 함수 =====

/**
 * 여러 소스의 결과를 통합
 */
function mergeResults(
  businessNumber: string,
  partialResults: {
    nts?: NTSResult | null
    nps?: NPSResult | null
    dart?: DARTResult | null
  }
): UnifiedBusinessInfo | null {
  const { nts, nps, dart } = partialResults

  // 최소한 하나의 소스에서 결과가 있어야 함
  if (!nts && !nps && !dart) {
    return null
  }

  const sources: BusinessDataSource[] = []
  if (nts) sources.push('nts')
  if (nps) sources.push('nps')
  if (dart) sources.push('dart')

  // 우선순위: NPS(회사명, 주소) > DART(상세정보) > NTS(사업자상태)
  return {
    // 기본 정보
    businessNumber: formatBusinessNumber(businessNumber),
    companyName: nps?.companyName || dart?.corpName || '',
    companyNameEng: dart?.corpNameEng || null,
    ceoName: dart?.ceoName || null,

    // 위치 정보
    address: nps?.address || dart?.address || null,
    location: nps?.location || extractLocation(nps?.address || dart?.address) || '',

    // 사업 정보
    industryCode: dart?.industryCode || null,
    employeeCount: nps?.employeeCount || null,
    establishedDate: dart?.establishedDate || null,

    // 연락처
    homepage: dart?.homepage || null,
    phone: dart?.phone || null,

    // 국세청 정보
    ntsStatus: nts?.status || null,
    ntsStatusCode: nts?.statusCode || null,
    taxType: nts?.taxType || null,
    taxTypeCode: nts?.taxTypeCode || null,
    closedDate: nts?.closedDate || null,

    // 상장 정보 (DART)
    stockCode: dart?.stockCode || null,
    stockMarket: dart?.stockMarket || '',

    // 메타 정보
    sources,
    foundAt: new Date().toISOString(),
  }
}

/**
 * NPS 결과만으로 기본 정보 생성
 */
function createBasicInfo(nps: NPSResult): UnifiedBusinessInfo {
  return {
    businessNumber: nps.businessNumber,
    companyName: nps.companyName,
    companyNameEng: null,
    ceoName: null,
    address: nps.address,
    location: nps.location,
    industryCode: null,
    employeeCount: nps.employeeCount,
    establishedDate: null,
    homepage: null,
    phone: null,
    ntsStatus: null,
    ntsStatusCode: null,
    taxType: null,
    taxTypeCode: null,
    closedDate: null,
    stockCode: null,
    stockMarket: '',
    sources: ['nps'],
    foundAt: new Date().toISOString(),
  }
}

/**
 * DART 결과만으로 정보 생성
 */
function createFromDart(dart: DARTResult): UnifiedBusinessInfo {
  return {
    businessNumber: '',
    companyName: dart.corpName,
    companyNameEng: dart.corpNameEng,
    ceoName: dart.ceoName,
    address: dart.address,
    location: extractLocation(dart.address),
    industryCode: dart.industryCode,
    employeeCount: null,
    establishedDate: dart.establishedDate,
    homepage: dart.homepage,
    phone: dart.phone,
    ntsStatus: null,
    ntsStatusCode: null,
    taxType: null,
    taxTypeCode: null,
    closedDate: null,
    stockCode: dart.stockCode,
    stockMarket: dart.stockMarket,
    sources: ['dart'],
    foundAt: new Date().toISOString(),
  }
}

/**
 * 주소에서 시/도 추출
 */
function extractLocation(address: string | null | undefined): string {
  if (!address) return ''

  const patterns = [
    '서울특별시',
    '서울',
    '부산광역시',
    '부산',
    '대구광역시',
    '대구',
    '인천광역시',
    '인천',
    '광주광역시',
    '광주',
    '대전광역시',
    '대전',
    '울산광역시',
    '울산',
    '세종특별자치시',
    '세종',
    '경기도',
    '경기',
    '강원도',
    '강원',
    '충청북도',
    '충북',
    '충청남도',
    '충남',
    '전라북도',
    '전북',
    '전라남도',
    '전남',
    '경상북도',
    '경북',
    '경상남도',
    '경남',
    '제주특별자치도',
    '제주',
  ]

  for (const pattern of patterns) {
    if (address.includes(pattern)) {
      // 정식 명칭으로 반환
      if (pattern === '서울') return '서울특별시'
      if (pattern === '부산') return '부산광역시'
      if (pattern === '대구') return '대구광역시'
      if (pattern === '인천') return '인천광역시'
      if (pattern === '광주') return '광주광역시'
      if (pattern === '대전') return '대전광역시'
      if (pattern === '울산') return '울산광역시'
      if (pattern === '세종') return '세종특별자치시'
      if (pattern === '경기') return '경기도'
      if (pattern === '강원') return '강원도'
      if (pattern === '충북') return '충청북도'
      if (pattern === '충남') return '충청남도'
      if (pattern === '전북') return '전라북도'
      if (pattern === '전남') return '전라남도'
      if (pattern === '경북') return '경상북도'
      if (pattern === '경남') return '경상남도'
      if (pattern === '제주') return '제주특별자치도'
      return pattern
    }
  }

  return ''
}
