/**
 * UTM 파라미터 추적 유틸리티
 *
 * UTM 파라미터:
 * - utm_source: 트래픽 소스 (google, facebook, naver 등)
 * - utm_medium: 마케팅 매체 (cpc, email, social 등)
 * - utm_campaign: 캠페인 이름
 * - utm_term: 검색 키워드 (선택)
 * - utm_content: 광고 콘텐츠 구분 (선택)
 */

const UTM_STORAGE_KEY = 'govhelper_utm'
const UTM_EXPIRY_HOURS = 24 // UTM 유효 시간 (24시간)

export interface UTMParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  captured_at?: string
  landing_page?: string
  referrer?: string
}

/**
 * URL에서 UTM 파라미터 추출
 */
export function extractUTMFromURL(url?: string): UTMParams {
  if (typeof window === 'undefined') return {}

  const searchParams = new URLSearchParams(url || window.location.search)

  const utm: UTMParams = {}

  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const

  utmKeys.forEach(key => {
    const value = searchParams.get(key)
    if (value) {
      utm[key] = value
    }
  })

  return utm
}

/**
 * UTM 파라미터가 있는지 확인
 */
export function hasUTMParams(utm: UTMParams): boolean {
  return Boolean(utm.utm_source || utm.utm_medium || utm.utm_campaign)
}

/**
 * 세션 스토리지에서 UTM 정보 가져오기
 */
export function getStoredUTM(): UTMParams | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY)
    if (!stored) return null

    const data = JSON.parse(stored) as UTMParams

    // 만료 확인
    if (data.captured_at) {
      const capturedAt = new Date(data.captured_at)
      const now = new Date()
      const hoursDiff = (now.getTime() - capturedAt.getTime()) / (1000 * 60 * 60)

      if (hoursDiff > UTM_EXPIRY_HOURS) {
        sessionStorage.removeItem(UTM_STORAGE_KEY)
        return null
      }
    }

    return data
  } catch {
    return null
  }
}

/**
 * UTM 정보 저장
 */
export function storeUTM(utm: UTMParams): void {
  if (typeof window === 'undefined') return

  try {
    const data: UTMParams = {
      ...utm,
      captured_at: new Date().toISOString(),
      landing_page: window.location.pathname,
      referrer: document.referrer || undefined,
    }

    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(data))
  } catch {
    // 스토리지 오류 무시
  }
}

/**
 * UTM 정보 초기화 (전환 완료 후)
 */
export function clearUTM(): void {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.removeItem(UTM_STORAGE_KEY)
  } catch {
    // 스토리지 오류 무시
  }
}

/**
 * 현재 UTM 정보 가져오기 (URL 우선, 없으면 저장된 값)
 */
export function getCurrentUTM(): UTMParams {
  // 1. URL에서 UTM 추출
  const urlUTM = extractUTMFromURL()

  // 2. URL에 UTM이 있으면 저장하고 반환
  if (hasUTMParams(urlUTM)) {
    storeUTM(urlUTM)
    return urlUTM
  }

  // 3. 저장된 UTM 반환
  return getStoredUTM() || {}
}

/**
 * UTM 파라미터를 API 요청용으로 변환
 */
export function getUTMForAPI(): Pick<UTMParams, 'utm_source' | 'utm_medium' | 'utm_campaign'> {
  const utm = getCurrentUTM()

  return {
    utm_source: utm.utm_source,
    utm_medium: utm.utm_medium,
    utm_campaign: utm.utm_campaign,
  }
}

/**
 * 리퍼러에서 소스 추론
 */
export function inferSourceFromReferrer(): string | undefined {
  if (typeof window === 'undefined') return undefined

  const referrer = document.referrer
  if (!referrer) return 'direct'

  try {
    const url = new URL(referrer)
    const hostname = url.hostname.toLowerCase()

    // 주요 소스 매핑
    if (hostname.includes('google')) return 'google'
    if (hostname.includes('naver')) return 'naver'
    if (hostname.includes('daum')) return 'daum'
    if (hostname.includes('facebook') || hostname.includes('fb.')) return 'facebook'
    if (hostname.includes('instagram')) return 'instagram'
    if (hostname.includes('twitter') || hostname.includes('x.com')) return 'twitter'
    if (hostname.includes('linkedin')) return 'linkedin'
    if (hostname.includes('youtube')) return 'youtube'
    if (hostname.includes('kakao')) return 'kakao'

    // 자사 도메인이면 null (내부 이동)
    if (hostname.includes('govhelpers.com')) return undefined

    return hostname.replace('www.', '')
  } catch {
    return undefined
  }
}

/**
 * UTM 초기화 훅용 함수 (페이지 로드 시 호출)
 */
export function initializeUTM(): UTMParams {
  const utm = getCurrentUTM()

  // UTM이 없고 리퍼러가 있으면 추론
  if (!hasUTMParams(utm)) {
    const inferredSource = inferSourceFromReferrer()
    if (inferredSource && inferredSource !== 'direct') {
      const inferredUTM: UTMParams = {
        utm_source: inferredSource,
        utm_medium: 'referral',
      }
      storeUTM(inferredUTM)
      return inferredUTM
    }
  }

  return utm
}
