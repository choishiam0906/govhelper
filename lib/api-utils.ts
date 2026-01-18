import { NextRequest, NextResponse } from 'next/server'
import {
  aiRateLimiter,
  apiRateLimiter,
  syncRateLimiter,
  authRateLimiter,
  checkRateLimit,
  getClientIP,
  getRateLimitHeaders,
  isRateLimitEnabled,
} from './rate-limit'
import { Ratelimit } from '@upstash/ratelimit'

type RateLimitType = 'ai' | 'api' | 'sync' | 'auth'

const limiters: Record<RateLimitType, Ratelimit> = {
  ai: aiRateLimiter,
  api: apiRateLimiter,
  sync: syncRateLimiter,
  auth: authRateLimiter,
}

// Rate Limit 적용된 API 핸들러 wrapper
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  type: RateLimitType = 'api'
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Rate Limit가 비활성화된 경우 바로 처리
    if (!isRateLimitEnabled()) {
      return handler(request)
    }

    try {
      const ip = getClientIP(request)
      const limiter = limiters[type]
      const result = await checkRateLimit(limiter, ip)

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.',
            retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: getRateLimitHeaders(result),
          }
        )
      }

      // 원래 핸들러 실행
      const response = await handler(request)

      // Rate Limit 헤더 추가
      const headers = getRateLimitHeaders(result)
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      return response
    } catch (error) {
      // Rate Limit 오류 시에도 서비스는 계속
      console.error('Rate limit error:', error)
      return handler(request)
    }
  }
}

// 사용자 ID 기반 Rate Limit (인증된 사용자용)
export function withUserRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  type: RateLimitType = 'api',
  getUserId: (request: NextRequest) => Promise<string | null>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    if (!isRateLimitEnabled()) {
      return handler(request)
    }

    try {
      // 사용자 ID 또는 IP 사용
      const userId = await getUserId(request)
      const identifier = userId || getClientIP(request)
      const limiter = limiters[type]
      const result = await checkRateLimit(limiter, identifier)

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.',
            retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: getRateLimitHeaders(result),
          }
        )
      }

      const response = await handler(request)

      const headers = getRateLimitHeaders(result)
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      return response
    } catch (error) {
      console.error('Rate limit error:', error)
      return handler(request)
    }
  }
}
