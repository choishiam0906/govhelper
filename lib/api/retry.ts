/**
 * API 재시도 유틸리티
 * 지수 백오프와 지터를 사용한 안정적인 재시도 로직
 */

import { createLogger } from '@/lib/logger'

const logger = createLogger({ module: 'retry' })

/**
 * 재시도 옵션
 */
export interface RetryOptions {
  /** 최대 재시도 횟수 (기본: 3) */
  maxRetries?: number
  /** 초기 지연 시간 (밀리초, 기본: 1000) */
  baseDelay?: number
  /** 최대 지연 시간 (밀리초, 기본: 10000) */
  maxDelay?: number
  /** 백오프 전략 (기본: exponential) */
  backoff?: 'exponential' | 'linear'
  /** 재시도 조건 함수 (기본: 네트워크 오류 + 429/500+) */
  retryOn?: (error: any) => boolean
}

/**
 * 기본 재시도 조건
 * - 네트워크 오류 (fetch 실패)
 * - 429 Too Many Requests
 * - 500+ 서버 오류
 */
function defaultRetryCondition(error: any): boolean {
  // 네트워크 오류
  if (error.name === 'FetchError' || error.message?.includes('fetch')) {
    return true
  }

  // HTTP 상태 코드 기반
  const status = error.status || error.response?.status
  if (status) {
    // 429 (Rate Limit), 500+ (Server Error)
    return status === 429 || status >= 500
  }

  return false
}

/**
 * 지터가 포함된 지수 백오프 지연 계산
 * @param attempt 현재 시도 횟수 (0부터 시작)
 * @param baseDelay 초기 지연 시간
 * @param maxDelay 최대 지연 시간
 * @param backoff 백오프 전략
 * @returns 지연 시간 (밀리초)
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoff: 'exponential' | 'linear'
): number {
  let delay: number

  if (backoff === 'exponential') {
    // 지수 백오프: baseDelay * 2^attempt
    delay = baseDelay * Math.pow(2, attempt)
  } else {
    // 선형 백오프: baseDelay * (attempt + 1)
    delay = baseDelay * (attempt + 1)
  }

  // 최대 지연 시간 제한
  delay = Math.min(delay, maxDelay)

  // 지터 추가 (±25%)
  const jitter = delay * 0.25 * (Math.random() * 2 - 1)
  return Math.max(0, delay + jitter)
}

/**
 * 재시도 로직이 포함된 함수 실행
 * @param fn 실행할 비동기 함수
 * @param options 재시도 옵션
 * @returns 함수 실행 결과
 * @throws 마지막 오류 (모든 재시도 실패 시)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoff = 'exponential',
    retryOn = defaultRetryCondition,
  } = options

  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 함수 실행
      const result = await fn()

      // 성공 시 재시도 정보 로깅 (재시도가 있었을 경우만)
      if (attempt > 0) {
        logger.info('재시도 성공', {
          attempt,
          totalAttempts: attempt + 1,
        })
      }

      return result
    } catch (error) {
      lastError = error

      // 재시도 조건 확인
      const shouldRetry = retryOn(error)

      // 마지막 시도이거나 재시도 불가능한 오류
      if (attempt >= maxRetries || !shouldRetry) {
        logger.error('재시도 실패 - 최종 오류', {
          attempt,
          maxRetries,
          shouldRetry,
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }

      // 지연 시간 계산
      const delay = calculateDelay(attempt, baseDelay, maxDelay, backoff)

      logger.warn('재시도 대기 중', {
        attempt: attempt + 1,
        maxRetries,
        delayMs: Math.round(delay),
        backoff,
        error: error instanceof Error ? error.message : String(error),
      })

      // 지연
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // 이 코드에 도달하지 않지만 TypeScript 타입 체크용
  throw lastError
}

/**
 * 재시도 래퍼 함수 생성 (재사용 가능)
 * @param options 재시도 옵션
 * @returns 재시도 래퍼 함수
 */
export function createRetryWrapper(options: RetryOptions = {}) {
  return <T>(fn: () => Promise<T>): Promise<T> => withRetry(fn, options)
}

/**
 * fetch 전용 재시도 래퍼
 * @param url URL
 * @param init fetch 옵션
 * @param retryOptions 재시도 옵션
 * @returns fetch 응답
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  return withRetry(async () => {
    const res = await fetch(url, init)

    // HTTP 오류를 예외로 변환
    if (!res.ok) {
      const error: any = new Error(`HTTP ${res.status}: ${res.statusText}`)
      error.status = res.status
      error.response = res
      throw error
    }

    return res
  }, retryOptions)
}
