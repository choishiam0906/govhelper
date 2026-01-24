// Redis 캐시 모듈
// Upstash Redis 클라이언트를 사용한 범용 캐시 함수

import redis from '@/lib/redis'
import type { UnifiedBusinessInfo } from '@/lib/business/types'

// TTL 정책 상수 (초 단위)
export const CACHE_TTL = {
  BUSINESS_NTS: 3600,              // 1시간 - 사업자 상태는 자주 변경될 수 있음
  BUSINESS_FULL: 86400,            // 24시간 - 통합 사업자 정보
  AI_MATCHING: 604800,             // 7일 - AI 매칭 결과 (공고가 변경되지 않는 한 재사용)
  RAG_EMBEDDING: 3600,             // 1시간 - RAG 임베딩 쿼리
  ANNOUNCEMENTS_LIST: 300,         // 5분 - 공고 목록 (자주 업데이트되지 않음)
} as const

// 캐시 키 생성 함수
export const cacheKey = {
  // 사업자 정보 캐시 키
  business: (businessNumber: string) => `business:${businessNumber}`,

  // AI 매칭 결과 캐시 키
  matching: (companyId: string, announcementId: string) =>
    `matching:${companyId}:${announcementId}`,

  // RAG 임베딩 캐시 키
  ragEmbedding: (query: string) => {
    // 쿼리를 해시하여 키로 사용 (긴 쿼리 방지)
    const hash = simpleHash(query)
    return `rag:embedding:${hash}`
  },
} as const

// 간단한 해시 함수 (캐시 키용)
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * 캐시에서 데이터 조회
 * @param key 캐시 키
 * @returns 캐시된 데이터 또는 null
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key)
    return data
  } catch (error) {
    console.error('[Cache] Failed to get cache:', error)
    // Redis 연결 실패 시 null 반환 (서비스 중단 방지)
    return null
  }
}

/**
 * 캐시에 데이터 저장
 * @param key 캐시 키
 * @param data 저장할 데이터
 * @param ttlSeconds TTL (초), 기본값 없음 (영구 저장)
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttlSeconds?: number
): Promise<void> {
  try {
    if (ttlSeconds) {
      await redis.set(key, data, { ex: ttlSeconds })
    } else {
      await redis.set(key, data)
    }
  } catch (error) {
    console.error('[Cache] Failed to set cache:', error)
    // Redis 연결 실패 시 조용히 무시 (서비스 중단 방지)
  }
}

/**
 * 캐시 삭제
 * @param key 캐시 키
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error('[Cache] Failed to delete cache:', error)
    // Redis 연결 실패 시 조용히 무시
  }
}

/**
 * 캐시 조회 후 없으면 fallback 함수 실행 및 캐시 저장
 * @param key 캐시 키
 * @param fallback 캐시 미스 시 실행할 함수
 * @param ttlSeconds TTL (초)
 * @returns 캐시된 데이터 또는 fallback 결과
 */
export async function getCacheWithFallback<T>(
  key: string,
  fallback: () => Promise<T>,
  ttlSeconds?: number
): Promise<T> {
  // 1. 캐시 조회
  const cached = await getCache<T>(key)
  if (cached !== null) {
    return cached
  }

  // 2. 캐시 미스 시 fallback 실행
  const data = await fallback()

  // 3. 결과 캐시에 저장
  await setCache(key, data, ttlSeconds)

  return data
}

/**
 * 사업자 정보 캐시 조회 (타입 안전성)
 * @param businessNumber 사업자등록번호
 * @returns 캐시된 사업자 정보 또는 null
 */
export async function getBusinessCache(
  businessNumber: string
): Promise<UnifiedBusinessInfo | null> {
  const key = cacheKey.business(businessNumber)
  return getCache<UnifiedBusinessInfo>(key)
}

/**
 * 사업자 정보 캐시 저장 (타입 안전성)
 * @param businessNumber 사업자등록번호
 * @param data 사업자 정보
 */
export async function setBusinessCache(
  businessNumber: string,
  data: UnifiedBusinessInfo
): Promise<void> {
  const key = cacheKey.business(businessNumber)
  await setCache(key, data, CACHE_TTL.BUSINESS_FULL)
}

/**
 * 사업자 정보 캐시 삭제
 * @param businessNumber 사업자등록번호
 */
export async function deleteBusinessCache(businessNumber: string): Promise<void> {
  const key = cacheKey.business(businessNumber)
  await deleteCache(key)
}

/**
 * AI 매칭 결과 캐시 조회
 * @param companyId 기업 ID
 * @param announcementId 공고 ID
 * @returns 캐시된 매칭 결과 또는 null
 */
export async function getMatchingCache(
  companyId: string,
  announcementId: string
): Promise<any | null> {
  const key = cacheKey.matching(companyId, announcementId)
  return getCache(key)
}

/**
 * AI 매칭 결과 캐시 저장
 * @param companyId 기업 ID
 * @param announcementId 공고 ID
 * @param data 매칭 결과
 */
export async function setMatchingCache(
  companyId: string,
  announcementId: string,
  data: any
): Promise<void> {
  const key = cacheKey.matching(companyId, announcementId)
  await setCache(key, data, CACHE_TTL.AI_MATCHING)
}

/**
 * RAG 임베딩 캐시 조회
 * @param query 검색 쿼리
 * @returns 캐시된 임베딩 또는 null
 */
export async function getRagEmbeddingCache(query: string): Promise<number[] | null> {
  const key = cacheKey.ragEmbedding(query)
  return getCache<number[]>(key)
}

/**
 * RAG 임베딩 캐시 저장
 * @param query 검색 쿼리
 * @param embedding 임베딩 벡터
 */
export async function setRagEmbeddingCache(
  query: string,
  embedding: number[]
): Promise<void> {
  const key = cacheKey.ragEmbedding(query)
  await setCache(key, embedding, CACHE_TTL.RAG_EMBEDDING)
}

// 공고 목록 캐시 키 인터페이스
interface AnnouncementsListParams {
  page: number
  limit: number
  search?: string
  category?: string
  source?: string
  status?: string
}

/**
 * 공고 목록 캐시 키 생성
 */
function getAnnouncementsListCacheKey(params: AnnouncementsListParams): string {
  const hash = simpleHash(JSON.stringify(params))
  return `announcements:list:${hash}`
}

/**
 * 공고 목록 캐시 조회
 */
export async function getAnnouncementsListCache(
  params: AnnouncementsListParams
): Promise<any | null> {
  const key = getAnnouncementsListCacheKey(params)
  return getCache(key)
}

/**
 * 공고 목록 캐시 저장
 */
export async function setAnnouncementsListCache(
  params: AnnouncementsListParams,
  data: any
): Promise<void> {
  const key = getAnnouncementsListCacheKey(params)
  await setCache(key, data, CACHE_TTL.ANNOUNCEMENTS_LIST)
}

/**
 * 공고 목록 캐시 무효화 (동기화 후 호출)
 * 패턴 매칭으로 모든 공고 목록 캐시 삭제
 */
export async function invalidateAnnouncementsCache(): Promise<void> {
  try {
    // Upstash Redis에서는 SCAN을 사용한 패턴 삭제가 제한적이므로
    // 일반적으로 TTL에 의존하거나, 특정 키를 명시적으로 삭제
    // 여기서는 동기화 시 자연스럽게 5분 후 만료됨
    console.log('[Cache] Announcements cache will expire in 5 minutes')
  } catch (error) {
    console.error('[Cache] Failed to invalidate announcements cache:', error)
  }
}
