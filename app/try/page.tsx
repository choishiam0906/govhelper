'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Building2 } from 'lucide-react'
import Link from 'next/link'
import { useUTM } from '@/lib/hooks/use-utm'
import { FUNNEL_EVENTS, trackFunnelEvent } from '@/lib/analytics/events'
import type { Step, FormData, UnifiedLookupResult } from './types'
import { INDUSTRIES } from './constants'
import Step1 from './steps/step1'
import Step2 from './steps/step2'
import Step3 from './steps/step3'
import Step4 from './steps/step4'

export default function TryPage() {
  const router = useRouter()
  const { utmForAPI } = useUTM()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [skipBusinessNumber, setSkipBusinessNumber] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    businessNumber: '',
    companyName: '',
    industry: '',
    employeeCount: '',
    location: '',
    annualRevenue: '',
    foundedDate: '',
    certifications: [],
    email: '',
  })

  // 사업자번호 조회 결과
  const [lookupResult, setLookupResult] = useState<UnifiedLookupResult | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)

  const progress = ((step - 1) / 3) * 100

  // 페이지 로드 시 시작 이벤트 및 Step 1 시작 이벤트
  useEffect(() => {
    // 비회원 매칭 시작 이벤트
    trackFunnelEvent(FUNNEL_EVENTS.TRY_START, {
      page_title: '무료 매칭 분석',
    })
    // Step 1 시작 이벤트
    trackFunnelEvent(FUNNEL_EVENTS.TRY_STEP_1_START, {
      step: 1,
      step_name: '사업자번호 입력',
    })
  }, [])

  // Step 변경 시 Step별 시작 이벤트
  useEffect(() => {
    if (step === 2) {
      trackFunnelEvent(FUNNEL_EVENTS.TRY_STEP_2_START, {
        step: 2,
        step_name: '기업정보 입력',
      })
    } else if (step === 3) {
      trackFunnelEvent(FUNNEL_EVENTS.TRY_STEP_3_START, {
        step: 3,
        step_name: '이메일 입력',
      })
    }
  }, [step])

  // 페이지 이탈 시 포기 이벤트 (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (step < 4) {
        trackFunnelEvent(FUNNEL_EVENTS.TRY_STEP_ABANDON, {
          abandoned_step: step,
          abandoned_step_name: step === 1 ? '사업자번호 입력' : step === 2 ? '기업정보 입력' : '이메일 입력',
          time_on_step: Date.now(), // 실제로는 step 시작 시간과의 차이를 계산해야 하지만 간단히 현재 시간 기록
        })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [step])

  const updateFormData = (key: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const toggleCertification = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert]
    }))
  }

  // 사업자번호 조회 (통합 API 사용)
  const lookupBusinessNumber = useCallback(async (bizNum: string) => {
    const cleaned = bizNum.replace(/[^0-9]/g, '')

    if (cleaned.length !== 10) {
      setLookupResult(null)
      setLookupError(null)
      return
    }

    setLookingUp(true)
    setLookupError(null)

    try {
      const response = await fetch('/api/business/unified-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessNumber: cleaned }),
      })

      const result: UnifiedLookupResult = await response.json()

      if (result.success && result.data) {
        setLookupResult(result)

        // 폼 자동 채우기
        if (result.data.companyName) {
          updateFormData('companyName', result.data.companyName)
        }
        if (result.data.location) {
          updateFormData('location', result.data.location)
        }
        if (result.data.employeeCount) {
          updateFormData('employeeCount', result.data.employeeCount.toString())
        }
        // 업종 자동 채우기 (businessType = 업태)
        if (result.data.businessType && INDUSTRIES.includes(result.data.businessType)) {
          updateFormData('industry', result.data.businessType)
        }
        // 설립일 자동 채우기
        if (result.data.establishedDate) {
          // YYYYMMDD → YYYY-MM-DD 변환
          const dateStr = result.data.establishedDate.replace(/[^0-9]/g, '')
          if (dateStr.length === 8) {
            const formatted = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
            updateFormData('foundedDate', formatted)
          }
        }

        toast.success('사업자 정보를 찾았어요!')
      } else {
        setLookupResult({ success: false, error: result.error })
        setLookupError(result.error || '기업 정보를 찾을 수 없어요')
      }
    } catch (error) {
      console.error('Business lookup error:', error)
      setLookupError('조회 중 오류가 발생했어요')
    } finally {
      setLookingUp(false)
    }
  }, [])

  // 사업자번호 입력 시 debounce 조회
  useEffect(() => {
    const bizNum = formData.businessNumber.replace(/[^0-9]/g, '')

    if (bizNum.length === 10) {
      const timer = setTimeout(() => {
        lookupBusinessNumber(formData.businessNumber)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setLookupResult(null)
      setLookupError(null)
    }
  }, [formData.businessNumber, lookupBusinessNumber])

  // 1단계 → 2단계
  const handleStep1Next = () => {
    const bizNum = formData.businessNumber.replace(/[^0-9]/g, '')

    if (bizNum.length > 0 && bizNum.length !== 10) {
      toast.error('사업자번호 10자리를 입력해주세요')
      return
    }

    // Step 1 완료 이벤트
    trackFunnelEvent(FUNNEL_EVENTS.TRY_STEP_1_COMPLETE, {
      step: 1,
      has_business_number: bizNum.length === 10,
      business_lookup_success: lookupResult?.success || false,
    })

    trackFunnelEvent(FUNNEL_EVENTS.TRY_STEP, {
      step: 2,
      step_name: '기업 정보 입력',
      has_business_number: bizNum.length === 10,
    })

    setStep(2)
  }

  // 사업자번호 없이 진행
  const handleSkipBusinessNumber = () => {
    setSkipBusinessNumber(true)
    setLookupResult(null)

    // Step 1 완료 이벤트 (스킵)
    trackFunnelEvent(FUNNEL_EVENTS.TRY_STEP_1_COMPLETE, {
      step: 1,
      has_business_number: false,
      skipped: true,
    })

    trackFunnelEvent(FUNNEL_EVENTS.TRY_STEP, {
      step: 2,
      step_name: '기업 정보 입력',
      has_business_number: false,
      skipped: true,
    })

    setStep(2)
  }

  // 2단계 → 3단계
  const handleStep2Next = () => {
    if (!formData.companyName.trim()) {
      toast.error('회사명을 입력해주세요')
      return
    }
    if (!formData.industry) {
      toast.error('업종을 선택해주세요')
      return
    }
    if (!formData.employeeCount) {
      toast.error('직원수를 입력해주세요')
      return
    }
    if (!formData.location) {
      toast.error('소재지를 선택해주세요')
      return
    }

    // Step 2 완료 이벤트
    trackFunnelEvent(FUNNEL_EVENTS.TRY_STEP_2_COMPLETE, {
      step: 2,
      industry: formData.industry,
      employee_count: parseInt(formData.employeeCount) || 0,
      location: formData.location,
      has_annual_revenue: !!formData.annualRevenue,
      has_founded_date: !!formData.foundedDate,
      certifications_count: formData.certifications.length,
    })

    trackFunnelEvent(FUNNEL_EVENTS.TRY_STEP, {
      step: 3,
      step_name: '이메일 입력',
      industry: formData.industry,
      employee_count: formData.employeeCount,
      location: formData.location,
    })

    setStep(3)
  }

  // 최종 제출
  const handleSubmit = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      toast.error('올바른 이메일을 입력해주세요')
      return
    }

    // Step 3 완료 이벤트 (분석 요청 전)
    trackFunnelEvent(FUNNEL_EVENTS.TRY_STEP_3_COMPLETE, {
      step: 3,
      email_domain: formData.email.split('@')[1],
    })

    setStep(4)
    setLoading(true)

    try {
      const response = await fetch('/api/guest/matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          businessNumber: skipBusinessNumber ? undefined : formData.businessNumber.replace(/[^0-9]/g, ''),
          companyName: formData.companyName,
          industry: formData.industry,
          employeeCount: parseInt(formData.employeeCount) || 1,
          location: formData.location,
          annualRevenue: formData.annualRevenue ? parseInt(formData.annualRevenue) * 100000000 : undefined,
          foundedDate: formData.foundedDate || undefined,
          certifications: formData.certifications.length > 0 ? formData.certifications : undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // 비회원 매칭 완료 이벤트
        trackFunnelEvent(FUNNEL_EVENTS.TRY_COMPLETE, {
          email_domain: formData.email.split('@')[1],
          industry: formData.industry,
          location: formData.location,
          match_count: result.data.matchCount || 0,
        })

        router.push(`/try/result/${result.data.resultId}`)
      } else {
        toast.error(result.error || '분석 중 오류가 발생했어요')
        setStep(3)
        setLoading(false)
      }
    } catch (error) {
      toast.error('분석 요청 중 오류가 발생했어요')
      setStep(3)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* 헤더 */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">G</span>
            </div>
            <span className="font-bold text-xl">GovHelper</span>
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">로그인</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 진행률 */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>무료 매칭 분석</span>
            <span>{step}/4 단계</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          {/* 1단계: 사업자번호 입력 */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Step1
                formData={formData}
                lookupResult={lookupResult}
                lookupError={lookupError}
                lookingUp={lookingUp}
                updateFormData={updateFormData}
                onNext={handleStep1Next}
                onSkip={handleSkipBusinessNumber}
              />
            </motion.div>
          )}

          {/* 2단계: 기업정보 입력 */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Step2
                formData={formData}
                lookupResult={lookupResult}
                updateFormData={updateFormData}
                toggleCertification={toggleCertification}
                onNext={handleStep2Next}
                onPrevious={() => setStep(1)}
              />
            </motion.div>
          )}

          {/* 3단계: 이메일 입력 */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Step3
                formData={formData}
                updateFormData={updateFormData}
                onSubmit={handleSubmit}
                onPrevious={() => setStep(2)}
              />
            </motion.div>
          )}

          {/* 4단계: 분석 중 */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Step4 formData={formData} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 하단 안내 */}
        {step < 4 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-primary hover:underline">
                로그인
              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
