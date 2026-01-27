// 통합 기업정보 조회 시스템

import type {
  BusinessDataSource,
  BusinessLookupOptions,
  BusinessLookupResult,
  UnifiedBusinessInfo,
  NTSResult,
  NPSResult,
  DARTResult,
  KSICResult,
  CompanySizeType,
  CorporationType,
} from "./types";

import {
  lookupFromNTS,
  isValidBusinessNumber,
  formatBusinessNumber,
} from "./sources/nts";
import { lookupFromNPS, searchNPSByCompanyName } from "./sources/nps";
import { lookupFromDARTByName, searchDARTByCompanyName } from "./sources/dart";
import {
  lookupFromKSIC,
  getBusinessTypeFromCode,
  getIndustryNameFromCode,
} from "./sources/ksic";
import { estimateCompanySize } from "./utils/company-size";
import { getBusinessCache, setBusinessCache } from "@/lib/cache";
import { inferCorporationType } from "./utils/corporation-type";
import { extractLocationFromAddress } from "@/lib/location";

// 기본 옵션
const DEFAULT_OPTIONS: BusinessLookupOptions = {
  sources: ["nts", "nps", "dart"],
  timeout: 10000,
  useCache: true,
  enrichWithKSIC: true,
};

/**
 * 사업자번호로 통합 기업정보 조회 (확장 버전)
 *
 * @param businessNumber - 사업자등록번호 (10자리, 하이픈 포함 가능)
 * @param options - 조회 옵션
 * @returns 통합 기업정보 결과
 *
 * 확장 필드:
 * - businessType: 업태 (대분류) - 예: 정보통신업
 * - industryName: 종목 (세세분류) - 예: 응용 소프트웨어 개발 및 공급업
 * - companySize: 기업규모 - 직원수 기반 추정
 * - corporationType: 법인형태 - 회사명에서 추출
 *
 * @example
 * const result = await lookupBusiness('123-45-67890')
 * if (result.success) {
 * }
 */
export async function lookupBusiness(
  businessNumber: string,
  options?: Partial<BusinessLookupOptions>,
): Promise<BusinessLookupResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const formatted = formatBusinessNumber(businessNumber);

  // 사업자번호 유효성 검사
  if (!isValidBusinessNumber(businessNumber)) {
    return {
      success: false,
      data: null,
      error: "유효하지 않은 사업자등록번호입니다.",
    };
  }

  // 캐시 조회 (useCache가 true인 경우)
  if (opts.useCache) {
    try {
      const cached = await getBusinessCache(formatted);
      if (cached) {
        return {
          success: true,
          data: cached,
          partialResults: {},
          fromCache: true,
        };
      }
    } catch (error) {
      // 캐시 조회 실패 시 기존 로직으로 fallback
      console.error("[Cache] Failed to get business cache:", error);
    }
  }

  const partialResults: {
    nts?: NTSResult | null;
    nps?: NPSResult | null;
    dart?: DARTResult | null;
    ksic?: KSICResult | null;
  } = {};

  // 병렬 조회 실행
  const promises: Promise<void>[] = [];

  if (opts.sources?.includes("nts")) {
    promises.push(
      lookupFromNTS(formatted).then((result) => {
        partialResults.nts = result;
      }),
    );
  }

  if (opts.sources?.includes("nps")) {
    promises.push(
      lookupFromNPS(formatted).then((result) => {
        partialResults.nps = result;
      }),
    );
  }

  // 타임아웃 처리
  try {
    await Promise.race([
      Promise.all(promises),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("조회 시간이 초과되었습니다.")),
          opts.timeout,
        ),
      ),
    ]);
  } catch (error) {
    console.error("Business lookup timeout or error:", error);
  }

  // DART는 회사명 기반 검색이므로 NPS에서 회사명을 가져온 후 조회
  if (opts.sources?.includes("dart") && partialResults.nps?.companyName) {
    try {
      const dartResult = await lookupFromDARTByName(
        partialResults.nps.companyName,
      );
      partialResults.dart = dartResult;
    } catch (error) {
      console.error("DART lookup error:", error);
    }
  }

  // KSIC 업태/종목 변환 (DART의 industryCode 사용)
  if (opts.enrichWithKSIC && partialResults.dart?.industryCode) {
    try {
      const ksicResult = await lookupFromKSIC(partialResults.dart.industryCode);
      partialResults.ksic = ksicResult;
    } catch (error) {
      console.error("KSIC lookup error:", error);
    }
  }

  // 결과 통합
  const unifiedInfo = mergeResults(formatted, partialResults);

  if (!unifiedInfo) {
    return {
      success: false,
      data: null,
      error: "기업 정보를 찾을 수 없습니다.",
      partialResults,
    };
  }

  // 성공 시 캐시 저장 (useCache가 true인 경우)
  if (opts.useCache && unifiedInfo) {
    try {
      await setBusinessCache(formatted, unifiedInfo);
    } catch (error) {
      // 캐시 저장 실패 시 조용히 무시
      console.error("[Cache] Failed to set business cache:", error);
    }
  }

  return {
    success: true,
    data: unifiedInfo,
    partialResults,
  };
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
  limit: number = 10,
): Promise<UnifiedBusinessInfo[]> {
  if (!companyName || companyName.trim().length < 2) {
    return [];
  }

  // NPS와 DART에서 병렬 검색
  const [npsResults, dartResults] = await Promise.all([
    searchNPSByCompanyName(companyName, limit),
    searchDARTByCompanyName(companyName, limit),
  ]);

  // 결과 통합 (NPS 기준으로 DART 정보 매칭)
  const results: UnifiedBusinessInfo[] = [];

  for (const nps of npsResults) {
    const matchingDart = dartResults.find(
      (dart) =>
        dart.corpName === nps.companyName ||
        dart.corpName.includes(nps.companyName) ||
        nps.companyName.includes(dart.corpName),
    );

    results.push(
      mergeResults(nps.businessNumber, { nps, dart: matchingDart }) ||
        createBasicInfo(nps),
    );
  }

  // NPS에 없는 DART 결과 추가
  for (const dart of dartResults) {
    const alreadyIncluded = results.some(
      (r) =>
        r.companyName === dart.corpName ||
        r.companyName.includes(dart.corpName),
    );

    if (!alreadyIncluded) {
      results.push(createFromDart(dart));
    }
  }

  return results.slice(0, limit);
}

/**
 * 사업자번호 유효성만 검사
 */
export { isValidBusinessNumber, formatBusinessNumber };

/**
 * 개별 소스 조회 함수 내보내기
 */
export { lookupFromNTS } from "./sources/nts";
export { lookupFromNPS, searchNPSByCompanyName } from "./sources/nps";
export {
  lookupFromDARTByName,
  searchDARTByCompanyName,
  lookupFromDARTByCorpCode,
} from "./sources/dart";
export {
  lookupFromKSIC,
  getBusinessTypeFromCode,
  getIndustryNameFromCode,
  getAllBusinessTypes,
} from "./sources/ksic";
export {
  lookupEmploymentInsuranceFromDB,
  searchEmploymentInsuranceByCompanyName,
  getEmploymentInsuranceStatsByBusinessType,
} from "./sources/employment-insurance";
export {
  estimateCompanySize,
  getCompanySizeColor,
  getCompanySizeDescription,
} from "./utils/company-size";
export {
  inferCorporationType,
  getCorporationTypeDescription,
  getCorporationTypeColor,
} from "./utils/corporation-type";

// ===== 내부 헬퍼 함수 =====

/**
 * 여러 소스의 결과를 통합 (확장 버전)
 */
function mergeResults(
  businessNumber: string,
  partialResults: {
    nts?: NTSResult | null;
    nps?: NPSResult | null;
    dart?: DARTResult | null;
    ksic?: KSICResult | null;
  },
): UnifiedBusinessInfo | null {
  const { nts, nps, dart, ksic } = partialResults;

  // 최소한 하나의 소스에서 결과가 있어야 함
  if (!nts && !nps && !dart) {
    return null;
  }

  const sources: BusinessDataSource[] = [];
  if (nts) sources.push("nts");
  if (nps) sources.push("nps");
  if (dart) sources.push("dart");
  if (ksic) sources.push("ksic");

  const companyName = nps?.companyName || dart?.corpName || "";

  // 기업규모 추정 (직원수 기반)
  const businessType =
    ksic?.businessType || getBusinessTypeFromCode(dart?.industryCode || null);
  const companySize = estimateCompanySize(
    nps?.employeeCount || null,
    businessType,
  );

  // 법인형태 추정 (회사명, 과세유형 기반)
  const corporationType = inferCorporationType(
    companyName,
    nts?.taxType || null,
  );

  // 우선순위: NPS(회사명, 주소) > DART(상세정보) > NTS(사업자상태)
  return {
    // --- 기본 정보 ---
    businessNumber: formatBusinessNumber(businessNumber),
    companyName,
    companyNameEng: dart?.corpNameEng || null,
    ceoName: dart?.ceoName || null,

    // --- 위치 정보 ---
    address: nps?.address || dart?.address || null,
    location:
      nps?.location || extractLocationFromAddress(nps?.address || dart?.address) || "",

    // --- 사업 정보 ---
    industryCode: dart?.industryCode || null,
    employeeCount: nps?.employeeCount || null,
    establishedDate: dart?.establishedDate || null,

    // --- 확장 필드 (KSIC 기반) ---
    businessType: ksic?.businessType || businessType || null,
    industryName:
      ksic?.industryName ||
      getIndustryNameFromCode(dart?.industryCode || null) ||
      null,
    companySize,
    corporationType,

    // --- 연락처 ---
    homepage: dart?.homepage || null,
    phone: dart?.phone || null,

    // --- 국세청 정보 ---
    ntsStatus: nts?.status || null,
    ntsStatusCode: nts?.statusCode || null,
    taxType: nts?.taxType || null,
    taxTypeCode: nts?.taxTypeCode || null,
    closedDate: nts?.closedDate || null,

    // --- 상장 정보 (DART) ---
    stockCode: dart?.stockCode || null,
    stockMarket: dart?.stockMarket || "",

    // 메타 정보
    sources,
    foundAt: new Date().toISOString(),
  };
}

/**
 * NPS 결과만으로 기본 정보 생성
 */
function createBasicInfo(nps: NPSResult): UnifiedBusinessInfo {
  const companySize = estimateCompanySize(nps.employeeCount, null);
  const corporationType = inferCorporationType(nps.companyName, null);

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
    businessType: null,
    industryName: null,
    companySize,
    corporationType,
    homepage: null,
    phone: null,
    ntsStatus: null,
    ntsStatusCode: null,
    taxType: null,
    taxTypeCode: null,
    closedDate: null,
    stockCode: null,
    stockMarket: "",
    sources: ["nps"],
    foundAt: new Date().toISOString(),
  };
}

/**
 * DART 결과만으로 정보 생성
 */
function createFromDart(dart: DARTResult): UnifiedBusinessInfo {
  const businessType = getBusinessTypeFromCode(dart.industryCode);
  const industryName = getIndustryNameFromCode(dart.industryCode);
  const corporationType = inferCorporationType(dart.corpName, null);

  return {
    businessNumber: "",
    companyName: dart.corpName,
    companyNameEng: dart.corpNameEng,
    ceoName: dart.ceoName,
    address: dart.address,
    location: extractLocationFromAddress(dart.address),
    industryCode: dart.industryCode,
    employeeCount: null,
    establishedDate: dart.establishedDate,
    businessType,
    industryName,
    companySize: "알 수 없음",
    corporationType,
    homepage: dart.homepage,
    phone: dart.phone,
    ntsStatus: null,
    ntsStatusCode: null,
    taxType: null,
    taxTypeCode: null,
    closedDate: null,
    stockCode: dart.stockCode,
    stockMarket: dart.stockMarket,
    sources: ["dart"],
    foundAt: new Date().toISOString(),
  };
}

