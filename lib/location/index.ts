/**
 * 지역 정보 통합 모듈
 * 대한민국 17개 시/도에 대한 정규화된 지역 정보 관리
 */

// 지역 정보 타입
export interface RegionInfo {
  code: string           // 영문 코드 (seoul, gyeonggi, etc.)
  officialName: string   // 정식 명칭 (서울특별시, 경기도, etc.)
  shortName: string      // 약어 (서울, 경기, etc.)
  aliases: string[]      // 검색용 별칭 (서울시, 서울특별시, etc.)
}

// 17개 시/도 지역 정보
export const REGIONS: RegionInfo[] = [
  {
    code: 'seoul',
    officialName: '서울특별시',
    shortName: '서울',
    aliases: ['서울', '서울특별시', '서울시'],
  },
  {
    code: 'busan',
    officialName: '부산광역시',
    shortName: '부산',
    aliases: ['부산', '부산광역시', '부산시'],
  },
  {
    code: 'daegu',
    officialName: '대구광역시',
    shortName: '대구',
    aliases: ['대구', '대구광역시', '대구시'],
  },
  {
    code: 'incheon',
    officialName: '인천광역시',
    shortName: '인천',
    aliases: ['인천', '인천광역시', '인천시'],
  },
  {
    code: 'gwangju',
    officialName: '광주광역시',
    shortName: '광주',
    aliases: ['광주', '광주광역시', '광주시'],
  },
  {
    code: 'daejeon',
    officialName: '대전광역시',
    shortName: '대전',
    aliases: ['대전', '대전광역시', '대전시'],
  },
  {
    code: 'ulsan',
    officialName: '울산광역시',
    shortName: '울산',
    aliases: ['울산', '울산광역시', '울산시'],
  },
  {
    code: 'sejong',
    officialName: '세종특별자치시',
    shortName: '세종',
    aliases: ['세종', '세종특별자치시', '세종시'],
  },
  {
    code: 'gyeonggi',
    officialName: '경기도',
    shortName: '경기',
    aliases: ['경기', '경기도'],
  },
  {
    code: 'gangwon',
    officialName: '강원특별자치도',
    shortName: '강원',
    aliases: ['강원', '강원도', '강원특별자치도'],
  },
  {
    code: 'chungbuk',
    officialName: '충청북도',
    shortName: '충북',
    aliases: ['충북', '충청북도'],
  },
  {
    code: 'chungnam',
    officialName: '충청남도',
    shortName: '충남',
    aliases: ['충남', '충청남도'],
  },
  {
    code: 'jeonbuk',
    officialName: '전북특별자치도',
    shortName: '전북',
    aliases: ['전북', '전라북도', '전북특별자치도'],
  },
  {
    code: 'jeonnam',
    officialName: '전라남도',
    shortName: '전남',
    aliases: ['전남', '전라남도'],
  },
  {
    code: 'gyeongbuk',
    officialName: '경상북도',
    shortName: '경북',
    aliases: ['경북', '경상북도'],
  },
  {
    code: 'gyeongnam',
    officialName: '경상남도',
    shortName: '경남',
    aliases: ['경남', '경상남도'],
  },
  {
    code: 'jeju',
    officialName: '제주특별자치도',
    shortName: '제주',
    aliases: ['제주', '제주특별자치도', '제주도'],
  },
]

// 수도권 지역 코드
export const SEOUL_METRO_AREA = ['seoul', 'gyeonggi', 'incheon']

// 전국/제한없음을 의미하는 키워드
export const NATIONWIDE_KEYWORDS = [
  '전국', '전지역', '제한없음', '무관', '해당없음', '전 지역'
]

// 코드 → 지역 정보 매핑 (빠른 조회용)
const regionByCode = new Map<string, RegionInfo>(
  REGIONS.map(r => [r.code, r])
)

// 검색용 패턴 (긴 문자열부터 매칭하도록 정렬)
const searchPatterns = REGIONS.flatMap(r =>
  r.aliases.map(alias => ({ pattern: alias, region: r }))
).sort((a, b) => b.pattern.length - a.pattern.length)

/**
 * 주소 문자열에서 시/도 추출
 * @param address 주소 문자열
 * @returns 정식 명칭 또는 빈 문자열
 */
export function extractLocationFromAddress(address: string | null | undefined): string {
  if (!address) return ''

  for (const { pattern, region } of searchPatterns) {
    if (address.includes(pattern)) {
      return region.officialName
    }
  }

  return ''
}

/**
 * 주소 문자열에서 지역 코드 추출
 * @param address 주소 문자열
 * @returns 영문 코드 또는 빈 문자열
 */
export function extractLocationCode(address: string | null | undefined): string {
  if (!address) return ''

  for (const { pattern, region } of searchPatterns) {
    if (address.includes(pattern)) {
      return region.code
    }
  }

  return ''
}

/**
 * 지역 코드로 지역 정보 조회
 * @param code 영문 코드 (seoul, gyeonggi, etc.)
 * @returns 지역 정보 또는 undefined
 */
export function getRegionByCode(code: string): RegionInfo | undefined {
  return regionByCode.get(code)
}

/**
 * 지역 코드를 한글 라벨로 변환
 * @param code 영문 코드
 * @returns 약어 (서울, 경기, etc.) 또는 원본 코드
 */
export function getLocationLabel(code: string): string {
  const region = regionByCode.get(code)
  return region?.shortName || code
}

/**
 * 지역 코드를 정식 명칭으로 변환
 * @param code 영문 코드
 * @returns 정식 명칭 (서울특별시, 경기도, etc.) 또는 원본 코드
 */
export function getOfficialLocationName(code: string): string {
  const region = regionByCode.get(code)
  return region?.officialName || code
}

/**
 * 정식 명칭을 영문 코드로 변환
 * @param name 한글 지역명 (정식명칭, 약어, 별칭 모두 지원)
 * @returns 영문 코드 또는 빈 문자열
 */
export function getLocationCode(name: string | null | undefined): string {
  if (!name) return ''

  for (const region of REGIONS) {
    if (region.aliases.some(alias => name.includes(alias))) {
      return region.code
    }
  }

  return ''
}

/**
 * 지역 코드 → 한글 키워드 매핑 (recommendations/mappings.ts 호환)
 */
export function getRegionKeywords(): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const region of REGIONS) {
    result[region.code] = region.aliases
  }
  return result
}

/**
 * 회사 지역 코드가 공고 지역 목록에 포함되는지 확인
 * @param companyLocation 회사 지역 코드 (seoul, gyeonggi, etc.)
 * @param announcementRegions 공고 지역 목록 (한글 문자열)
 * @returns 매칭 여부
 */
export function isRegionMatch(
  companyLocation: string | null,
  announcementRegions: string[]
): boolean {
  if (!companyLocation || announcementRegions.length === 0) {
    return true
  }

  // 전국이면 무조건 통과
  if (announcementRegions.some(r =>
    NATIONWIDE_KEYWORDS.some(kw => r.includes(kw))
  )) {
    return true
  }

  // 수도권 체크
  if (announcementRegions.some(r => r.includes('수도권'))) {
    if (SEOUL_METRO_AREA.includes(companyLocation)) {
      return true
    }
  }

  const region = regionByCode.get(companyLocation)
  if (!region) return false

  return announcementRegions.some(annRegion => {
    const annLower = annRegion.toLowerCase()
    return region.aliases.some(alias =>
      annLower.includes(alias.toLowerCase())
    )
  })
}

/**
 * 회사가 제외 지역에 해당하는지 확인
 * @param companyLocation 회사 지역 코드
 * @param excludedRegions 제외 지역 목록 (한글 문자열)
 * @returns 제외 여부
 */
export function isRegionExcluded(
  companyLocation: string | null,
  excludedRegions: string[]
): boolean {
  if (!companyLocation || excludedRegions.length === 0) {
    return false
  }

  const region = regionByCode.get(companyLocation)
  if (!region) return false

  return excludedRegions.some(excluded => {
    const exLower = excluded.toLowerCase()
    return region.aliases.some(alias =>
      exLower.includes(alias.toLowerCase())
    )
  })
}
