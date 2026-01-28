/**
 * 지자체 지원사업 소스 목록
 *
 * 향후 개별 지자체 API/스크래퍼를 추가할 수 있도록 확장 가능한 구조
 */

export interface LocalSource {
  id: string
  name: string
  url: string
  enabled: boolean
  description: string
}

/**
 * 17개 광역시/도 지원사업 소스
 */
export const LOCAL_SOURCES: LocalSource[] = [
  {
    id: 'seoul',
    name: '서울특별시',
    url: 'https://www.seoul.go.kr/main/index.jsp',
    enabled: true,
    description: '서울시 중소기업 및 소상공인 지원사업'
  },
  {
    id: 'busan',
    name: '부산광역시',
    url: 'https://www.busan.go.kr/',
    enabled: true,
    description: '부산시 중소기업 및 스타트업 지원사업'
  },
  {
    id: 'daegu',
    name: '대구광역시',
    url: 'https://www.daegu.go.kr/',
    enabled: true,
    description: '대구시 중소기업 및 창업 지원사업'
  },
  {
    id: 'incheon',
    name: '인천광역시',
    url: 'https://www.incheon.go.kr/',
    enabled: true,
    description: '인천시 중소기업 및 소상공인 지원사업'
  },
  {
    id: 'gwangju',
    name: '광주광역시',
    url: 'https://www.gwangju.go.kr/',
    enabled: true,
    description: '광주시 중소기업 및 스타트업 지원사업'
  },
  {
    id: 'daejeon',
    name: '대전광역시',
    url: 'https://www.daejeon.go.kr/',
    enabled: true,
    description: '대전시 중소기업 및 창업 지원사업'
  },
  {
    id: 'ulsan',
    name: '울산광역시',
    url: 'https://www.ulsan.go.kr/',
    enabled: false,
    description: '울산시 중소기업 및 제조업 지원사업'
  },
  {
    id: 'sejong',
    name: '세종특별자치시',
    url: 'https://www.sejong.go.kr/',
    enabled: false,
    description: '세종시 중소기업 및 스타트업 지원사업'
  },
  {
    id: 'gyeonggi',
    name: '경기도',
    url: 'https://www.gg.go.kr/',
    enabled: true,
    description: '경기도 중소기업 및 소상공인 지원사업'
  },
  {
    id: 'gangwon',
    name: '강원특별자치도',
    url: 'https://www.gangwon.go.kr/',
    enabled: false,
    description: '강원도 중소기업 및 관광 지원사업'
  },
  {
    id: 'chungbuk',
    name: '충청북도',
    url: 'https://www.chungbuk.go.kr/',
    enabled: false,
    description: '충북 중소기업 및 제조업 지원사업'
  },
  {
    id: 'chungnam',
    name: '충청남도',
    url: 'https://www.chungnam.go.kr/',
    enabled: false,
    description: '충남 중소기업 및 농식품 지원사업'
  },
  {
    id: 'jeonbuk',
    name: '전북특별자치도',
    url: 'https://www.jeonbuk.go.kr/',
    enabled: false,
    description: '전북 중소기업 및 스타트업 지원사업'
  },
  {
    id: 'jeonnam',
    name: '전라남도',
    url: 'https://www.jeonnam.go.kr/',
    enabled: false,
    description: '전남 중소기업 및 농수산 지원사업'
  },
  {
    id: 'gyeongbuk',
    name: '경상북도',
    url: 'https://www.gb.go.kr/',
    enabled: false,
    description: '경북 중소기업 및 스타트업 지원사업'
  },
  {
    id: 'gyeongnam',
    name: '경상남도',
    url: 'https://www.gyeongnam.go.kr/',
    enabled: false,
    description: '경남 중소기업 및 제조업 지원사업'
  },
  {
    id: 'jeju',
    name: '제주특별자치도',
    url: 'https://www.jeju.go.kr/',
    enabled: false,
    description: '제주 중소기업 및 관광 지원사업'
  }
]

/**
 * 활성화된 지자체 소스 조회
 */
export function getEnabledLocalSources(): LocalSource[] {
  return LOCAL_SOURCES.filter(source => source.enabled)
}

/**
 * ID로 지자체 소스 조회
 */
export function getLocalSourceById(id: string): LocalSource | undefined {
  return LOCAL_SOURCES.find(source => source.id === id)
}
