'use client'

import { useEffect } from 'react'
import { FUNNEL_EVENTS, trackFunnelEvent } from '@/lib/analytics/events'
import { PlanType } from '@/lib/queries/dashboard'
import { trackABTestExposure } from '@/lib/ab-test/tracker'
import { ABTestVariant } from '@/lib/ab-test'

interface BillingPageClientProps {
  currentPlan: PlanType
  pricing: {
    proMonthly: number
    proYearly: number
    variant: ABTestVariant
  }
}

export function BillingPageClient({ currentPlan, pricing }: BillingPageClientProps) {
  useEffect(() => {
    // 구독 페이지 조회 이벤트
    trackFunnelEvent(FUNNEL_EVENTS.SUBSCRIPTION_VIEW, {
      page_title: '결제 및 구독',
      current_plan: currentPlan,
    })

    // A/B 테스트 노출 이벤트
    trackABTestExposure('pricing_pro_202601', pricing.variant)
  }, [currentPlan, pricing.variant])

  return null
}
