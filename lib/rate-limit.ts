import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Upstash Redis 클라이언트 (Vercel KV 또는 직접 Upstash 지원)
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

// Rate Limiter 설정
// AI 관련 API (매칭, 지원서 개선) - 분당 10회
export const aiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:ai',
})

// 일반 API - 분당 60회
export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
  prefix: 'ratelimit:api',
})

// 동기화 API (Cron/Admin) - 시간당 10회
export const syncRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
  prefix: 'ratelimit:sync',
})

// 인증 API (로그인/회원가입) - 분당 5회
export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
})

// Rate Limit 결과 타입
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// Rate Limit 체크 헬퍼
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<RateLimitResult> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier)
  return { success, limit, remaining, reset }
}

// IP 주소 추출 헬퍼
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return '127.0.0.1'
}

// Rate Limit 응답 헤더 생성
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  }
}

// Upstash 연결 상태 확인 (Vercel KV 또는 직접 Upstash)
export function isRateLimitEnabled(): boolean {
  const hasVercelKV = !!(
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN
  )
  const hasUpstash = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  )
  return hasVercelKV || hasUpstash
}
