/**
 * 업종/지역 매핑 테이블
 * company-form.tsx의 매핑을 확장하여 양방향 검색 지원
 */

// 지역 관련 기능은 통합 모듈에서 가져옴
export {
  getRegionKeywords,
  SEOUL_METRO_AREA as seoulMetroArea,
  NATIONWIDE_KEYWORDS as nationwideKeywords,
  isRegionMatch,
  isRegionExcluded,
  getLocationLabel,
} from '@/lib/location'

// 호환성을 위한 regionKeywords (getRegionKeywords() 결과를 캐싱)
import { getRegionKeywords } from '@/lib/location'
export const regionKeywords = getRegionKeywords()

// 업종 코드 → 한글 키워드 매핑
export const industryKeywords: Record<string, string[]> = {
  software: [
    'SW', '소프트웨어', '정보통신', '정보통신업', 'IT', '컴퓨터',
    '프로그래밍', '시스템통합', '정보서비스', '출판업', '앱', '플랫폼',
    '인터넷', '클라우드', 'SaaS', '웹'
  ],
  ai: [
    'AI', '인공지능', '빅데이터', '데이터', '머신러닝', '딥러닝',
    '자연어처리', 'NLP', '컴퓨터비전', '자율주행'
  ],
  biotech: [
    '바이오', '의료', '보건', '제약', '헬스케어', '의료기기',
    '생명공학', '신약', '진단', '보건업', '사회복지'
  ],
  manufacturing: [
    '제조', '제조업', '생산', '공장', '전자부품', '기계',
    '자동차', '반도체', '디스플레이', '장비', '부품'
  ],
  commerce: [
    '유통', '커머스', '소매', '도매', '이커머스', 'e커머스',
    '쇼핑', '물류', '배송', '유통업'
  ],
  fintech: [
    '핀테크', '금융', '보험', '결제', '페이', '뱅킹',
    '자산관리', '투자', '금융업', '보험업'
  ],
  contents: [
    '콘텐츠', '미디어', '영상', '음악', '게임', '엔터테인먼트',
    '방송', '출판', '영화', '애니메이션', '웹툰'
  ],
  education: [
    '에듀테크', '교육', '학습', '강의', '이러닝', 'e러닝',
    '교육서비스', '학원', '연수'
  ],
  energy: [
    '에너지', '환경', '신재생', '태양광', '풍력', '수소',
    '전기', '가스', '폐기물', '재활용', '탄소중립', 'ESG'
  ],
  other: ['기타', '서비스업']
}

// 인증 코드 → 한글 키워드 매핑
export const certificationKeywords: Record<string, string[]> = {
  venture: ['벤처', '벤처기업', '벤처인증'],
  innobiz: ['이노비즈', 'INNOBIZ', 'inno-biz'],
  mainbiz: ['메인비즈', 'MAINBIZ', 'main-biz'],
  womanEnterprise: ['여성기업', '여성', '여성창업'],
  socialEnterprise: ['사회적기업', '사회적', '소셜벤처'],
  researchInstitute: ['기업부설연구소', '연구소', 'R&D', '연구개발']
}

/**
 * 회사 업종 코드가 공고 업종 목록에 포함되는지 확인
 */
export function isIndustryMatch(
  companyIndustry: string | null,
  announcementIndustries: string[]
): boolean {
  if (!companyIndustry || announcementIndustries.length === 0) {
    return true // 조건이 없으면 통과
  }

  const keywords = industryKeywords[companyIndustry] || []

  // 공고 업종 목록에 회사 업종 키워드가 포함되는지 확인
  return announcementIndustries.some(annIndustry => {
    const annLower = annIndustry.toLowerCase()
    return keywords.some(keyword =>
      annLower.includes(keyword.toLowerCase()) ||
      keyword.toLowerCase().includes(annLower)
    )
  })
}

/**
 * 회사가 제외 업종에 해당하는지 확인
 */
export function isIndustryExcluded(
  companyIndustry: string | null,
  excludedIndustries: string[]
): boolean {
  if (!companyIndustry || excludedIndustries.length === 0) {
    return false
  }

  const keywords = industryKeywords[companyIndustry] || []

  return excludedIndustries.some(excluded => {
    const exLower = excluded.toLowerCase()
    return keywords.some(keyword =>
      exLower.includes(keyword.toLowerCase())
    )
  })
}

/**
 * 회사 인증이 필요 인증 목록에 포함되는지 확인
 */
export function hasCertificationMatch(
  companyCertifications: string[] | null,
  requiredCertifications: string[]
): boolean {
  if (!requiredCertifications || requiredCertifications.length === 0) {
    return true // 필수 인증이 없으면 통과
  }

  if (!companyCertifications || companyCertifications.length === 0) {
    return false // 필수 인증이 있는데 회사 인증이 없으면 실패
  }

  // 회사가 가진 인증 중 하나라도 필수 인증과 매칭되면 통과
  return companyCertifications.some(companyCert => {
    const companyKeywords = certificationKeywords[companyCert] || [companyCert]

    return requiredCertifications.some(reqCert => {
      const reqLower = reqCert.toLowerCase()
      return companyKeywords.some(keyword =>
        reqLower.includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(reqLower)
      )
    })
  })
}

/**
 * 업종 코드를 한글 라벨로 변환
 */
export function getIndustryLabel(code: string): string {
  const labels: Record<string, string> = {
    software: 'SW 개발',
    ai: 'AI/빅데이터',
    biotech: '바이오/의료',
    manufacturing: '제조업',
    commerce: '유통/커머스',
    fintech: '핀테크',
    contents: '콘텐츠/미디어',
    education: '에듀테크',
    energy: '에너지/환경',
    other: '기타'
  }
  return labels[code] || code
}

