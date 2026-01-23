const fs = require('fs');
const path = require('path');

const typesPath = path.join(__dirname, '..', 'lib', 'business', 'types.ts');

const newContent = `// 통합 기업정보 조회 시스템 타입 정의

// 데이터 소스 타입
export type BusinessDataSource = 'nts' | 'nps' | 'dart' | 'ksic'

// 기업규모 타입 (중소기업기본법 기준)
export type CompanySizeType = '소기업' | '중기업' | '중소기업' | '중견기업' | '대기업' | '알 수 없음'

// 법인형태 타입
export type CorporationType =
  | '주식회사'
  | '유한회사'
  | '유한책임회사'
  | '합명회사'
  | '합자회사'
  | '개인사업자'
  | '비영리법인'
  | '외국법인'
  | '기타'
  | '알 수 없음'

// 국세청 사업자 상태
export type NTSBusinessStatus = '계속사업자' | '휴업자' | '폐업자' | '알 수 없음'

// 국세청 과세유형
export type NTSTaxType =
  | '부가가치세 일반과세자'
  | '부가가치세 간이과세자'
  | '부가가치세 면세사업자'
  | '비영리법인 또는 국가기관'
  | '수익사업을 영위하지 않는 비영리법인'
  | '고유번호가 부여된 단체'
  | '부가가치세 간이과세자(세금계산서 발급사업자)'
  | '알 수 없음'

// 상장 구분
export type StockMarketType = '유가증권시장' | '코스닥' | '코넥스' | '비상장' | ''

// 국세청 조회 결과
export interface NTSResult {
  source: 'nts'
  businessNumber: string
  isValid: boolean
  status: NTSBusinessStatus
  statusCode: string
  taxType: NTSTaxType
  taxTypeCode: string
  closedDate: string | null
  taxTypeChangeDate: string | null
}

// 국민연금 조회 결과
export interface NPSResult {
  source: 'nps'
  businessNumber: string
  companyName: string
  address: string
  location: string
  employeeCount: number
}

// DART 조회 결과
export interface DARTResult {
  source: 'dart'
  corpCode: string
  corpName: string
  corpNameEng: string | null
  stockCode: string | null
  stockMarket: StockMarketType
  ceoName: string | null
  address: string | null
  homepage: string | null
  phone: string | null
  fax: string | null
  industryCode: string | null
  establishedDate: string | null
  accountingMonth: string | null
}

// KSIC 조회 결과
export interface KSICResult {
  source: 'ksic'
  industryCode: string
  businessType: string      // 업태 (대분류) - 예: 정보통신업
  industryName: string      // 종목 (세세분류) - 예: 응용 소프트웨어 개발 및 공급업
  industryMajor: string     // 대분류명
  industryMiddle: string    // 중분류명
  industrySmall: string     // 소분류명
}

// 통합 기업정보 (확장)
export interface UnifiedBusinessInfo {
  // 기본 정보
  businessNumber: string
  companyName: string
  companyNameEng: string | null
  ceoName: string | null

  // 위치 정보
  address: string | null
  location: string // 시/도 (예: 서울특별시)

  // 사업 정보
  industryCode: string | null
  employeeCount: number | null
  establishedDate: string | null

  // 확장 필드 (KSIC 기반)
  businessType: string | null       // 업태 (대분류) - 예: 정보통신업
  industryName: string | null       // 종목 (세세분류) - 예: 응용 소프트웨어 개발 및 공급업
  companySize: CompanySizeType      // 기업규모 - 직원수 기반 추정
  corporationType: CorporationType  // 법인형태 - 회사명에서 추출

  // 연락처
  homepage: string | null
  phone: string | null

  // 국세청 정보
  ntsStatus: NTSBusinessStatus | null
  ntsStatusCode: string | null
  taxType: NTSTaxType | null
  taxTypeCode: string | null
  closedDate: string | null

  // 상장 정보 (DART)
  stockCode: string | null
  stockMarket: StockMarketType

  // 메타 정보
  sources: BusinessDataSource[]
  foundAt: string // ISO timestamp
}

// 조회 옵션
export interface BusinessLookupOptions {
  // 사용할 데이터 소스 (기본: 모두)
  sources?: BusinessDataSource[]
  // 타임아웃 (ms)
  timeout?: number
  // 캐시 사용 여부
  useCache?: boolean
  // KSIC 변환 사용 여부 (기본: true)
  enrichWithKSIC?: boolean
}

// 조회 결과
export interface BusinessLookupResult {
  success: boolean
  data: UnifiedBusinessInfo | null
  error?: string
  partialResults?: {
    nts?: NTSResult | null
    nps?: NPSResult | null
    dart?: DARTResult | null
    ksic?: KSICResult | null
  }
}

// API 요청 타입
export interface BusinessLookupRequest {
  businessNumber: string
  options?: BusinessLookupOptions
}

// API 응답 타입
export interface BusinessLookupResponse {
  success: boolean
  data?: UnifiedBusinessInfo
  error?: string
  sources?: BusinessDataSource[]
}
`;

fs.writeFileSync(typesPath, newContent, 'utf8');
console.log('types.ts 파일이 업데이트되었습니다.');
