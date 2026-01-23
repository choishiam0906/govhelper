import { Redis } from '@upstash/redis'

// Upstash Redis 클라이언트
// Vercel KV 또는 직접 Upstash 환경변수 지원
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

export default redis
