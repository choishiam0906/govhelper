'use client'

import { useEffect } from 'react'
import { FUNNEL_EVENTS, trackFunnelEvent } from '@/lib/analytics/events'
import { PlanType } from '@/lib/queries/dashboard'

interface BillingPageClientProps {
  currentPlan: PlanType
}

export function BillingPageClient({ currentPlan }: BillingPageClientProps) {
  useEffect(() => {
    // 구독 페이지 조회 이벤트
    trackFunnelEvent(FUNNEL_EVENTS.SUBSCRIPTION_VIEW, {
      page_title: '결제 및 구독',
      current_plan: currentPlan,
    })
  }, [currentPlan])

  return null
}
