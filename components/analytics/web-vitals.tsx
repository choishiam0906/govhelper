'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { trackEvent } from './google-analytics'

// Web Vitals 메트릭 타입
type WebVitalsMetric = {
  id: string
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'prerender'
}

// 메트릭 임계값 (Google 권장)
const thresholds = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
}

// 등급 계산
function getRating(name: WebVitalsMetric['name'], value: number): WebVitalsMetric['rating'] {
  const threshold = thresholds[name]
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

export function WebVitals() {
  useReportWebVitals((metric) => {
    const { id, name, value, delta, navigationType } = metric as WebVitalsMetric
    const rating = getRating(name, value)

    // 콘솔 로깅 제거 (프로덕션 최적화)

    // GA4로 전송
    trackEvent('web_vitals', name, rating, Math.round(name === 'CLS' ? value * 1000 : value))

    // 성능 저하 시 Sentry에 보고 (선택적)
    if (rating === 'poor' && typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureMessage(`Poor ${name}: ${value}`, {
        level: 'warning',
        tags: {
          metric: name,
          rating,
          navigationType,
        },
        extra: {
          value,
          delta,
          id,
        },
      })
    }
  })

  return null
}
