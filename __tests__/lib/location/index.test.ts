// 지역 정보 통합 모듈 테스트
// lib/location/index.ts의 지역 관련 함수 테스트

import { describe, it, expect } from 'vitest'
import {
  extractLocationFromAddress,
  extractLocationCode,
  getRegionByCode,
  getLocationLabel,
  getOfficialLocationName,
  getLocationCode,
  getRegionKeywords,
  isRegionMatch,
  isRegionExcluded,
  REGIONS,
  SEOUL_METRO_AREA,
  NATIONWIDE_KEYWORDS,
} from '@/lib/location'

describe('지역 데이터 구조', () => {
  it('17개 시/도 지역 정보가 있어야 한다', () => {
    expect(REGIONS).toHaveLength(17)
  })

  it('모든 지역에 필수 필드가 있어야 한다', () => {
    REGIONS.forEach((region) => {
      expect(region).toHaveProperty('code')
      expect(region).toHaveProperty('officialName')
      expect(region).toHaveProperty('shortName')
      expect(region).toHaveProperty('aliases')
      expect(Array.isArray(region.aliases)).toBe(true)
    })
  })

  it('수도권에 서울, 경기, 인천이 포함되어야 한다', () => {
    expect(SEOUL_METRO_AREA).toEqual(['seoul', 'gyeonggi', 'incheon'])
  })

  it('전국 키워드가 정의되어 있어야 한다', () => {
    expect(NATIONWIDE_KEYWORDS).toContain('전국')
    expect(NATIONWIDE_KEYWORDS).toContain('제한없음')
  })
})

describe('주소에서 시/도 추출 (extractLocationFromAddress)', () => {
  it('서울특별시 주소에서 정식 명칭을 추출해야 한다', () => {
    const result = extractLocationFromAddress('서울특별시 강남구 테헤란로')
    expect(result).toBe('서울특별시')
  })

  it('약어로도 추출해야 한다', () => {
    const result = extractLocationFromAddress('서울 강남구')
    expect(result).toBe('서울특별시')
  })

  it('경기도 주소를 추출해야 한다', () => {
    const result = extractLocationFromAddress('경기도 성남시 분당구')
    expect(result).toBe('경기도')
  })

  it('광역시를 추출해야 한다', () => {
    expect(extractLocationFromAddress('부산광역시 해운대구')).toBe('부산광역시')
    expect(extractLocationFromAddress('대구광역시 수성구')).toBe('대구광역시')
  })

  it('특별자치시/도를 추출해야 한다', () => {
    expect(extractLocationFromAddress('세종특별자치시')).toBe('세종특별자치시')
    expect(extractLocationFromAddress('제주특별자치도 제주시')).toBe('제주특별자치도')
  })

  it('null이나 undefined 입력 시 빈 문자열을 반환해야 한다', () => {
    expect(extractLocationFromAddress(null)).toBe('')
    expect(extractLocationFromAddress(undefined)).toBe('')
  })

  it('매칭되지 않는 주소는 빈 문자열을 반환해야 한다', () => {
    expect(extractLocationFromAddress('외국 주소')).toBe('')
    expect(extractLocationFromAddress('')).toBe('')
  })

  it('긴 패턴을 우선 매칭해야 한다', () => {
    // "서울특별시"가 "서울"보다 먼저 매칭되어야 함
    const result = extractLocationFromAddress('서울특별시')
    expect(result).toBe('서울특별시')
  })
})

describe('주소에서 지역 코드 추출 (extractLocationCode)', () => {
  it('서울 주소에서 seoul 코드를 반환해야 한다', () => {
    expect(extractLocationCode('서울특별시 강남구')).toBe('seoul')
    expect(extractLocationCode('서울시 종로구')).toBe('seoul')
  })

  it('17개 시/도 코드를 정확히 반환해야 한다', () => {
    expect(extractLocationCode('경기도 수원시')).toBe('gyeonggi')
    expect(extractLocationCode('부산광역시')).toBe('busan')
    expect(extractLocationCode('강원도 춘천시')).toBe('gangwon')
    expect(extractLocationCode('제주도')).toBe('jeju')
  })

  it('null/undefined는 빈 문자열을 반환해야 한다', () => {
    expect(extractLocationCode(null)).toBe('')
    expect(extractLocationCode(undefined)).toBe('')
  })

  it('매칭되지 않는 주소는 빈 문자열을 반환해야 한다', () => {
    expect(extractLocationCode('해외 주소')).toBe('')
  })
})

describe('지역 코드로 지역 정보 조회 (getRegionByCode)', () => {
  it('유효한 코드로 지역 정보를 조회해야 한다', () => {
    const seoul = getRegionByCode('seoul')
    expect(seoul?.officialName).toBe('서울특별시')
    expect(seoul?.shortName).toBe('서울')
  })

  it('존재하지 않는 코드는 undefined를 반환해야 한다', () => {
    expect(getRegionByCode('invalid')).toBeUndefined()
  })

  it('17개 시/도 모두 조회 가능해야 한다', () => {
    const codes = [
      'seoul',
      'busan',
      'daegu',
      'incheon',
      'gwangju',
      'daejeon',
      'ulsan',
      'sejong',
      'gyeonggi',
      'gangwon',
      'chungbuk',
      'chungnam',
      'jeonbuk',
      'jeonnam',
      'gyeongbuk',
      'gyeongnam',
      'jeju',
    ]

    codes.forEach((code) => {
      const region = getRegionByCode(code)
      expect(region).toBeDefined()
      expect(region?.code).toBe(code)
    })
  })
})

describe('지역 코드를 한글 라벨로 변환 (getLocationLabel)', () => {
  it('유효한 코드를 약어로 변환해야 한다', () => {
    expect(getLocationLabel('seoul')).toBe('서울')
    expect(getLocationLabel('gyeonggi')).toBe('경기')
    expect(getLocationLabel('chungbuk')).toBe('충북')
  })

  it('존재하지 않는 코드는 원본을 반환해야 한다', () => {
    expect(getLocationLabel('invalid')).toBe('invalid')
  })
})

describe('지역 코드를 정식 명칭으로 변환 (getOfficialLocationName)', () => {
  it('유효한 코드를 정식 명칭으로 변환해야 한다', () => {
    expect(getOfficialLocationName('seoul')).toBe('서울특별시')
    expect(getOfficialLocationName('gyeonggi')).toBe('경기도')
    expect(getOfficialLocationName('busan')).toBe('부산광역시')
  })

  it('존재하지 않는 코드는 원본을 반환해야 한다', () => {
    expect(getOfficialLocationName('unknown')).toBe('unknown')
  })
})

describe('한글 지역명을 영문 코드로 변환 (getLocationCode)', () => {
  it('정식 명칭을 코드로 변환해야 한다', () => {
    expect(getLocationCode('서울특별시')).toBe('seoul')
    expect(getLocationCode('경기도')).toBe('gyeonggi')
    expect(getLocationCode('부산광역시')).toBe('busan')
  })

  it('약어도 코드로 변환해야 한다', () => {
    expect(getLocationCode('서울')).toBe('seoul')
    expect(getLocationCode('경기')).toBe('gyeonggi')
    expect(getLocationCode('충북')).toBe('chungbuk')
  })

  it('별칭도 코드로 변환해야 한다', () => {
    expect(getLocationCode('서울시')).toBe('seoul')
  })

  it('null/undefined는 빈 문자열을 반환해야 한다', () => {
    expect(getLocationCode(null)).toBe('')
    expect(getLocationCode(undefined)).toBe('')
  })

  it('매칭되지 않는 이름은 빈 문자열을 반환해야 한다', () => {
    expect(getLocationCode('뉴욕')).toBe('')
  })
})

describe('지역 키워드 매핑 생성 (getRegionKeywords)', () => {
  it('모든 지역의 별칭 목록을 반환해야 한다', () => {
    const keywords = getRegionKeywords()

    expect(keywords.seoul).toEqual(['서울', '서울특별시', '서울시'])
    expect(keywords.gyeonggi).toEqual(['경기', '경기도'])
    expect(keywords.busan).toEqual(['부산', '부산광역시', '부산시'])
  })

  it('17개 지역 모두 포함되어야 한다', () => {
    const keywords = getRegionKeywords()
    expect(Object.keys(keywords)).toHaveLength(17)
  })
})

describe('회사 지역과 공고 지역 매칭 (isRegionMatch)', () => {
  describe('전국 공고', () => {
    it('전국 키워드가 포함되면 모든 지역이 매칭되어야 한다', () => {
      expect(isRegionMatch('seoul', ['전국'])).toBe(true)
      expect(isRegionMatch('gyeonggi', ['전지역'])).toBe(true)
      expect(isRegionMatch('busan', ['제한없음'])).toBe(true)
    })

    it('전국이 포함된 배열이면 매칭되어야 한다', () => {
      expect(isRegionMatch('seoul', ['서울', '전국'])).toBe(true)
    })
  })

  describe('수도권 공고', () => {
    it('수도권 키워드가 있으면 서울/경기/인천이 매칭되어야 한다', () => {
      expect(isRegionMatch('seoul', ['수도권'])).toBe(true)
      expect(isRegionMatch('gyeonggi', ['수도권'])).toBe(true)
      expect(isRegionMatch('incheon', ['수도권'])).toBe(true)
    })

    it('수도권 외 지역은 매칭되지 않아야 한다', () => {
      expect(isRegionMatch('busan', ['수도권'])).toBe(false)
      expect(isRegionMatch('jeju', ['수도권'])).toBe(false)
    })
  })

  describe('특정 지역 공고', () => {
    it('회사 지역이 공고 지역에 포함되면 매칭되어야 한다', () => {
      expect(isRegionMatch('seoul', ['서울특별시'])).toBe(true)
      expect(isRegionMatch('seoul', ['서울'])).toBe(true)
      expect(isRegionMatch('gyeonggi', ['경기도'])).toBe(true)
    })

    it('회사 지역이 공고 지역에 없으면 매칭되지 않아야 한다', () => {
      expect(isRegionMatch('seoul', ['부산광역시'])).toBe(false)
      expect(isRegionMatch('busan', ['경기도', '인천광역시'])).toBe(false)
    })

    it('여러 지역 중 하나라도 매칭되면 true를 반환해야 한다', () => {
      expect(isRegionMatch('seoul', ['부산광역시', '서울특별시'])).toBe(true)
    })
  })

  describe('엣지 케이스', () => {
    it('회사 지역이 null이면 항상 매칭되어야 한다', () => {
      expect(isRegionMatch(null, ['서울특별시'])).toBe(true)
    })

    it('공고 지역 배열이 비어있으면 항상 매칭되어야 한다', () => {
      expect(isRegionMatch('seoul', [])).toBe(true)
    })

    it('존재하지 않는 지역 코드는 매칭되지 않아야 한다', () => {
      expect(isRegionMatch('invalid', ['서울특별시'])).toBe(false)
    })
  })
})

describe('회사가 제외 지역에 해당하는지 확인 (isRegionExcluded)', () => {
  it('회사 지역이 제외 목록에 있으면 true를 반환해야 한다', () => {
    expect(isRegionExcluded('seoul', ['서울특별시'])).toBe(true)
    expect(isRegionExcluded('seoul', ['서울'])).toBe(true)
  })

  it('회사 지역이 제외 목록에 없으면 false를 반환해야 한다', () => {
    expect(isRegionExcluded('seoul', ['부산광역시'])).toBe(false)
  })

  it('제외 목록이 비어있으면 false를 반환해야 한다', () => {
    expect(isRegionExcluded('seoul', [])).toBe(false)
  })

  it('회사 지역이 null이면 false를 반환해야 한다', () => {
    expect(isRegionExcluded(null, ['서울특별시'])).toBe(false)
  })

  it('여러 제외 지역 중 하나라도 매칭되면 true를 반환해야 한다', () => {
    expect(isRegionExcluded('seoul', ['부산광역시', '서울특별시'])).toBe(true)
  })

  it('존재하지 않는 지역 코드는 제외되지 않아야 한다', () => {
    expect(isRegionExcluded('invalid', ['서울특별시'])).toBe(false)
  })
})
