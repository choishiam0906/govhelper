/**
 * 클라이언트 사이드 API 캐싱 유틸리티
 * 경량 메모리 캐시로 중복 API 호출 방지
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
}

// 메모리 캐시 (Map 기반)
const cache = new Map<string, CacheEntry<unknown>>()

/**
 * TTL 기반 캐시 fetch
 * @param url API 엔드포인트
 * @param ttl Time to Live (밀리초, 기본 60초)
 * @returns API 응답 데이터
 */
export async function cachedFetch<T>(url: string, ttl: number = 60000): Promise<T> {
  const now = Date.now()
  const cached = cache.get(url)

  // 캐시 히트 - TTL 이내면 캐시 반환
  if (cached && now - cached.timestamp < ttl) {
    return cached.data as T
  }

  // 캐시 미스 - API 호출
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`API 오류: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()

  // 캐시 저장
  cache.set(url, { data, timestamp: now })

  return data as T
}

/**
 * 캐시 무효화 (특정 키 또는 전체)
 * @param key 캐시 키 (선택)
 */
export function invalidateCache(key?: string): void {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}

/**
 * 캐시 통계 조회 (디버깅용)
 */
export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  }
}

/**
 * 사전 정의된 TTL (밀리초)
 */
export const CACHE_TTL = {
  // 공고 목록 - 5분
  ANNOUNCEMENTS_LIST: 5 * 60 * 1000,

  // 공고 상세 - 30분
  ANNOUNCEMENT_DETAIL: 30 * 60 * 1000,

  // 맞춤 추천 - 1시간
  RECOMMENDATIONS: 60 * 60 * 1000,

  // 사용자 정보 - 5분
  USER_INFO: 5 * 60 * 1000,

  // 통계 - 10분
  STATISTICS: 10 * 60 * 1000,
} as const
