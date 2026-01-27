'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeft, Loader2, Crown, AlertTriangle, Copy, Check, Building2, Sparkles } from 'lucide-react'
import { PAYMENT_PRICES } from '@/lib/payments'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { FUNNEL_EVENTS, trackFunnelEvent } from '@/lib/analytics/events'

type Plan = 'proMonthly' | 'proYearly' | 'premiumMonthly' | 'premiumYearly'

const BANK_ACCOUNT = {
  bankName: '신한은행',
  accountNumber: '110-377-265-992',
  accountHolder: '최기헌',
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isCancel = searchParams.get('cancel') === 'true'
  const planParam = searchParams.get('plan') // 'pro' or 'premium'
  const isPremium = planParam === 'premium'

  // URL 파라미터에 따라 기본값 설정
  const defaultPlan: Plan = isPremium ? 'premiumMonthly' : 'proMonthly'
  const [plan, setPlan] = useState<Plan>(defaultPlan)
  const [depositorName, setDepositorName] = useState('')
  const [loading, setLoading] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(isCancel)
  const [cancelling, setCancelling] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  // 현재 선택된 플랜이 Premium인지 확인
  const isCurrentPlanPremium = plan === 'premiumMonthly' || plan === 'premiumYearly'

  useEffect(() => {
    // 구독 결제 페이지 조회 이벤트
    trackFunnelEvent(FUNNEL_EVENTS.SUBSCRIPTION_VIEW, {
      page_title: '구독 결제',
      plan: planParam || 'unknown',
    })
  }, [planParam])

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  const handleCopyAccount = async () => {
    await navigator.clipboard.writeText(BANK_ACCOUNT.accountNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCheckout = async () => {
    if (!depositorName.trim()) {
      toast.error('입금자명을 입력해주세요')
      return
    }

    // 구독 시작 이벤트
    trackFunnelEvent(FUNNEL_EVENTS.SUBSCRIPTION_START, {
      plan: plan,
      payment_method: 'bank_transfer',
      amount: PAYMENT_PRICES[plan],
    })

    setLoading(true)
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          depositorName: depositorName.trim(),
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '결제 요청에 실패했습니다')
      }

      // 구독 완료 이벤트 (입금 신청 완료)
      trackFunnelEvent(FUNNEL_EVENTS.SUBSCRIPTION_COMPLETE, {
        plan: plan,
        payment_method: 'bank_transfer',
        amount: PAYMENT_PRICES[plan],
        payment_id: result.data.paymentId,
      })

      setPaymentInfo(result.data)
      setIsCompleted(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '결제에 실패했어요')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '구독 취소에 실패했습니다')
      }

      toast.success(result.message || '구독을 취소했어요')
      router.push('/dashboard/billing')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '구독 취소에 실패했어요')
    } finally {
      setCancelling(false)
      setCancelDialogOpen(false)
    }
  }

  // 구독 취소 페이지
  if (isCancel) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                구독 취소
              </AlertDialogTitle>
              <AlertDialogDescription>
                정말 구독을 취소할까요? 현재 구독 기간이 끝나면 무료 플랜으로 전환되고, 다음 기능을 사용할 수 없어요:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>무제한 AI 매칭 분석</li>
                  <li>AI 지원서 작성</li>
                  <li>우선 고객 지원</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => router.push('/dashboard/billing')}
                disabled={cancelling}
              >
                돌아가기
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                disabled={cancelling}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  '구독 취소'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  // 입금 완료 페이지
  if (isCompleted && paymentInfo) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle>입금 신청 완료</CardTitle>
            <CardDescription>
              아래 계좌로 입금해주시면 확인 후 구독이 활성화됩니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 입금 정보 */}
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">상품</span>
                <span className="font-medium">{paymentInfo.orderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">입금액</span>
                <span className="font-bold text-lg text-primary">
                  {formatPrice(paymentInfo.amount)}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">입금자명</span>
                <span className="font-medium">{paymentInfo.depositorName}</span>
              </div>
            </div>

            {/* 계좌 정보 */}
            <div className="border-2 border-primary rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <span className="font-medium">입금 계좌</span>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm text-muted-foreground">{BANK_ACCOUNT.bankName}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xl font-mono font-bold">
                    {BANK_ACCOUNT.accountNumber}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAccount}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-1 text-green-600" />
                        복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        복사
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  예금주: {BANK_ACCOUNT.accountHolder}
                </p>
              </div>
            </div>

            {/* 안내 사항 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>안내사항</strong><br />
                • 입금자명이 다를 경우 확인이 지연될 수 있습니다<br />
                • 입금 확인은 평일 기준 24시간 내 처리됩니다<br />
                • 입금 후 choishiam@gmail.com으로 입금자명을 보내주시면 빠르게 처리됩니다
              </p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => router.push('/dashboard/billing')}
            >
              결제 내역으로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 결제 페이지
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/billing">
            <ArrowLeft className="h-4 w-4 mr-1" />
            돌아가기
          </Link>
        </Button>
      </div>

      <div className="text-center">
        {isCurrentPlanPremium ? (
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-purple-500" />
        ) : (
          <Crown className="h-12 w-12 mx-auto mb-4 text-primary" />
        )}
        <h1 className="text-2xl font-bold">
          {isCurrentPlanPremium ? 'Premium 업그레이드' : 'Pro 업그레이드'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isCurrentPlanPremium
            ? 'AI 지원서 작성과 우선 고객 지원을 이용하세요'
            : '무제한 AI 매칭과 상세 분석 리포트를 이용하세요'
          }
        </p>
      </div>

      {/* 플랜 선택 */}
      <Card>
        <CardHeader>
          <CardTitle>요금제 선택</CardTitle>
          <CardDescription>결제 주기를 선택하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={plan}
            onValueChange={(value) => setPlan(value as Plan)}
            className="grid gap-4"
          >
            {/* Pro 섹션 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm text-muted-foreground">Pro 플랜</span>
              </div>

              <Label
                htmlFor="proMonthly"
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${plan === 'proMonthly' ? 'border-primary bg-primary/5' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="proMonthly" id="proMonthly" />
                  <div>
                    <p className="font-medium">월간 구독</p>
                    <p className="text-sm text-muted-foreground">매월 결제</p>
                  </div>
                </div>
                <p className="font-bold">{formatPrice(PAYMENT_PRICES.proMonthly)}원/월</p>
              </Label>

              <Label
                htmlFor="proYearly"
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${plan === 'proYearly' ? 'border-primary bg-primary/5' : 'border-green-500'}`}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="proYearly" id="proYearly" />
                  <div>
                    <p className="font-medium">연간 구독</p>
                    <p className="text-sm text-green-600 font-medium">2개월 무료! 17% 절약</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatPrice(PAYMENT_PRICES.proYearly)}원/년</p>
                  <p className="text-sm text-muted-foreground">
                    월 {formatPrice(Math.round(PAYMENT_PRICES.proYearly / 12))}원
                  </p>
                </div>
              </Label>
            </div>

            {/* 구분선 */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
            </div>

            {/* Premium 섹션 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="font-semibold text-sm text-muted-foreground">Premium 플랜</span>
              </div>

              <Label
                htmlFor="premiumMonthly"
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${plan === 'premiumMonthly' ? 'border-purple-500 bg-purple-50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="premiumMonthly" id="premiumMonthly" />
                  <div>
                    <p className="font-medium">월간 구독</p>
                    <p className="text-sm text-muted-foreground">매월 결제</p>
                  </div>
                </div>
                <p className="font-bold">{formatPrice(PAYMENT_PRICES.premiumMonthly)}원/월</p>
              </Label>

              <Label
                htmlFor="premiumYearly"
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${plan === 'premiumYearly' ? 'border-purple-500 bg-purple-50' : 'border-green-500'}`}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="premiumYearly" id="premiumYearly" />
                  <div>
                    <p className="font-medium">연간 구독</p>
                    <p className="text-sm text-green-600 font-medium">2개월 무료! 17% 절약</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatPrice(PAYMENT_PRICES.premiumYearly)}원/년</p>
                  <p className="text-sm text-muted-foreground">
                    월 {formatPrice(Math.round(PAYMENT_PRICES.premiumYearly / 12))}원
                  </p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* 무통장 입금 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            무통장 입금
          </CardTitle>
          <CardDescription>계좌이체로 안전하게 결제하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 계좌 정보 */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">{BANK_ACCOUNT.bankName}</p>
            <div className="flex items-center justify-between">
              <p className="text-xl font-mono font-bold">
                {BANK_ACCOUNT.accountNumber}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyAccount}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1 text-green-600" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    복사
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              예금주: {BANK_ACCOUNT.accountHolder}
            </p>
          </div>

          {/* 입금자명 입력 */}
          <div className="space-y-2">
            <Label htmlFor="depositorName">입금자명 *</Label>
            <Input
              id="depositorName"
              placeholder="실제 입금하실 이름을 입력해주세요"
              value={depositorName}
              onChange={(e) => setDepositorName(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              계좌에서 이체할 때 표시되는 이름과 동일하게 입력해주세요
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 결제 요약 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">결제 금액</span>
            <span className="text-2xl font-bold">
              {formatPrice(PAYMENT_PRICES[plan])}원
            </span>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={handleCheckout}
            disabled={loading || !depositorName.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                처리 중...
              </>
            ) : (
              '입금 신청하기'
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-4">
            입금 신청 후 위 계좌로 이체해주시면<br />
            확인 후 24시간 내에 구독이 활성화됩니다
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
