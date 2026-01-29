/**
 * API 메트릭 수집 미들웨어 헬퍼
 *
 * API route handler를 감싸서 응답 시간을 자동으로 측정하고 기록
 *
 * 사용법:
 * ```ts
 * export const GET = withMetrics(async (request) => {
 *   // 기존 로직
 *   return NextResponse.json({ data })
 * })
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'
import { recordApiMetric } from './api-metrics'

type NextRouteHandler = (
  request: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<NextResponse>

/**
 * API route handler를 래핑하여 메트릭 수집
 *
 * @param handler 원본 API route handler
 * @returns 메트릭 수집이 추가된 handler
 */
export function withMetrics(handler: NextRouteHandler): NextRouteHandler {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    const startTime = Date.now()
    let response: NextResponse

    try {
      // 원본 handler 실행
      response = await handler(request, context)
    } catch (error) {
      // 에러 발생 시 500 응답으로 메트릭 기록
      const durationMs = Date.now() - startTime
      const endpoint = getEndpointPath(request.url)
      const method = request.method

      recordApiMetric(endpoint, method, 500, durationMs)

      // 에러는 그대로 던져서 Next.js 에러 핸들링에 맡김
      throw error
    }

    // 성공 응답 메트릭 기록
    const durationMs = Date.now() - startTime
    const endpoint = getEndpointPath(request.url)
    const method = request.method
    const statusCode = response.status

    recordApiMetric(endpoint, method, statusCode, durationMs)

    return response
  }
}

/**
 * URL에서 엔드포인트 경로 추출 (쿼리 파라미터 제외)
 *
 * @param url 전체 URL
 * @returns 엔드포인트 경로 (/api/announcements 등)
 */
function getEndpointPath(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.pathname
  } catch {
    return url
  }
}
