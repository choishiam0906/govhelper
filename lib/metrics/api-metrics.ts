/**
 * API 메트릭 수집 유틸리티
 *
 * Supabase service role을 사용하여 api_metrics 테이블에 메트릭 저장
 * - 10% 샘플링 (프로덕션)
 * - 100% 수집 (개발환경)
 * - fire-and-forget 방식으로 비동기 처리
 */

import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface ApiMetric {
  endpoint: string
  method: string
  statusCode: number
  durationMs: number
}

/**
 * API 메트릭 기록
 *
 * @param endpoint API 엔드포인트 경로
 * @param method HTTP 메서드
 * @param statusCode HTTP 상태 코드
 * @param durationMs 응답 시간 (밀리초)
 */
export async function recordApiMetric(
  endpoint: string,
  method: string,
  statusCode: number,
  durationMs: number
): Promise<void> {
  try {
    // 프로덕션에서는 10% 샘플링
    const isProd = process.env.NODE_ENV === 'production'
    if (isProd && Math.random() > 0.1) {
      return
    }

    // 비동기로 저장 (에러가 발생해도 무시)
    const { error } = await supabase
      .from('api_metrics')
      .insert({
        endpoint,
        method,
        status_code: statusCode,
        duration_ms: durationMs,
      })

    if (error) {
      logger.debug('메트릭 저장 실패', { error: error.message, endpoint, method })
    }
  } catch (error) {
    // recordApiMetric 자체가 예외를 던지지 않도록 보장
    logger.debug('메트릭 수집 실패', { error: String(error) })
  }
}

/**
 * 오래된 메트릭 데이터 삭제 (7일 이상)
 *
 * archive-announcements cron에서 호출됨
 */
export async function cleanupOldMetrics(): Promise<void> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 7)

    const { error } = await supabase
      .from('api_metrics')
      .delete()
      .lt('created_at', cutoffDate.toISOString())

    if (error) {
      logger.error('오래된 메트릭 정리 실패', { error: error.message })
    } else {
      logger.info('오래된 메트릭 정리 완료', { cutoffDate: cutoffDate.toISOString() })
    }
  } catch (error) {
    logger.error('메트릭 정리 중 오류', { error: String(error) })
  }
}
