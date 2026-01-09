'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { PaymentMethods } from '@/components/billing/payment-methods'
import { ArrowLeft, Loader2, Crown, AlertTriangle } from 'lucide-react'
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

type Plan = 'proMonthly' | 'proYearly'
type PaymentMethod = 'toss' | 'kakao' | 'naver'

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isCancel = searchParams.get('cancel') === 'true'

  const [plan, setPlan] = useState<Plan>('proMonthly')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('toss')
  const [loading, setLoading] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(isCancel)
  const [cancelling, setCancelling] = useState(false)

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, paymentMethod }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '결제 준비에 실패했습니다')
      }

      // 결제 수단별 처리
      if (paymentMethod === 'toss') {
        // 토스 SDK 사용 (클라이언트 사이드)
        const { loadTossPayments } = await import('@tosspayments/payment-sdk')
        const tossPayments = await loadTossPayments(result.data.clientKey)
        await tossPayments.requestPayment('카드', {
          amount: result.data.amount,
          orderId: result.data.orderId,
          orderName: result.data.orderName,
          customerEmail: result.data.customerEmail,
          successUrl: result.data.successUrl,
          failUrl: result.data.failUrl,
        })
      } else if (result.data.redirectUrl) {
        // 카카오/네이버는 리다이렉트
        window.location.href = result.data.redirectUrl
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '결제에 실패했습니다')
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

      toast.success(result.message)
      router.push('/dashboard/billing')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '구독 취소에 실패했습니다')
    } finally {
      setCancelling(false)
      setCancelDialogOpen(false)
    }
  }

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
                정말 구독을 취소하시겠습니까? 현재 구독 기간이 끝나면 무료 플랜으로 전환되며, 다음 기능을 사용할 수 없게 됩니다:
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
        <Crown className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-2xl font-bold">Pro 업그레이드</h1>
        <p className="text-muted-foreground mt-1">
          무제한 AI 매칭과 지원서 작성 기능을 이용하세요
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
            <Label
              htmlFor="proMonthly"
              className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="proMonthly" id="proMonthly" />
                <div>
                  <p className="font-medium">월간 구독</p>
                  <p className="text-sm text-muted-foreground">매월 자동 결제</p>
                </div>
              </div>
              <p className="font-bold">{formatPrice(PAYMENT_PRICES.proMonthly)}원/월</p>
            </Label>

            <Label
              htmlFor="proYearly"
              className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border-primary"
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="proYearly" id="proYearly" />
                <div>
                  <p className="font-medium">연간 구독</p>
                  <p className="text-sm text-green-600">2개월 무료! 17% 절약</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatPrice(PAYMENT_PRICES.proYearly)}원/년</p>
                <p className="text-sm text-muted-foreground">
                  월 {formatPrice(Math.round(PAYMENT_PRICES.proYearly / 12))}원
                </p>
              </div>
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* 결제 수단 선택 */}
      <Card>
        <CardHeader>
          <CardTitle>결제 수단</CardTitle>
          <CardDescription>결제 수단을 선택하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentMethods
            selected={paymentMethod}
            onSelect={setPaymentMethod}
          />
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
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                결제 준비 중...
              </>
            ) : (
              `${formatPrice(PAYMENT_PRICES[plan])}원 결제하기`
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-4">
            결제 버튼을 클릭하면 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
