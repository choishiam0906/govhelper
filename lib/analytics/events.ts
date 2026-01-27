// GA4 전환 퍼널 이벤트 상수
export const FUNNEL_EVENTS = {
  // 랜딩 → 회원가입
  LANDING_VIEW: 'funnel_landing_view',
  SIGNUP_START: 'funnel_signup_start',
  SIGNUP_COMPLETE: 'funnel_signup_complete',

  // 온보딩
  ONBOARDING_START: 'funnel_onboarding_start',
  ONBOARDING_STEP: 'funnel_onboarding_step',
  ONBOARDING_COMPLETE: 'funnel_onboarding_complete',

  // 매칭
  MATCHING_START: 'funnel_matching_start',
  MATCHING_COMPLETE: 'funnel_matching_complete',

  // 구독
  SUBSCRIPTION_VIEW: 'funnel_subscription_view',
  SUBSCRIPTION_START: 'funnel_subscription_start',
  SUBSCRIPTION_COMPLETE: 'funnel_subscription_complete',

  // 비회원 플로우
  TRY_START: 'funnel_try_start',
  TRY_STEP: 'funnel_try_step',
  TRY_COMPLETE: 'funnel_try_complete',

  // 비회원 플로우 Step별 상세 추적
  TRY_STEP_1_START: 'try_step_1_start',      // 1단계 시작 (사업자번호 입력)
  TRY_STEP_1_COMPLETE: 'try_step_1_complete', // 1단계 완료
  TRY_STEP_2_START: 'try_step_2_start',      // 2단계 시작 (기업정보 입력)
  TRY_STEP_2_COMPLETE: 'try_step_2_complete', // 2단계 완료
  TRY_STEP_3_START: 'try_step_3_start',      // 3단계 시작 (이메일 입력)
  TRY_STEP_3_COMPLETE: 'try_step_3_complete', // 3단계 완료 (분석 요청)
  TRY_RESULT_VIEW: 'try_result_view',        // 결과 페이지 조회
  TRY_SIGNUP_CLICK: 'try_signup_click',      // 회원가입 버튼 클릭
  TRY_STEP_ABANDON: 'try_step_abandon',      // 단계 포기 (페이지 이탈)
} as const

// 이벤트 추적 함수
export function trackFunnelEvent(event: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event, {
      event_category: 'funnel',
      ...params,
    })
  }
}
